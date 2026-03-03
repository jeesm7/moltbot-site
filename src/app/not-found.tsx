import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HomeIcon } from "@heroicons/react/24/outline";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-bold text-muted-foreground/30 mb-4">
          404
        </h1>
        
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          Page not found
        </h2>
        
        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/">
              <HomeIcon className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
