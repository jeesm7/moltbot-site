"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  BoltIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

interface DailyUsage {
  date: string;
  total_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
}

interface UsageLog {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  channel: string;
}

export default function UsagePage() {
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [recentLogs, setRecentLogs] = useState<UsageLog[]>([]);
  const [totals, setTotals] = useState({
    requests: 0,
    tokens: 0,
    cost: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchUsage() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get daily usage for this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: daily } = await supabase
        .from("usage_daily")
        .select("*")
        .eq("customer_id", user.id)
        .gte("date", startOfMonth.toISOString().split("T")[0])
        .order("date", { ascending: false });

      setDailyUsage(daily || []);

      // Calculate totals
      const totalData = (daily || []).reduce((acc, day) => ({
        requests: acc.requests + (day.total_requests || 0),
        tokens: acc.tokens + (day.total_input_tokens || 0) + (day.total_output_tokens || 0),
        cost: acc.cost + parseFloat(day.total_cost_usd || "0"),
      }), { requests: 0, tokens: 0, cost: 0 });

      setTotals(totalData);

      // Get recent logs
      const { data: logs } = await supabase
        .from("usage_logs")
        .select("*")
        .eq("customer_id", user.id)
        .order("timestamp", { ascending: false })
        .limit(20);

      setRecentLogs(logs || []);
      setLoading(false);
    }

    fetchUsage();
  }, [supabase]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Usage</h1>
      <p className="text-muted-foreground mb-8">Monitor your AI usage this month</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cost
            </CardTitle>
            <CurrencyDollarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.cost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Requests
            </CardTitle>
            <BoltIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.requests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tokens
            </CardTitle>
            <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totals.tokens / 1000).toFixed(1)}k</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Daily Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyUsage.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No usage data yet</p>
          ) : (
            <div className="space-y-2">
              {dailyUsage.map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div>
                    <p className="font-medium">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {day.total_requests} requests
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${parseFloat(day.total_cost_usd?.toString() || "0").toFixed(4)}</p>
                    <p className="text-sm text-muted-foreground">
                      {((day.total_input_tokens || 0) + (day.total_output_tokens || 0)).toLocaleString()} tokens
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No requests yet</p>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div>
                    <p className="font-mono text-sm">{log.model}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()} • {log.channel || "api"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">${parseFloat(log.cost_usd?.toString() || "0").toFixed(6)}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.input_tokens} in / {log.output_tokens} out
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
