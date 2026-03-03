"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { skills, categories, type SkillCategory } from "@/data/skills";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  RocketLaunchIcon,
  LockClosedIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

type SortOption = "popular" | "name" | "newest";

interface ServerStatus {
  status: string;
  id?: string;
  ipAddress?: string;
}

export default function SkillsMarketplacePage() {
  const [activeCategory, setActiveCategory] = useState<SkillCategory>("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("popular");
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);
  const [installedSlugs, setInstalledSlugs] = useState<Set<string>>(new Set());
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const { success, error: toastError } = useToast();

  const hasActiveServer = serverStatus?.status === "active";

  // Fetch server status on mount
  const fetchServerStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/instances/status");
      if (res.ok) {
        const data = await res.json();
        setServerStatus(data);
      } else {
        setServerStatus({ status: "none" });
      }
    } catch {
      setServerStatus({ status: "none" });
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  // Fetch installed skills on mount
  const fetchInstalledSkills = useCallback(async () => {
    try {
      const res = await fetch("/api/skills/installed");
      if (res.ok) {
        const data = await res.json();
        setInstalledSlugs(new Set(data.slugs || []));
      }
    } catch {
      // Silently fail - we'll just show all as uninstalled
    }
  }, []);

  useEffect(() => {
    fetchServerStatus();
    fetchInstalledSkills();
  }, [fetchServerStatus, fetchInstalledSkills]);

  const filteredSkills = useMemo(() => {
    let filtered = [...skills];

    // Category filter
    if (activeCategory !== "All") {
      filtered = filtered.filter((s) => s.category === activeCategory);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.author.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sort) {
      case "popular":
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
        filtered.sort((a, b) => a.slug.localeCompare(b.slug));
        break;
    }

    return filtered;
  }, [activeCategory, search, sort]);

  const handleInstall = async (slug: string) => {
    if (!hasActiveServer) return;
    if (installedSlugs.has(slug)) return;

    setInstallingSlug(slug);
    try {
      const res = await fetch("/api/skills/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setInstalledSlugs((prev) => new Set([...prev, slug]));
        success(data.message || "Skill installed successfully!");
      } else {
        toastError(data.error || "Failed to install skill");
      }
    } catch {
      toastError("Network error. Please try again.");
    } finally {
      setInstallingSlug(null);
    }
  };

  const formatDownloads = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* No-server banner */}
      {!loadingStatus && !hasActiveServer && serverStatus?.status !== "provisioning" && (
        <div className="mb-8 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5 p-5">
          <div className="flex items-center gap-3">
            <RocketLaunchIcon className="w-6 h-6 text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Deploy your agent to start installing skills
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Deploy your Moltbot agent first, then install skills from the marketplace.
              </p>
            </div>
            <Link href="/dashboard">
              <Button size="sm" className="rounded-full px-4 h-8 text-xs">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Deploying banner */}
      {!loadingStatus && serverStatus?.status === "provisioning" && (
        <div className="mb-8 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 p-5">
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Your agent is still deploying...
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Skills will be available once your agent is fully deployed. This usually takes 2-3 minutes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-semibold tracking-tight">Skills Marketplace</h1>
          <Badge variant="default" className="text-xs">
            {skills.length} skills
          </Badge>
        </div>
        <p className="text-muted-foreground text-lg">
          Extend your assistant with premium skills. One-click install.
        </p>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort:</span>
          {(
            [
              { value: "popular", label: "Most Popular" },
              { value: "name", label: "Name" },
              { value: "newest", label: "Newest" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              onClick={() => setSort(option.value)}
              className={`text-sm px-3 py-1 rounded-full transition-colors ${
                sort === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-6">
        Showing {filteredSkills.length} skill{filteredSkills.length !== 1 ? "s" : ""}
        {activeCategory !== "All" && ` in ${activeCategory}`}
      </p>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSkills.map((skill) => {
          const isInstalled = installedSlugs.has(skill.slug);
          const isInstalling = installingSlug === skill.slug;
          const isDisabled = !hasActiveServer || loadingStatus;

          return (
            <div
              key={skill.slug}
              className="group relative bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              {/* Premium Badge */}
              <div className="absolute top-4 right-4">
                <Badge
                  variant="secondary"
                  className="text-[10px] uppercase tracking-wider font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/20"
                >
                  Premium
                </Badge>
              </div>

              {/* Icon + Name */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-xl flex-shrink-0">
                  {skill.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">
                    {skill.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    by {skill.author}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                {skill.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                  <span>{formatDownloads(skill.downloads)} installs</span>
                </div>

                {isInstalled ? (
                  // Installed state
                  <div className="flex items-center gap-1.5 px-4 h-8 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    Installed
                  </div>
                ) : isInstalling ? (
                  // Installing state
                  <Button
                    size="sm"
                    className="rounded-full px-4 h-8 text-xs"
                    disabled
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Installing...
                    </span>
                  </Button>
                ) : isDisabled ? (
                  // Locked state - no active server
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full px-4 h-8 text-xs opacity-60 cursor-pointer hover:opacity-80"
                    onClick={() => toastError("Deploy your agent first to install skills from the marketplace.")}
                  >
                    <span className="flex items-center gap-1.5">
                      <LockClosedIcon className="w-3 h-3" />
                      Install
                    </span>
                  </Button>
                ) : (
                  // Normal install button
                  <Button
                    size="sm"
                    className="rounded-full px-4 h-8 text-xs"
                    onClick={() => handleInstall(skill.slug)}
                  >
                    Install
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredSkills.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground mb-2">No skills found</p>
          <p className="text-sm text-muted-foreground">
            Try a different search or category.
          </p>
        </div>
      )}
    </div>
  );
}
