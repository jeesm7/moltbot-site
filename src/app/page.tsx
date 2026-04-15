import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckIcon, 
  ArrowRightIcon, 
  SparklesIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CursorArrowRaysIcon
} from "@heroicons/react/24/outline";
import { WaitlistForm } from "@/components/waitlist-form";

const features = [
  {
    icon: CpuChipIcon,
    title: "Your Own AI Instance",
    description: "A dedicated Claude installation running on your private cloud server. No shared resources, no rate limits, no waiting."
  },
  {
    icon: ShieldCheckIcon,
    title: "Enterprise Security",
    description: "Your data never leaves your server. Full encryption, audit logs, and SOC 2 compliant infrastructure."
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: "Every Channel Connected",
    description: "Email, Slack, WhatsApp, Discord, SMS, Telegram. Your AI responds wherever your business communicates."
  },
  {
    icon: ClockIcon,
    title: "Always On, Always Learning",
    description: "24/7 availability with context that persists across conversations. It remembers your preferences, your clients, your workflows."
  },
  {
    icon: CursorArrowRaysIcon,
    title: "Zero Technical Setup",
    description: "We handle deployment, updates, and monitoring. You just tell it what to do."
  },
  {
    icon: SparklesIcon,
    title: "Powered by Claude",
    description: "Your assistant runs on Claude by Anthropic. Smart, capable, and always improving."
  }
];

const useCases = [
  "Answer customer support tickets while you sleep",
  "Draft emails, proposals, and follow-ups in your voice",
  "Research competitors and summarize findings",
  "Schedule meetings and manage your calendar",
  "Qualify leads and route them to the right person",
  "Create content, social posts, and marketing copy"
];

const planFeatures = [
  "Dedicated cloud instance",
  "All channels (Telegram, Discord, WhatsApp, Slack & more)",
  "Unlimited conversations",
  "All integrations included",
  "Automatic updates",
  "Email support",
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Mesh gradient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="mesh-gradient mesh-1" />
        <div className="mesh-gradient mesh-2" />
        <div className="mesh-gradient mesh-3" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="glass rounded-2xl px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Moltbot" className="w-8 h-8 rounded-lg object-cover" />
              <span className="text-xl font-semibold tracking-tight">moltbot</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Log in
              </Link>
              <Button asChild size="sm" className="rounded-full">
                <Link href="#waitlist">Join Waitlist</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5">
            <span className="mr-2">🚀</span>
            Early Access. Limited spots available.
          </Badge>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1] mb-6">
            Your business.
            <br />
            <span className="text-gradient">Running on autopilot.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            A private AI assistant deployed on your own server. 
            It knows your business, handles your busywork, and works 24/7 while you focus on what matters.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-8 h-12 text-base">
              <Link href="#waitlist">
                Get Early Access
                <ArrowRightIcon className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 h-12 text-base">
              <Link href="#features">See How It Works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-16 px-6 border-y border-border/50">
        <div className="mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Stop drowning in busywork.</h2>
              <p className="text-muted-foreground leading-relaxed">
                You started a business to do meaningful work. Not to spend hours on emails, scheduling, and repetitive tasks. ChatGPT helps, but you still have to copy-paste everything. It forgets context. It&apos;s not connected to anything.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-4">What if your AI actually worked for you?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Moltbot runs 24/7 on your own server. It reads your emails, monitors your channels, and takes action. No copy-pasting. No switching tabs. It learns your voice, your preferences, your business. Like hiring an assistant who never sleeps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
            What can Moltbot do?
          </h2>
          <p className="text-lg text-muted-foreground mb-12">
            Anything you&apos;d ask an assistant to do. Just way faster.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            {useCases.map((useCase, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckIcon className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{useCase}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
              Built different. On purpose.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Not another chatbot. A fully managed AI that runs on your infrastructure.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-6 border-y border-border/50">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-4">Built by business owners, for business owners</p>
          <p className="text-2xl font-medium mb-8">
            &quot;I save <span className="text-gradient">20+ hours a week</span> on tasks I used to do manually.&quot;
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap text-sm text-muted-foreground">
            <span>✓ Email management</span>
            <span>✓ Lead qualification</span>
            <span>✓ Customer support</span>
            <span>✓ Content creation</span>
          </div>
        </div>
      </section>

      {/* Skills Marketplace Showcase */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5">
              <span className="mr-2">🧩</span>
              Skills Marketplace
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
              48+ Premium Skills. <span className="text-gradient">One-Click Install.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Extend your assistant with powerful integrations. From Tesla control to video generation, stock analysis to code review.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              { icon: "🧠", name: "AI Compound", desc: "Auto-learn and improve from every session" },
              { icon: "🔍", name: "Web Search", desc: "Search the web with DuckDuckGo" },
              { icon: "🔍", name: "DuckDuckGo Search", desc: "No API key required web search" },
              { icon: "🤖", name: "Agent Browser", desc: "Automate browser interactions" },
              { icon: "📊", name: "Stock Info Explorer", desc: "Real-time quotes and portfolio tracking" },
              { icon: "🔌", name: "My Tesla", desc: "Control Tesla vehicles via API" },
              { icon: "🛠️", name: "Clean Code", desc: "Pragmatic coding standards" },
              { icon: "💬", name: "Telegram Bot Builder", desc: "Build and manage Telegram bots" },
            ].map((skill, index) => (
              <div
                key={index}
                className="glass rounded-2xl p-5 hover:shadow-lg transition-shadow duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-lg mb-3">
                  {skill.icon}
                </div>
                <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                  {skill.name}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {skill.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 h-12 text-base">
              <Link href="/pricing">
                Browse All Skills
                <ArrowRightIcon className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6">
        <div className="mx-auto max-w-lg">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
              One plan. Everything included.
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Your own AI assistant, running on a dedicated cloud server.
            </p>
          </div>
          
          <div className="glass rounded-3xl p-8 ring-2 ring-primary">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Moltbot</h3>
              <p className="text-muted-foreground text-sm">Everything you need to get started</p>
            </div>
            <div className="mb-6">
              <span className="text-5xl font-semibold">$19.97</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {planFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              asChild 
              className="w-full rounded-full h-11"
            >
              <Link href="#waitlist">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Waitlist CTA Section */}
      <section id="waitlist" className="py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="glass rounded-3xl p-12 text-center">
            <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5">
              <span className="mr-2">🔥</span>
              Limited early access
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
              Get your own AI assistant
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Join the waitlist. We&apos;re onboarding founders one at a time to ensure a white-glove setup experience.
            </p>
            <WaitlistForm />
            <p className="text-sm text-muted-foreground mt-6">
              No credit card required. We&apos;ll reach out when your spot is ready.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/50">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Moltbot" className="w-6 h-6 rounded-md object-cover" />
            <span className="font-medium">moltbot</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Moltbot. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="https://novasoftai.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              NovaSoft AI
            </a>
            <a href="https://openclawconsultant.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              OpenClaw Consulting
            </a>
            <a href="https://openclawsetup.xyz" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              OpenClaw Setup
            </a>
            <a href="https://cyndra.ai" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Powered by Cyndra AI
            </a>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
