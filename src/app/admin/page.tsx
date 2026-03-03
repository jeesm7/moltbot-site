import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  UsersIcon,
  ServerStackIcon,
  CurrencyDollarIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";

export default async function AdminPage() {
  const supabase = await createClient();

  // Get metrics
  const [
    { count: totalCustomers },
    { count: activeServers },
    { data: monthlyUsage },
    { data: recentCustomers },
  ] = await Promise.all([
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("servers").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("usage_daily")
      .select("total_cost_usd")
      .gte("date", new Date(new Date().setDate(1)).toISOString().split("T")[0]),
    supabase.from("customers")
      .select("id, email, plan, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalRevenue = (monthlyUsage || []).reduce(
    (acc, row) => acc + parseFloat(row.total_cost_usd || "0"),
    0
  );

  // Calculate MRR (simplified - count active subscriptions)
  const { count: starterCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("plan", "starter");

  const { count: proCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("plan", "pro");

  const mrr = (starterCount || 0) * 147 + (proCount || 0) * 297;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">Overview of Moltbot SaaS metrics</p>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR
            </CardTitle>
            <CurrencyDollarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mrr.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {starterCount} Starter + {proCount} Pro
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customers
            </CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers || 0}</div>
            <p className="text-xs text-muted-foreground">Total registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Servers
            </CardTitle>
            <ServerStackIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeServers || 0}</div>
            <p className="text-xs text-muted-foreground">Running instances</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usage This Month
            </CardTitle>
            <BoltIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">AI costs</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {(recentCustomers || []).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No customers yet</p>
          ) : (
            <div className="space-y-2">
              {(recentCustomers || []).map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div>
                    <p className="font-medium">{customer.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(customer.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    customer.plan === "pro" ? "bg-primary/10 text-primary" :
                    customer.plan === "starter" ? "bg-blue-500/10 text-blue-600" :
                    customer.plan === "trial" ? "bg-yellow-500/10 text-yellow-600" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {customer.plan}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
