"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error to console (in production, send to error tracking service)
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Something went wrong
        </h1>
        
        <p className="text-muted-foreground mb-6">
          We encountered an unexpected error. Please try again.
        </p>

        {error.digest && (
          <p className="text-xs text-muted-foreground mb-4 font-mono bg-muted p-2 rounded">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="outline">
            Try Again
          </Button>
          <Button onClick={() => window.location.href = "/"}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
