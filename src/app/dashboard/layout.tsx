import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  };

  return (
    <DashboardShell
      userEmail={user.email || ""}
      userName={user.user_metadata?.full_name || null}
      signOut={signOut}
    >
      {children}
    </DashboardShell>
  );
}
