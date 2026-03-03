"""
Moltbot LLM Proxy Service

Routes all LLM requests through this proxy:
- Authenticates customer tokens
- Injects Jess's API keys (customer never sees them)
- Tracks usage per customer
- Reports to Stripe for billing

Endpoints:
- POST /v1/chat/completions - OpenAI-compatible chat endpoint
- GET /health - Health check
"""

import os
from datetime import datetime, date
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import litellm
from dotenv import load_dotenv

from auth import validate_customer_token, get_customer_by_id
from billing import calculate_cost, log_usage, report_to_stripe, check_usage_limits

load_dotenv()

# Configure LiteLLM with API keys
litellm.openai_key = os.getenv("OPENAI_API_KEY")
litellm.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
# litellm.google_key = os.getenv("GOOGLE_API_KEY")
# litellm.groq_key = os.getenv("GROQ_API_KEY")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Moltbot LLM Proxy starting...")
    yield
    print("👋 Moltbot LLM Proxy shutting down...")

app = FastAPI(
    title="Moltbot LLM Proxy",
    description="Routes LLM requests, tracks usage, handles billing",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Models
# ============================================

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str
    messages: list[ChatMessage]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 4096
    stream: Optional[bool] = False

class UsageInfo(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class ChatChoice(BaseModel):
    index: int
    message: ChatMessage
    finish_reason: str

class ChatResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: list[ChatChoice]
    usage: UsageInfo


# ============================================
# Endpoints
# ============================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "moltbot-llm-proxy",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/v1/chat/completions")
async def chat_completions(
    request: ChatRequest,
    authorization: str = Header(..., description="Bearer token")
):
    """
    OpenAI-compatible chat completions endpoint.
    Routes through LiteLLM and tracks usage.
    """
    
    # 1. Extract and validate customer token
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    customer = await validate_customer_token(token)
    
    if not customer:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # 2. Check usage limits
    usage_check = await check_usage_limits(customer["id"], customer["plan"])
    
    if not usage_check["allowed"]:
        raise HTTPException(
            status_code=403, 
            detail=f"Usage limit reached: {usage_check['reason']}"
        )
    
    # 3. Detect provider from model name
    model = request.model
    provider = detect_provider(model)
    
    # 4. Route through LiteLLM (uses our API keys, not customer's)
    try:
        response = await litellm.acompletion(
            model=model,
            messages=[{"role": m.role, "content": m.content} for m in request.messages],
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )
    except Exception as e:
        print(f"LiteLLM error: {e}")
        raise HTTPException(status_code=500, detail=f"LLM provider error: {str(e)}")
    
    # 5. Calculate cost
    input_tokens = response.usage.prompt_tokens
    output_tokens = response.usage.completion_tokens
    cost_usd = calculate_cost(provider, model, input_tokens, output_tokens)
    
    # 6. Log usage to database
    await log_usage(
        customer_id=customer["id"],
        provider=provider,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cost_usd=cost_usd,
        request_id=response.id,
    )
    
    # 7. Report to Stripe (if paying customer)
    if customer["plan"] in ["starter", "pro"] and customer.get("subscription_id"):
        await report_to_stripe(
            customer_id=customer["id"],
            plan=customer["plan"],
            cost_usd=cost_usd,
            subscription_id=customer["subscription_id"],
        )
    
    # 8. Return response
    return ChatResponse(
        id=response.id,
        created=int(datetime.utcnow().timestamp()),
        model=model,
        choices=[
            ChatChoice(
                index=0,
                message=ChatMessage(
                    role="assistant",
                    content=response.choices[0].message.content,
                ),
                finish_reason=response.choices[0].finish_reason or "stop",
            )
        ],
        usage=UsageInfo(
            prompt_tokens=input_tokens,
            completion_tokens=output_tokens,
            total_tokens=input_tokens + output_tokens,
        ),
    )


def detect_provider(model: str) -> str:
    """Detect LLM provider from model name"""
    model_lower = model.lower()
    
    if "gpt" in model_lower or "o1" in model_lower:
        return "openai"
    elif "claude" in model_lower:
        return "anthropic"
    elif "gemini" in model_lower:
        return "google"
    elif "llama" in model_lower or "mixtral" in model_lower:
        return "groq"
    else:
        return "openai"  # Default


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENV") == "development",
    )
