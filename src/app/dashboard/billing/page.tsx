"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCardIcon,
  CheckIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface Customer {
  plan: string;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  current_period_end: string | null;
}

const PLANS = [
  {
    id: "moltbot",
    name: "Moltbot",
    price: 19.97,
    description: "Your own AI assistant, fully managed",
    features: [
      "Dedicated cloud instance",
      "All communication channels",
      "Unlimited usage",
      "All integrations included",
      "Automatic updates",
      "Email support",
    ],
  },
];

export default function BillingPage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const { error: showError } = useToast();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchCustomer() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("customers")
        .select("plan, trial_ends_at, stripe_customer_id, current_period_end")
        .eq("id", user.id)
        .single();

      setCustomer(data);
      setLoading(false);
    }

    fetchCustomer();
  }, [supabase]);

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        showError("Failed to create checkout session");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      showError("Failed to start checkout");
    } finally {
      setUpgrading(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  const trialDaysLeft = customer?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(customer.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Billing</h1>
      <p className="text-muted-foreground mb-8">Manage your subscription and billing</p>

      {/* Current Plan */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold capitalize">{customer?.plan || "Trial"}</p>
              {customer?.plan === "trial" && (
                <p className="text-muted-foreground">
                  {trialDaysLeft} days remaining
                </p>
              )}
              {customer?.current_period_end && customer?.plan !== "trial" && (
                <p className="text-muted-foreground">
                  Renews {new Date(customer.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            {customer?.stripe_customer_id && customer?.plan !== "trial" && (
              <Button variant="outline" onClick={handleManageBilling}>
                Manage Billing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <h2 className="text-xl font-semibold mb-4">
        {customer?.plan === "trial" ? "Choose a Plan" : "Available Plans"}
      </h2>
      
      <div className="grid gap-6 max-w-md">
        {PLANS.map((plan) => {
          const isCurrent = customer?.plan === plan.id;
          
          return (
            <Card 
              key={plan.id}
              className="relative"
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isCurrent ? "secondary" : "default"}
                  disabled={isCurrent || upgrading !== null}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {isCurrent ? (
                    "Current Plan"
                  ) : upgrading === plan.id ? (
                    "Loading..."
                  ) : (
                    <>
                      Subscribe
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
