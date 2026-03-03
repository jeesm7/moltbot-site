"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ServerIcon,
  GlobeAltIcon,
  CpuChipIcon,
  ArrowPathIcon,
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  InformationCircleIcon,
  RocketLaunchIcon,
  PaperAirplaneIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

// ── Types ────────────────────────────────────────────────────────

type Platform = "telegram" | "discord" | "whatsapp";

interface ChannelConfig {
  id: string;
  platform: Platform;
  display_name: string | null;
  is_active: boolean;
  created_at: string;
}

interface Server {
  id: string;
  hetzner_server_id: string;
  name: string;
  ip_address: string | null;
  status: string;
  region: string;
  server_type: string;
  channel_config_id: string | null;
  bot_display_name: string | null;
  created_at: string;
}

// ── Platform metadata ────────────────────────────────────────────

const PLATFORMS: Record<
  Platform,
  {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  telegram: {
    name: "Telegram",
    icon: PaperAirplaneIcon,
    color: "text-sky-600",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/20",
  },
  discord: {
    name: "Discord",
    icon: ChatBubbleOvalLeftEllipsisIcon,
    color: "text-indigo-600",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
  },
  whatsapp: {
    name: "WhatsApp",
    icon: PhoneIcon,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
};

// ── Main Page Component ──────────────────────────────────────────

export default function ServerPage() {
  const [server, setServer] = useState<Server | null>(null);
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [showChannelSetup, setShowChannelSetup] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const { success, error: showError } = useToast();
  const supabase = createClient();

  // ── Data fetching ──────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch server
    const { data: serverData } = await supabase
      .from("servers")
      .select("*")
      .eq("customer_id", user.id)
      .is("deleted_at", null)
      .single();
    setServer(serverData);

    // Fetch channel configs
    const { data: channelData } = await supabase
      .from("channel_configs")
      .select("id, platform, display_name, is_active, created_at")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });
    setChannels(channelData || []);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll for status updates while provisioning
  useEffect(() => {
    if (server?.status !== "provisioning") return;
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [server?.status, fetchData]);

  // ── Provision handler ──────────────────────────────────────────

  const handleProvision = async () => {
    if (channels.length === 0) {
      showError("Please configure a messaging channel first.");
      return;
    }
    if (!anthropicKey.trim()) {
      showError("Please enter your Anthropic API key.");
      return;
    }

    setProvisioning(true);
    try {
      const response = await fetch("/api/instances/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_config_id: channels[0].id,
          anthropic_api_key: anthropicKey.trim(),
          openai_api_key: openaiKey.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        success("Agent is being deployed! This takes 2-3 minutes.");
        await fetchData();
      } else {
        showError(data.error || "Failed to deploy agent");
      }
    } catch {
      showError("Failed to deploy agent. Please try again.");
    } finally {
      setProvisioning(false);
    }
  };

  // ── Channel deletion handler ───────────────────────────────────

  const handleDeleteChannel = async (channelId: string) => {
    try {
      const response = await fetch(`/api/channels?id=${channelId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        success("Channel removed.");
        await fetchData();
      } else {
        showError(data.error || "Failed to remove channel");
      }
    } catch {
      showError("Failed to remove channel");
    }
  };

  // ── Status badge ───────────────────────────────────────────────

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="default"
            className="bg-green-500/10 text-green-600 border-green-500/20"
          >
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Running
          </Badge>
        );
      case "provisioning":
        return (
          <Badge
            variant="default"
            className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
          >
            <ClockIcon className="w-3 h-3 mr-1" />
            Deploying
          </Badge>
        );
      case "paused":
        return (
          <Badge
            variant="default"
            className="bg-orange-500/10 text-orange-600 border-orange-500/20"
          >
            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
            Paused
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // ── Loading state ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">
        Deploy Agent
      </h1>
      <p className="text-muted-foreground mb-6 sm:mb-8">
        Set up your messaging channel and deploy your AI agent
      </p>

      {/* ── Active Server View ────────────────────────────────── */}
      {server ? (
        <div className="space-y-6">
          {/* Success State */}
          {server.status === "active" && server.bot_display_name && (
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <RocketLaunchIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-green-700 dark:text-green-400 mb-1">
                      Your bot is live!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Message your bot at{" "}
                      <span className="font-mono font-medium text-foreground">
                        {server.bot_display_name}
                      </span>{" "}
                      to start chatting.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agent Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2">
                  <ServerIcon className="h-5 w-5" />
                  {server.name}
                </CardTitle>
                {getStatusBadge(server.status)}
              </div>
              <CardDescription>
                Created {new Date(server.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    IP Address
                  </p>
                  <p className="font-mono text-sm">
                    {server.ip_address || (
                      <span className="text-muted-foreground">Pending...</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Region</p>
                  <p className="flex items-center gap-1 text-sm">
                    <GlobeAltIcon className="h-4 w-4" />
                    {server.region} (Frankfurt)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Server Type
                  </p>
                  <p className="flex items-center gap-1 text-sm">
                    <CpuChipIcon className="h-4 w-4" />
                    {server.server_type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Messaging
                  </p>
                  {channels.length > 0 ? (
                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const p = PLATFORMS[channels[0].platform];
                        const Icon = p.icon;
                        return (
                          <>
                            <Icon className={`h-4 w-4 ${p.color}`} />
                            <span className="text-sm">{p.name}</span>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                </div>
              </div>

              {/* Deploying progress */}
              {server.status === "provisioning" && (
                <div className="mt-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    Deploying your agent... This usually takes 2-3 minutes.
                  </p>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary to-accent animate-pulse"></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connected Channel Card */}
          {channels.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  Connected Channel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {channels.map((ch) => {
                    const p = PLATFORMS[ch.platform];
                    const Icon = p.icon;
                    return (
                      <div
                        key={ch.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${p.borderColor} ${p.bgColor}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className={`h-5 w-5 shrink-0 ${p.color}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{p.name}</p>
                            {ch.display_name && (
                              <p className="text-xs text-muted-foreground truncate">
                                {ch.display_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant="default"
                          className="bg-green-500/10 text-green-600 border-green-500/20"
                        >
                          Connected
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* ── No Server: Setup Flow ──────────────────────────── */
        <div className="space-y-6">
          {/* Step 1: Channel Setup */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <CardTitle>Connect a Messaging App</CardTitle>
                  <CardDescription>
                    Choose where your AI assistant will live
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {channels.length > 0 ? (
                /* Show configured channels */
                <div className="space-y-3">
                  {channels.map((ch) => {
                    const p = PLATFORMS[ch.platform];
                    const Icon = p.icon;
                    return (
                      <div
                        key={ch.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${p.borderColor} ${p.bgColor}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className={`h-5 w-5 shrink-0 ${p.color}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{p.name}</p>
                            {ch.display_name && (
                              <p className="text-xs text-muted-foreground truncate">
                                {ch.display_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="default"
                            className="bg-green-500/10 text-green-600 border-green-500/20"
                          >
                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                            Ready
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleDeleteChannel(ch.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowChannelSetup(true);
                      setSelectedPlatform(null);
                    }}
                    className="text-muted-foreground"
                  >
                    Change channel
                  </Button>
                </div>
              ) : showChannelSetup ? (
                /* Platform selection or config form */
                selectedPlatform ? (
                  <ChannelConfigForm
                    platform={selectedPlatform}
                    onBack={() => setSelectedPlatform(null)}
                    onSuccess={() => {
                      setShowChannelSetup(false);
                      setSelectedPlatform(null);
                      fetchData();
                      success("Channel configured!");
                    }}
                    onError={(msg) => showError(msg)}
                  />
                ) : (
                  <PlatformPicker onSelect={setSelectedPlatform} />
                )
              ) : (
                /* Initial empty state */
                <div className="text-center py-6">
                  <ChatBubbleLeftRightIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect Telegram, Discord, or WhatsApp so your bot knows
                    where to listen.
                  </p>
                  <Button
                    onClick={() => setShowChannelSetup(true)}
                    variant="outline"
                    className="rounded-full"
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                    Set Up Channel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: API Keys (BYOK) */}
          <Card className={channels.length === 0 ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    channels.length > 0
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  2
                </div>
                <div>
                  <CardTitle>Add Your API Keys</CardTitle>
                  <CardDescription>
                    Your bot needs an AI model to think with. Bring your own API key.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="anthropic-key">Anthropic API Key *</Label>
                <Input
                  id="anthropic-key"
                  type="password"
                  placeholder="sk-ant-..."
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  disabled={channels.length === 0}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Get one at{" "}
                  <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    console.anthropic.com
                  </a>
                  . You need an active billing plan.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="openai-key">
                  OpenAI API Key{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="openai-key"
                  type="password"
                  placeholder="sk-..."
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  disabled={channels.length === 0}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Enables GPT models as an alternative. Not required.
                </p>
              </div>
              {anthropicKey.trim() && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircleIcon className="h-4 w-4" />
                  API key entered
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Deploy Agent */}
          <Card
            className={channels.length === 0 || !anthropicKey.trim() ? "opacity-60" : ""}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    channels.length > 0 && anthropicKey.trim()
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  3
                </div>
                <div>
                  <CardTitle>Deploy Your Agent</CardTitle>
                  <CardDescription>
                    We'll deploy a dedicated server with your AI assistant
                    pre-configured and ready to chat.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-center py-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-muted-foreground mb-6">
                <span className="flex items-center gap-1">
                  <CpuChipIcon className="h-3.5 w-3.5" /> 2 vCPU, 4GB RAM
                </span>
                <span className="hidden sm:inline">·</span>
                <span className="flex items-center gap-1">
                  <GlobeAltIcon className="h-3.5 w-3.5" /> Frankfurt, Germany
                </span>
                <span className="hidden sm:inline">·</span>
                <span>~2-3 min setup</span>
              </div>
              <Button
                onClick={handleProvision}
                disabled={provisioning || channels.length === 0 || !anthropicKey.trim()}
                className="rounded-full px-8"
              >
                {provisioning ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <RocketLaunchIcon className="h-4 w-4 mr-2" />
                    Deploy Agent
                  </>
                )}
              </Button>
              {(channels.length === 0 || !anthropicKey.trim()) && (
                <p className="text-xs text-muted-foreground mt-3">
                  Complete steps 1 {!anthropicKey.trim() && "and 2"} first.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Platform Picker ──────────────────────────────────────────────

function PlatformPicker({
  onSelect,
}: {
  onSelect: (platform: Platform) => void;
}) {
  const platforms: { id: Platform; desc: string }[] = [
    {
      id: "telegram",
      desc: "Best for personal use. Create a bot with @BotFather in seconds.",
    },
    {
      id: "discord",
      desc: "Great for communities. Add your bot to any Discord server.",
    },
    {
      id: "whatsapp",
      desc: "For business. Requires a Meta Business account.",
    },
  ];

  return (
    <div className="grid gap-3">
      {platforms.map((p) => {
        const meta = PLATFORMS[p.id];
        const Icon = meta.icon;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`flex items-start gap-4 p-4 rounded-xl border ${meta.borderColor} hover:${meta.bgColor} transition-colors text-left w-full`}
          >
            <div
              className={`w-10 h-10 rounded-lg ${meta.bgColor} flex items-center justify-center shrink-0`}
            >
              <Icon className={`h-5 w-5 ${meta.color}`} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm">{meta.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Channel Config Form ──────────────────────────────────────────

function ChannelConfigForm({
  platform,
  onBack,
  onSuccess,
  onError,
}: {
  platform: Platform;
  onBack: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [saving, setSaving] = useState(false);

  // Telegram fields
  const [botToken, setBotToken] = useState("");
  const [botUsername, setBotUsername] = useState("");

  // Discord fields
  const [discordToken, setDiscordToken] = useState("");
  const [appId, setAppId] = useState("");

  // WhatsApp fields
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let config: Record<string, string> = {};
    let displayName: string | undefined;

    switch (platform) {
      case "telegram":
        config = { bot_token: botToken.trim() };
        if (botUsername.trim()) {
          config.bot_username = botUsername.trim().replace(/^@/, "");
          displayName = `@${config.bot_username}`;
        }
        break;
      case "discord":
        config = { bot_token: discordToken.trim(), app_id: appId.trim() };
        break;
      case "whatsapp":
        config = {
          phone_number_id: phoneNumberId.trim(),
          access_token: accessToken.trim(),
        };
        break;
    }

    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, config, display_name: displayName }),
      });

      const data = await response.json();
      if (data.channel) {
        onSuccess();
      } else {
        onError(data.error || "Failed to save channel");
      }
    } catch {
      onError("Failed to save channel. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const meta = PLATFORMS[platform];
  const Icon = meta.icon;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2">
        <div
          className={`w-10 h-10 rounded-lg ${meta.bgColor} flex items-center justify-center shrink-0`}
        >
          <Icon className={`h-5 w-5 ${meta.color}`} />
        </div>
        <div>
          <p className="font-medium">{meta.name} Setup</p>
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-primary hover:underline"
          >
            Choose a different platform
          </button>
        </div>
      </div>

      {/* Platform-specific fields */}
      {platform === "telegram" && (
        <>
          <div className={`rounded-lg border ${meta.borderColor} ${meta.bgColor} p-3`}>
            <div className="flex gap-2">
              <InformationCircleIcon className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">How to get your bot token:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>
                    Open Telegram and message{" "}
                    <span className="font-mono font-medium">@BotFather</span>
                  </li>
                  <li>
                    Send <span className="font-mono">/newbot</span> and follow the
                    prompts
                  </li>
                  <li>Copy the bot token BotFather gives you</li>
                </ol>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bot-token">Bot Token *</Label>
            <Input
              id="bot-token"
              type="password"
              placeholder="123456789:ABCdefGHI..."
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bot-username">
              Bot Username{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="bot-username"
              placeholder="@MyAwesomeBot"
              value={botUsername}
              onChange={(e) => setBotUsername(e.target.value)}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              So we can show you a direct link to your bot.
            </p>
          </div>
        </>
      )}

      {platform === "discord" && (
        <>
          <div className={`rounded-lg border ${meta.borderColor} ${meta.bgColor} p-3`}>
            <div className="flex gap-2">
              <InformationCircleIcon className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">How to get your Discord credentials:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>
                    Go to{" "}
                    <span className="font-mono font-medium">
                      discord.com/developers/applications
                    </span>
                  </li>
                  <li>Create a New Application</li>
                  <li>Copy the Application ID from General Information</li>
                  <li>Go to Bot &rarr; Reset Token &rarr; copy the token</li>
                  <li>
                    Enable Message Content Intent under Privileged Gateway
                    Intents
                  </li>
                </ol>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="discord-token">Bot Token *</Label>
            <Input
              id="discord-token"
              type="password"
              placeholder="Your Discord bot token"
              value={discordToken}
              onChange={(e) => setDiscordToken(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="app-id">Application ID *</Label>
            <Input
              id="app-id"
              placeholder="123456789012345678"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
        </>
      )}

      {platform === "whatsapp" && (
        <>
          <div className={`rounded-lg border ${meta.borderColor} ${meta.bgColor} p-3`}>
            <div className="flex gap-2">
              <InformationCircleIcon className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Requirements:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>A Meta Business account</li>
                  <li>A WhatsApp Business API phone number</li>
                  <li>
                    Go to{" "}
                    <span className="font-mono font-medium">
                      developers.facebook.com
                    </span>{" "}
                    to set up your app
                  </li>
                </ol>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone-number-id">Phone Number ID *</Label>
            <Input
              id="phone-number-id"
              placeholder="Your WhatsApp phone number ID"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="access-token">Access Token *</Label>
            <Input
              id="access-token"
              type="password"
              placeholder="Your permanent access token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Save Channel
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
