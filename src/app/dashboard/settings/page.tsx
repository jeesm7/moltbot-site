"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  UserIcon,
  KeyIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  SunIcon,
  MoonIcon,
  SwatchIcon,
} from "@heroicons/react/24/outline";

interface Customer {
  email: string;
  full_name: string | null;
}

export default function SettingsPage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const { success, error: showError } = useToast();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchCustomer() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("customers")
        .select("email, full_name")
        .eq("id", user.id)
        .single();

      setCustomer(data);
      setFullName(data?.full_name || "");
      setLoading(false);
    }

    fetchCustomer();
  }, [supabase]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("customers")
      .update({ full_name: fullName })
      .eq("id", user.id);

    if (error) {
      setMessage("Failed to save changes");
    } else {
      setMessage("Changes saved");
      setTimeout(() => setMessage(""), 3000);
    }

    setSaving(false);
  };

  const handlePasswordReset = async () => {
    if (!customer?.email) return;

    const { error } = await supabase.auth.resetPasswordForEmail(customer.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
    });

    if (error) {
      showError("Failed to send password reset email");
    } else {
      success("Password reset email sent! Check your inbox.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Settings</h1>
      <p className="text-muted-foreground mb-8">Manage your account settings</p>

      {/* Profile */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={customer?.email || ""}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            {message && (
              <p className="text-sm text-green-600">{message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SwatchIcon className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel of your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>Theme</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme("light")}
                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                  mounted && resolvedTheme === "light"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                }`}
              >
                <div className={`rounded-lg p-2 ${
                  mounted && resolvedTheme === "light" ? "bg-primary/10" : "bg-muted"
                }`}>
                  <SunIcon className={`h-5 w-5 ${
                    mounted && resolvedTheme === "light" ? "text-primary" : "text-muted-foreground"
                  }`} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Light</p>
                  <p className="text-xs text-muted-foreground">Clean and bright</p>
                </div>
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                  mounted && resolvedTheme === "dark"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                }`}
              >
                <div className={`rounded-lg p-2 ${
                  mounted && resolvedTheme === "dark" ? "bg-primary/10" : "bg-muted"
                }`}>
                  <MoonIcon className={`h-5 w-5 ${
                    mounted && resolvedTheme === "dark" ? "text-primary" : "text-muted-foreground"
                  }`} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Night</p>
                  <p className="text-xs text-muted-foreground">Easy on the eyes</p>
                </div>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyIcon className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Manage your password and security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Change your password by requesting a password reset email.
            </p>
            <Button variant="outline" onClick={handlePasswordReset}>
              Send Password Reset Email
            </Button>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Sign out of your account on this device.
            </p>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ExclamationTriangleIcon className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="destructive" disabled>
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
