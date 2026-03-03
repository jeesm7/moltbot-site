import Link from "next/link";
import { SparklesIcon } from "@heroicons/react/24/outline";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        {children}
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
