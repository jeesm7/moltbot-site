"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold mb-2">
            Something went wrong
          </h1>

          <p className="text-zinc-400 mb-6">
            A critical error occurred. Please refresh the page or try again.
          </p>

          {error.digest && (
            <p className="text-xs text-zinc-500 mb-4 font-mono bg-zinc-900 p-2 rounded">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
