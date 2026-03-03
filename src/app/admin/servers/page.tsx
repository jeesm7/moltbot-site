import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircleIcon,
  ClockIcon,
  PauseIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface Server {
  id: string;
  customer_id: string;
  hetzner_server_id: string;
  name: string;
  ip_address: string;
  status: string;
  region: string;
  server_type: string;
  created_at: string;
}

interface Customer {
  id: string;
  email: string;
}

export default async function AdminServersPage() {
  const supabase = await createClient();

  const { data: servers } = await supabase
    .from("servers")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Get customer emails
  const customerIds = [...new Set((servers || []).map(s => s.customer_id))];
  const { data: customers } = await supabase
    .from("customers")
    .select("id, email")
    .in("id", customerIds);

  const customersById = (customers || []).reduce((acc, c) => {
    acc[c.id] = c;
    return acc;
  }, {} as Record<string, Customer>);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/10 text-green-600">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "provisioning":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600">
            <ClockIcon className="w-3 h-3 mr-1" />
            Deploying
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-orange-500/10 text-orange-600">
            <PauseIcon className="w-3 h-3 mr-1" />
            Paused
          </Badge>
        );
      case "deleted":
        return (
          <Badge variant="secondary">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Deleted
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Count by status
  const statusCounts = (servers || []).reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Servers</h1>
      <p className="text-muted-foreground mb-8">
        {servers?.length || 0} total servers •
        {statusCounts.active || 0} active •
        {statusCounts.provisioning || 0} deploying
      </p>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-muted-foreground">Server</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">IP</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Region</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {(servers || []).map((server: Server) => {
                const customer = customersById[server.customer_id];

                return (
                  <tr key={server.id} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <p className="font-medium font-mono text-sm">{server.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Hetzner: {server.hetzner_server_id}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{customer?.email || "Unknown"}</p>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(server.status)}
                    </td>
                    <td className="p-4 font-mono text-sm">
                      {server.ip_address || "-"}
                    </td>
                    <td className="p-4 text-sm">
                      {server.region} ({server.server_type})
                    </td>
                    <td className="p-4 text-muted-foreground text-sm">
                      {new Date(server.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {(!servers || servers.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              No servers deployed yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
