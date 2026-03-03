import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UsageDaily {
  customer_id: string;
  date: string;
  total_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: string;
}

interface UsageLog {
  id: string;
  customer_id: string;
  timestamp: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: string;
}

export default async function AdminUsagePage() {
  const supabase = await createClient();

  // Get date range
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const today = new Date();
  
  // Get daily usage for last 30 days
  const { data: dailyUsage } = await supabase
    .from("usage_daily")
    .select("*")
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: true });

  // Aggregate by date
  const usageByDate: Record<string, { requests: number; tokens: number; cost: number }> = (dailyUsage || []).reduce((acc: Record<string, { requests: number; tokens: number; cost: number }>, row) => {
    if (!acc[row.date]) {
      acc[row.date] = { requests: 0, tokens: 0, cost: 0 };
    }
    acc[row.date].requests += row.total_requests || 0;
    acc[row.date].tokens += (row.total_input_tokens || 0) + (row.total_output_tokens || 0);
    acc[row.date].cost += parseFloat(row.total_cost_usd || "0");
    return acc;
  }, {} as Record<string, { requests: number; tokens: number; cost: number }>);

  // Get recent usage logs for breakdown
  const { data: recentLogs } = await supabase
    .from("usage_logs")
    .select("provider, model, cost_usd, input_tokens, output_tokens")
    .gte("timestamp", thirtyDaysAgo.toISOString())
    .limit(5000);

  // Aggregate by provider
  const byProvider = (recentLogs || []).reduce((acc, log) => {
    const provider = log.provider || "unknown";
    if (!acc[provider]) {
      acc[provider] = { requests: 0, cost: 0, tokens: 0 };
    }
    acc[provider].requests++;
    acc[provider].cost += parseFloat(log.cost_usd || "0");
    acc[provider].tokens += (log.input_tokens || 0) + (log.output_tokens || 0);
    return acc;
  }, {} as Record<string, { requests: number; cost: number; tokens: number }>);

  // Aggregate by model
  const byModel = (recentLogs || []).reduce((acc, log) => {
    const model = log.model || "unknown";
    if (!acc[model]) {
      acc[model] = { requests: 0, cost: 0 };
    }
    acc[model].requests++;
    acc[model].cost += parseFloat(log.cost_usd || "0");
    return acc;
  }, {} as Record<string, { requests: number; cost: number }>);

  // Top customers by usage
  const { data: topCustomers } = await supabase
    .from("usage_daily")
    .select("customer_id, total_cost_usd")
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

  const customerUsage = (topCustomers || []).reduce((acc, row) => {
    if (!acc[row.customer_id]) {
      acc[row.customer_id] = 0;
    }
    acc[row.customer_id] += parseFloat(row.total_cost_usd || "0");
    return acc;
  }, {} as Record<string, number>);

  const topCustomerIds = Object.entries(customerUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Get customer emails
  const { data: customers } = await supabase
    .from("customers")
    .select("id, email")
    .in("id", topCustomerIds.map(([id]) => id));

  const customerEmailById = (customers || []).reduce((acc, c) => {
    acc[c.id] = c.email;
    return acc;
  }, {} as Record<string, string>);

  // Calculate totals
  const totalCost = Object.values(usageByDate).reduce((sum, d) => sum + d.cost, 0);
  const totalRequests = Object.values(usageByDate).reduce((sum, d) => sum + d.requests, 0);
  const totalTokens = Object.values(usageByDate).reduce((sum, d) => sum + d.tokens, 0);

  // Generate chart data (simple bar visualization)
  const sortedDates = Object.keys(usageByDate).sort();
  const maxCost = Math.max(...Object.values(usageByDate).map(d => d.cost), 1);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Usage Analytics</h1>
      <p className="text-muted-foreground mb-8">Last 30 days of LLM usage across all customers</p>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">AI provider costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalRequests.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">API calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(totalTokens / 1000000).toFixed(2)}M</p>
            <p className="text-xs text-muted-foreground">Input + output</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Usage Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Daily Usage (Cost)</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedDates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No usage data yet</p>
          ) : (
            <div className="space-y-1">
              {sortedDates.slice(-14).map((date) => {
                const data = usageByDate[date];
                const percentage = (data.cost / maxCost) * 100;
                return (
                  <div key={date} className="flex items-center gap-2">
                    <span className="w-20 text-xs text-muted-foreground font-mono">
                      {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-md transition-all"
                        style={{ width: `${Math.max(percentage, 1)}%` }}
                      />
                    </div>
                    <span className="w-16 text-xs font-medium text-right">
                      ${data.cost.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider and Model breakdown */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* By Provider */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Provider</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(byProvider).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No data</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(byProvider)
                  .sort((a, b) => b[1].cost - a[1].cost)
                  .map(([provider, data]) => (
                    <div key={provider} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <p className="font-medium capitalize">{provider}</p>
                        <p className="text-xs text-muted-foreground">
                          {data.requests.toLocaleString()} requests
                        </p>
                      </div>
                      <p className="font-semibold">${data.cost.toFixed(2)}</p>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Model */}
        <Card>
          <CardHeader>
            <CardTitle>Top Models</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(byModel).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No data</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(byModel)
                  .sort((a, b) => b[1].cost - a[1].cost)
                  .slice(0, 8)
                  .map(([model, data]) => (
                    <div key={model} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <p className="font-medium font-mono text-sm">{model}</p>
                        <p className="text-xs text-muted-foreground">
                          {data.requests.toLocaleString()} requests
                        </p>
                      </div>
                      <p className="font-semibold">${data.cost.toFixed(2)}</p>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers by Usage</CardTitle>
        </CardHeader>
        <CardContent>
          {topCustomerIds.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No usage data yet</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-muted-foreground">#</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Usage (30d)</th>
                </tr>
              </thead>
              <tbody>
                {topCustomerIds.map(([customerId, cost], index) => (
                  <tr key={customerId} className="border-b border-border last:border-0">
                    <td className="p-3 text-muted-foreground">{index + 1}</td>
                    <td className="p-3">{customerEmailById[customerId] || customerId.slice(0, 8)}</td>
                    <td className="p-3 text-right font-semibold">${cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
