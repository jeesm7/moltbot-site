import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ServerIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get customer data
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get server status
  const { data: server } = await supabase
    .from("servers")
    .select("*")
    .eq("customer_id", user.id)
    .is("deleted_at", null)
    .single();

  // Get this month's usage
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: usage } = await supabase
    .from("usage_daily")
    .select("total_cost_usd, total_requests")
    .eq("customer_id", user.id)
    .gte("date", startOfMonth.toISOString().split("T")[0]);

  const monthlyUsage = (usage || []).reduce(
    (acc, day) => ({
      cost: acc.cost + parseFloat(day.total_cost_usd || "0"),
      requests: acc.requests + (day.total_requests || 0),
    }),
    { cost: 0, requests: 0 }
  );

  // Calculate trial days remaining
  const trialDaysLeft = customer?.trial_ends_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(customer.trial_ends_at).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-500/10 text-green-500">
            <CheckCircleIcon className="w-4 h-4" />
            Running
          </span>
        );
      case "provisioning":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/10 text-yellow-500">
            <ClockIcon className="w-4 h-4" />
            Deploying
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-orange-500/10 text-orange-500">
            <ExclamationTriangleIcon className="w-4 h-4" />
            Paused
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
            Not deployed
          </span>
        );
    }
  };

  const displayName = customer?.full_name || user.email?.split("@")[0] || "there";

  return (
    <div className="p-8 max-w-4xl">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight mb-1">
          Welcome back, {displayName}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your AI assistant.
        </p>
      </div>

      {/* Trial Banner */}
      {customer?.plan === "trial" && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="font-semibold">Free Trial</p>
            <p className="text-sm text-muted-foreground">
              {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining on
              your trial
            </p>
          </div>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/dashboard/billing">Upgrade</Link>
          </Button>
        </div>
      )}

      {/* Agent Status Card */}
      <div className="rounded-2xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Agent Status</h2>
          {getStatusBadge(server?.status || null)}
        </div>

        {server ? (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">IP Address</p>
              <p className="font-mono text-sm">
                {server.ip_address || "Pending..."}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Region</p>
              <p className="text-sm">{server.region || "eu-central"} (Frankfurt)</p>
            </div>
            {server.status === "provisioning" && (
              <div className="col-span-2">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary to-accent animate-pulse" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Deploying your agent... This usually takes 2-3 minutes.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <ServerIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              No agent deployed yet
            </p>
            <Button asChild className="rounded-full">
              <Link href="/dashboard/server">Deploy Agent</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-1">Monthly Cost</p>
          <p className="text-2xl font-semibold">
            ${monthlyUsage.cost.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">AI usage</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-1">Plan</p>
          <p className="text-2xl font-semibold capitalize">
            {customer?.plan || "Trial"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {customer?.plan === "trial"
              ? `${trialDaysLeft} days left`
              : "Active"}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-1">Requests</p>
          <p className="text-2xl font-semibold">
            {monthlyUsage.requests.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </div>
      </div>

      {/* Getting Started Checklist */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-5">Getting Started</h2>
        <div className="space-y-3">
          {/* Step 1 */}
          <div
            className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
              server
                ? "bg-green-500/5 border border-green-500/10"
                : "bg-muted/30 border border-transparent"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                server
                  ? "bg-green-500/15 text-green-500"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {server ? "✓" : "1"}
            </div>
            <div className="flex-1">
              <p
                className={`font-medium ${
                  server ? "text-muted-foreground line-through" : ""
                }`}
              >
                Deploy your agent
              </p>
              <p className="text-sm text-muted-foreground">
                Get a dedicated cloud instance for your assistant
              </p>
            </div>
            {!server && (
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href="/dashboard/server">
                  Set up
                  <ArrowRightIcon className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            )}
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-transparent">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 border border-border text-muted-foreground">
              2
            </div>
            <div className="flex-1">
              <p className="font-medium text-muted-foreground">
                Connect your channels
              </p>
              <p className="text-sm text-muted-foreground">
                Link Telegram, Discord, or other messaging platforms
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-transparent">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 border border-border text-muted-foreground">
              3
            </div>
            <div className="flex-1">
              <p className="font-medium text-muted-foreground">
                Start chatting
              </p>
              <p className="text-sm text-muted-foreground">
                Your AI assistant is ready to help
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
