import Link from "next/link";
import { SparklesIcon, ClockIcon } from "@heroicons/react/24/outline";

export default function WaitlistPage() {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Mesh gradient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="mesh-gradient mesh-1" />
        <div className="mesh-gradient mesh-2" />
        <div className="mesh-gradient mesh-3" />
      </div>

      {/* Header */}
      <header className="p-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">moltbot</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="glass rounded-3xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
              <ClockIcon className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mb-3">
              You&apos;re on the waitlist
            </h1>
            <p className="text-muted-foreground mb-6">
              Moltbot is currently in private beta. We&apos;ll notify you when
              your account is activated.
            </p>
            <p className="text-sm text-muted-foreground">
              Questions?{" "}
              <a
                href="mailto:hello@moltbot.ceo"
                className="text-primary hover:underline font-medium"
              >
                Contact us
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          © 2025 Moltbot. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
