import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Customer {
  id: string;
  email: string;
  full_name: string | null;
  plan: string;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  created_at: string;
}

export default async function AdminCustomersPage() {
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  // Get server counts per customer
  const { data: servers } = await supabase
    .from("servers")
    .select("customer_id, status")
    .is("deleted_at", null);

  const serversByCustomer = (servers || []).reduce((acc, server) => {
    if (!acc[server.customer_id]) {
      acc[server.customer_id] = { active: 0, total: 0 };
    }
    acc[server.customer_id].total++;
    if (server.status === "active") {
      acc[server.customer_id].active++;
    }
    return acc;
  }, {} as Record<string, { active: number; total: number }>);

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "pro":
        return <Badge className="bg-primary/10 text-primary">Pro</Badge>;
      case "starter":
        return <Badge className="bg-blue-500/10 text-blue-600">Starter</Badge>;
      case "trial":
        return <Badge className="bg-yellow-500/10 text-yellow-600">Trial</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Customers</h1>
      <p className="text-muted-foreground mb-8">
        {customers?.length || 0} total customers
      </p>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Plan</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Servers</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Joined</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(customers || []).map((customer: Customer) => {
                const serverInfo = serversByCustomer[customer.id] || { active: 0, total: 0 };
                const trialDaysLeft = customer.trial_ends_at
                  ? Math.max(0, Math.ceil((new Date(customer.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                  : 0;

                return (
                  <tr key={customer.id} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <p className="font-medium">{customer.email}</p>
                      {customer.full_name && (
                        <p className="text-sm text-muted-foreground">{customer.full_name}</p>
                      )}
                    </td>
                    <td className="p-4">
                      {getPlanBadge(customer.plan)}
                      {customer.plan === "trial" && trialDaysLeft > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {trialDaysLeft} days left
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      {serverInfo.total === 0 ? (
                        <span className="text-muted-foreground">None</span>
                      ) : (
                        <span>
                          {serverInfo.active}/{serverInfo.total} active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {customer.stripe_customer_id && (
                        <a
                          href={`https://dashboard.stripe.com/customers/${customer.stripe_customer_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View in Stripe →
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {(!customers || customers.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              No customers yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
