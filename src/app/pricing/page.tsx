import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckIcon, SparklesIcon } from "@heroicons/react/24/outline";

const planFeatures = [
  "Dedicated cloud instance",
  "All communication channels (Telegram, Discord, WhatsApp, Slack, and more)",
  "Unlimited usage",
  "48+ premium skills included",
  "All integrations included",
  "Automatic updates",
  "Email support",
];

const faqs = [
  {
    q: "What do I need to get started?",
    a: "Just sign up, pick a plan, and we'll guide you through everything.",
  },
  {
    q: "Do I need technical knowledge?",
    a: "Not at all. We handle all the technical setup, including deployment, updates, and monitoring. You just use your AI assistant.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, cancel anytime. No contracts.",
  },
  {
    q: "What communication channels are supported?",
    a: "Telegram, Discord, WhatsApp, Slack, and more.",
  },
  {
    q: "How does the AI work?",
    a: "Your assistant runs on Claude by Anthropic. During setup, we'll help you connect your own AI account so you have full control over your usage and costs.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight">moltbot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Log in
            </Link>
            <Button asChild size="sm" className="rounded-full">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          One plan. Everything you need. No surprises.
        </p>
      </section>

      {/* Single Plan Card */}
      <section className="pb-20 px-6">
        <div className="max-w-md mx-auto">
          <div className="relative rounded-2xl border border-primary ring-1 ring-primary bg-card p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-1">Moltbot</h3>
              <p className="text-sm text-muted-foreground">Your own AI assistant, fully managed</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold">$19.97</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <ul className="space-y-3 mb-8">
              {planFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button asChild className="w-full rounded-full">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-card rounded-xl p-6 border border-border">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-8">
            Get your own AI assistant up and running in minutes.
          </p>
          <Button asChild size="lg" className="rounded-full px-8">
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium">moltbot</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Moltbot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
