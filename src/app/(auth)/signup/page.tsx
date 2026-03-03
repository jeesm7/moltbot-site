"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckIcon } from "@heroicons/react/24/outline";

// TODO: Remove allowlist when ready for public launch
const ALLOWED_EMAILS = ["jessmason23@gmail.com"];

const signupFeatures = [
  "Your own AI assistant",
  "All channels included",
  "Setup in minutes",
];

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Check allowlist
    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
      setError("Registration is currently invite-only.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/onboarding");
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="glass rounded-3xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            Create your account
          </h1>
          <p className="text-muted-foreground">
            Get your own AI assistant in minutes
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-8 p-4 rounded-2xl bg-accent/10 border border-accent/20">
          <ul className="space-y-2">
            {signupFeatures.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <CheckIcon className="w-4 h-4 text-accent flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="h-11 rounded-xl"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-full"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
