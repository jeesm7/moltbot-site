import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { 
  SparklesIcon, 
  HomeIcon,
  UsersIcon,
  ServerStackIcon,
  ChartBarIcon,
  BanknotesIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim());

const navigation = [
  { name: "Overview", href: "/admin", icon: HomeIcon },
  { name: "Customers", href: "/admin/customers", icon: UsersIcon },
  { name: "Servers", href: "/admin/servers", icon: ServerStackIcon },
  { name: "Usage", href: "/admin/usage", icon: ChartBarIcon },
  { name: "Financials", href: "/admin/financials", icon: BanknotesIcon },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user is admin
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    redirect("/dashboard");
  }

  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-border bg-card p-6 flex flex-col">
        {/* Logo */}
        <Link href="/admin" className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">moltbot</span>
        </Link>
        <p className="text-xs text-muted-foreground mb-8">Admin Panel</p>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Back to Dashboard */}
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          ← Back to Dashboard
        </Link>

        {/* Sign Out */}
        <form action={signOut}>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <ArrowRightStartOnRectangleIcon className="w-5 h-5 mr-3" />
            Sign out
          </Button>
        </form>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
}
