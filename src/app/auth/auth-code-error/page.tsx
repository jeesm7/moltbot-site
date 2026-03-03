import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function AuthCodeErrorPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-6">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="mesh-gradient mesh-1" />
        <div className="mesh-gradient mesh-2" />
        <div className="mesh-gradient mesh-3" />
      </div>

      <div className="glass rounded-3xl p-8 text-center max-w-md w-full">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-3">
          Login failed
        </h1>
        <p className="text-muted-foreground mb-6">
          Something went wrong during sign in. Please try again.
        </p>
        <Button asChild className="rounded-full px-8">
          <Link href="/login">Back to Login</Link>
        </Button>
      </div>
    </div>
  );
}
