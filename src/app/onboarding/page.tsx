"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  SparklesIcon,
  CheckCircleIcon,
  ServerStackIcon,
  CloudIcon,
  RocketLaunchIcon,
  ExclamationCircleIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";

type Step = "api-key" | "welcome" | "provisioning" | "ready" | "error";

interface Server {
  id: string;
  status: string;
  ip_address: string | null;
  name: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("api-key");
  const [server, setServer] = useState<Server | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provisioningStarted, setProvisioningStarted] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKeyValidated, setApiKeyValidated] = useState(false);
  const [validatingKey, setValidatingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Check if user already has a server
  useEffect(() => {
    const checkExistingServer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: existingServer } = await supabase
        .from("servers")
        .select("*")
        .eq("customer_id", user.id)
        .is("deleted_at", null)
        .single();

      if (existingServer) {
        setServer(existingServer);
        if (existingServer.status === "active") {
          setStep("ready");
        } else if (existingServer.status === "provisioning") {
          setStep("provisioning");
          setProvisioningStarted(true);
        }
      } else {
        // Fresh user — start with API key step
        setStep("api-key");
      }
    };

    checkExistingServer();
  }, [router, supabase]);

  // Poll for server status when provisioning
  useEffect(() => {
    if (step !== "provisioning" || !provisioningStarted) return;

    const pollStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("servers")
        .select("*")
        .eq("customer_id", user.id)
        .is("deleted_at", null)
        .single();

      if (data) {
        setServer(data);
        if (data.status === "active") {
          setStep("ready");
        }
      }
    };

    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [step, provisioningStarted, supabase]);

  const validateApiKey = async () => {
    setValidatingKey(true);
    setKeyError(null);

    try {
      const response = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, provider: "anthropic" }),
      });

      const data = await response.json();

      if (data.valid) {
        setApiKeyValidated(true);
        setStep("welcome");
      } else {
        setKeyError(data.error || "Invalid API key");
      }
    } catch {
      setKeyError("Failed to validate key. Please try again.");
    } finally {
      setValidatingKey(false);
    }
  };

  const startProvisioning = async () => {
    setStep("provisioning");
    setProvisioningStarted(true);
    setError(null);

    try {
      const response = await fetch("/api/instances/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anthropic_api_key: apiKey }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to deploy agent");
      }

      // Server record will be picked up by polling
    } catch (err) {
      console.error("Deployment error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setStep("error");
    }
  };

  const goToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-semibold tracking-tight">moltbot</span>
        </div>

        {/* API Key Step */}
        {step === "api-key" && (
          <div className="text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <KeyIcon className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mb-3">
              Connect your API key
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Moltbot uses your own Anthropic API key. You pay Anthropic directly for usage.
            </p>

            {/* Guide */}
            <div className="text-left bg-muted/30 rounded-2xl p-5 mb-6 max-w-md mx-auto border border-border/50">
              <p className="text-sm font-medium mb-3">How to get your key:</p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>
                  Go to{" "}
                  <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    console.anthropic.com
                  </a>
                </li>
                <li>Sign up or log in</li>
                <li>Click &quot;API Keys&quot; in the left sidebar</li>
                <li>Click &quot;Create Key&quot;, name it &quot;moltbot&quot;</li>
                <li>Copy the key (starts with <span className="font-mono text-xs">sk-ant-</span>)</li>
                <li>
                  Add billing at{" "}
                  <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    console.anthropic.com/settings/billing
                  </a>
                </li>
              </ol>
            </div>

            {/* Input */}
            <div className="max-w-md mx-auto space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="apiKey">Anthropic API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-ant-..."
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setApiKeyValidated(false);
                    setKeyError(null);
                  }}
                  className="h-11 rounded-xl font-mono"
                />
              </div>

              {keyError && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-left">
                  {keyError}
                </div>
              )}

              {apiKeyValidated && (
                <div className="bg-green-500/10 text-green-600 text-sm p-3 rounded-lg flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4" />
                  API key is valid
                </div>
              )}

              <Button
                onClick={validateApiKey}
                disabled={!apiKey.trim() || validatingKey}
                className="w-full h-11 rounded-full"
              >
                {validatingKey ? "Validating..." : "Validate Key"}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              Or{" "}
              <button
                onClick={goToDashboard}
                className="text-primary hover:underline"
              >
                skip to dashboard
              </button>
            </p>
          </div>
        )}

        {/* Welcome Step */}
        {step === "welcome" && (
          <div className="text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <RocketLaunchIcon className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mb-3">
              Welcome to Moltbot!
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Let&apos;s set up your personal AI assistant. We&apos;ll deploy a dedicated
              agent just for you. This takes about 2-3 minutes.
            </p>
            <Button 
              onClick={startProvisioning} 
              size="lg" 
              className="rounded-full px-8"
            >
              <ServerStackIcon className="w-5 h-5 mr-2" />
              Deploy My Agent
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Or{" "}
              <button 
                onClick={goToDashboard}
                className="text-primary hover:underline"
              >
                skip to dashboard
              </button>
            </p>
          </div>
        )}

        {/* Deploying Step */}
        {step === "provisioning" && (
          <div className="text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative">
              <CloudIcon className="w-10 h-10 text-primary animate-pulse" />
              {/* Animated ring */}
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mb-3">
              Deploying your agent...
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              We&apos;re deploying a dedicated AI agent for you.
              This usually takes 2-3 minutes.
            </p>

            {/* Progress steps */}
            <div className="max-w-xs mx-auto space-y-4 text-left mb-8">
              <ProgressStep
                label="Creating cloud instance"
                status="complete"
              />
              <ProgressStep
                label="Installing software"
                status={server?.ip_address ? "complete" : "loading"}
              />
              <ProgressStep
                label="Configuring AI assistant"
                status={server?.ip_address ? "loading" : "pending"}
              />
              <ProgressStep
                label="Running final checks"
                status="pending"
              />
            </div>

            {server?.ip_address && (
              <p className="text-sm text-muted-foreground">
                Server IP: <span className="font-mono">{server.ip_address}</span>
              </p>
            )}
          </div>
        )}

        {/* Ready Step */}
        {step === "ready" && (
          <div className="text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircleIcon className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mb-3">
              You&apos;re all set!
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Your AI assistant is ready. You can now connect your communication
              channels and start chatting.
            </p>

            {server && (
              <div className="bg-muted/50 rounded-xl p-4 mb-8 max-w-xs mx-auto">
                <p className="text-sm text-muted-foreground mb-1">Server IP</p>
                <p className="font-mono">{server.ip_address}</p>
              </div>
            )}

            <Button
              onClick={goToDashboard}
              size="lg"
              className="rounded-full px-8"
            >
              Go to Dashboard
              <span className="ml-2">→</span>
            </Button>
          </div>
        )}

        {/* Error Step */}
        {step === "error" && (
          <div className="text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <ExclamationCircleIcon className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mb-3">
              Something went wrong
            </h1>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              We couldn&apos;t deploy your agent. Don&apos;t worry, you can try again
              or contact support.
            </p>
            {error && (
              <p className="text-sm text-red-500 mb-8 max-w-md mx-auto font-mono bg-red-500/10 p-3 rounded-lg">
                {error}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => {
                  setStep("welcome");
                  setError(null);
                }}
                variant="outline"
                className="rounded-full"
              >
                Try Again
              </Button>
              <Button
                onClick={goToDashboard}
                className="rounded-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressStep({
  label,
  status,
}: {
  label: string;
  status: "pending" | "loading" | "complete";
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        {status === "complete" && (
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
          </div>
        )}
        {status === "loading" && (
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          </div>
        )}
        {status === "pending" && (
          <div className="w-6 h-6 rounded-full border-2 border-muted" />
        )}
      </div>
      <span
        className={
          status === "complete"
            ? "text-muted-foreground"
            : status === "loading"
            ? "text-foreground font-medium"
            : "text-muted-foreground"
        }
      >
        {label}
      </span>
    </div>
  );
}
