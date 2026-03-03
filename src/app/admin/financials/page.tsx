import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

// Server cost per month (Hetzner CX22)
const SERVER_COST_PER_MONTH = 5.09; // EUR ≈ $5.50
const SERVER_COST_USD = 5.50;

export default async function AdminFinancialsPage() {
  const supabase = await createClient();

  // Get all customers with their plans
  const { data: customers } = await supabase
    .from("customers")
    .select("id, plan, created_at");

  // Count active subscriptions
  const planCounts = (customers || []).reduce((acc, c) => {
    acc[c.plan] = (acc[c.plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate MRR from subscriptions
  const moltbotMRR = (planCounts.moltbot || 0) * 19.97;
  const starterMRR = (planCounts.starter || 0) * 147;
  const proMRR = (planCounts.pro || 0) * 297;
  const subscriptionMRR = moltbotMRR + starterMRR + proMRR;

  // Get active servers count
  const { count: activeServers } = await supabase
    .from("servers")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const serverCostsMonthly = (activeServers || 0) * SERVER_COST_USD;

  // Get usage cost for current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthlyUsage } = await supabase
    .from("usage_daily")
    .select("total_cost_usd")
    .gte("date", startOfMonth.toISOString().split("T")[0]);

  const aiCostsThisMonth = (monthlyUsage || []).reduce(
    (sum, row) => sum + parseFloat(row.total_cost_usd || "0"),
    0
  );

  // Calculate usage revenue (cost + markup)
  // Assuming average 17.5% markup (between 15% and 20%)
  const usageRevenue = aiCostsThisMonth * 1.175;

  // Total revenue
  const totalMRR = subscriptionMRR + usageRevenue;

  // Total costs
  const totalCosts = serverCostsMonthly + aiCostsThisMonth;

  // Gross margin
  const grossProfit = totalMRR - totalCosts;
  const grossMargin = totalMRR > 0 ? (grossProfit / totalMRR) * 100 : 0;

  // Get historical data for chart (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: historicalUsage } = await supabase
    .from("usage_daily")
    .select("date, total_cost_usd")
    .gte("date", sixMonthsAgo.toISOString().split("T")[0]);

  // Group by month
  const usageByMonth = (historicalUsage || []).reduce((acc, row) => {
    const month = row.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += parseFloat(row.total_cost_usd || "0");
    return acc;
  }, {} as Record<string, number>);

  const months = Object.keys(usageByMonth).sort();
  const maxMonthlyUsage = Math.max(...Object.values(usageByMonth), 1);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Financials</h1>
          <p className="text-muted-foreground">Revenue, costs, and margins</p>
        </div>
        <Button asChild variant="outline">
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ArrowTopRightOnSquareIcon className="w-4 h-4 mr-2" />
            Stripe Dashboard
          </a>
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              ${totalMRR.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">Subscriptions + usage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Costs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-500">
              ${totalCosts.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">Servers + AI</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gross Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${grossProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
              ${grossProfit.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">Before overhead</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gross Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${grossMargin >= 0 ? "text-green-600" : "text-red-500"}`}>
              {grossMargin.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {grossMargin >= 70 ? "Healthy" : grossMargin >= 50 ? "OK" : "Needs improvement"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Monthly recurring + usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Moltbot Subscriptions</p>
                <p className="text-sm text-muted-foreground">
                  {planCounts.moltbot || 0} × $19.97/mo
                </p>
              </div>
              <p className="text-xl font-semibold">${moltbotMRR.toFixed(2)}</p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Starter (Legacy)</p>
                <p className="text-sm text-muted-foreground">
                  {planCounts.starter || 0} × $147/mo
                </p>
              </div>
              <p className="text-xl font-semibold">${starterMRR}</p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Pro (Legacy)</p>
                <p className="text-sm text-muted-foreground">
                  {planCounts.pro || 0} × $297/mo
                </p>
              </div>
              <p className="text-xl font-semibold">${proMRR}</p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Usage Revenue</p>
                <p className="text-sm text-muted-foreground">
                  AI costs + ~17.5% markup
                </p>
              </div>
              <p className="text-xl font-semibold">${usageRevenue.toFixed(2)}</p>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Total Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-600">${totalMRR.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
            <CardDescription>Infrastructure + AI providers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Server Hosting</p>
                <p className="text-sm text-muted-foreground">
                  {activeServers || 0} servers × ${SERVER_COST_USD}/mo
                </p>
              </div>
              <p className="text-xl font-semibold">${serverCostsMonthly.toFixed(2)}</p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">AI Provider Costs</p>
                <p className="text-sm text-muted-foreground">
                  OpenAI, Anthropic, etc.
                </p>
              </div>
              <p className="text-xl font-semibold">${aiCostsThisMonth.toFixed(2)}</p>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Total Monthly Costs</p>
                <p className="text-2xl font-bold text-red-500">${totalCosts.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Usage Costs */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>AI Costs by Month</CardTitle>
          <CardDescription>Historical usage costs (last 6 months)</CardDescription>
        </CardHeader>
        <CardContent>
          {months.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No historical data yet</p>
          ) : (
            <div className="space-y-2">
              {months.map((month) => {
                const cost = usageByMonth[month];
                const percentage = (cost / maxMonthlyUsage) * 100;
                const [year, mon] = month.split("-");
                const monthName = new Date(parseInt(year), parseInt(mon) - 1).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                });

                return (
                  <div key={month} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-muted-foreground">{monthName}</span>
                    <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500/80 to-orange-500/80 rounded-lg transition-all"
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                    </div>
                    <span className="w-20 text-sm font-medium text-right">${cost.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 rounded-lg bg-yellow-500/10">
              <p className="text-3xl font-bold text-yellow-600">{planCounts.trial || 0}</p>
              <p className="text-sm text-muted-foreground">Trial</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/10">
              <p className="text-3xl font-bold text-primary">{planCounts.moltbot || 0}</p>
              <p className="text-sm text-muted-foreground">Moltbot</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-500/10">
              <p className="text-3xl font-bold text-blue-600">{planCounts.starter || 0}</p>
              <p className="text-sm text-muted-foreground">Starter (Legacy)</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-indigo-500/10">
              <p className="text-3xl font-bold text-indigo-600">{planCounts.pro || 0}</p>
              <p className="text-sm text-muted-foreground">Pro (Legacy)</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-3xl font-bold text-muted-foreground">{planCounts.cancelled || 0}</p>
              <p className="text-sm text-muted-foreground">Cancelled</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
