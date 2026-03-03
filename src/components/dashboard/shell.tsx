"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { ToastProvider } from "@/components/ui/toast";
import {
  SparklesIcon,
  HomeIcon,
  ServerIcon,
  ChartBarIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  PuzzlePieceIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: HomeIcon, exact: true },
  { name: "Skills", href: "/dashboard/skills", icon: PuzzlePieceIcon, exact: false },
  { name: "Deploy Agent", href: "/dashboard/server", icon: ServerIcon, exact: false },
  { name: "Usage", href: "/dashboard/usage", icon: ChartBarIcon, exact: false },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCardIcon, exact: false },
  { name: "Settings", href: "/dashboard/settings", icon: Cog6ToothIcon, exact: false },
];

interface DashboardShellProps {
  children: React.ReactNode;
  userEmail: string;
  userName: string | null;
  signOut: () => Promise<void>;
}

export function DashboardShell({
  children,
  userEmail,
  userName,
  signOut,
}: DashboardShellProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 mb-10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <SparklesIcon className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-semibold tracking-tight">moltbot</span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User info + Theme + Sign Out */}
      <div className="border-t border-border pt-4 space-y-3">
        <div className="px-3">
          {userName && (
            <p className="text-sm font-medium truncate">{userName}</p>
          )}
          <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {mounted && resolvedTheme === "dark" ? (
            <SunIcon className="w-4 h-4 mr-2.5" />
          ) : (
            <MoonIcon className="w-4 h-4 mr-2.5" />
          )}
          {mounted ? (resolvedTheme === "dark" ? "Light mode" : "Night mode") : "Theme"}
        </Button>
        <form action={signOut}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <ArrowRightStartOnRectangleIcon className="w-4 h-4 mr-2.5" />
            Sign out
          </Button>
        </form>
      </div>
    </>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 border-r border-border bg-card p-6 flex-col z-30">
          {sidebarContent}
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-14 border-b border-border bg-card z-30 flex items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">moltbot</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="w-5 h-5" />
            ) : (
              <Bars3Icon className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 bg-black/40 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="md:hidden fixed left-0 top-0 h-full w-64 border-r border-border bg-card p-6 flex flex-col z-50">
              {sidebarContent}
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 md:ml-64 mt-14 md:mt-0">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
