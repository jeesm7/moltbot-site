import { SparklesIcon } from "@heroicons/react/24/outline";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
          <SparklesIcon className="w-6 h-6 text-white" />
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
