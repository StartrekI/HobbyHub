"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, Briefcase, GraduationCap, Plane, Lightbulb,
  MapPin, DollarSign, Users, Heart, Calendar, Sparkles, Clock, X,
  ChevronRight, Zap, TrendingUp, Globe
} from "lucide-react";
import { useStore } from "@/store";
import { getDistance, formatRelativeTime, FEED_TYPE_COLORS } from "@/lib/utils";
import type { FeedItem } from "@/types";

const FEED_FILTERS = [
  { value: "all", label: "All", icon: Zap },
  { value: "activity", label: "Activities", icon: Users },
  { value: "gig", label: "Gigs", icon: Briefcase },
  { value: "skill", label: "Skills", icon: GraduationCap },
  { value: "trip", label: "Trips", icon: Plane },
  { value: "idea", label: "Ideas", icon: Lightbulb },
  { value: "event", label: "Events", icon: Calendar },
];

const FEED_ICONS: Record<string, typeof Briefcase> = {
  activity: Users,
  gig: Briefcase,
  skill: GraduationCap,
  trip: Plane,
  idea: Lightbulb,
  event: Calendar,
};

const TYPE_LABELS: Record<string, string> = {
  activity: "Activity",
  gig: "Gig",
  skill: "Skill Exchange",
  trip: "Trip",
  idea: "Idea",
  event: "Event",
};

function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-white rounded-2xl overflow-hidden"
    >
      <div className="p-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl skeleton shrink-0" />
          <div className="flex-1 space-y-2.5 pt-0.5">
            <div className="w-14 h-3 skeleton" />
            <div className="w-3/4 h-4 skeleton" />
            <div className="w-full h-3 skeleton" />
          </div>
        </div>
        <div className="flex gap-2 mt-3.5 pt-3 border-t border-black/[0.03]">
          <div className="w-14 h-5 skeleton" />
          <div className="w-20 h-5 skeleton" />
          <div className="flex-1" />
          <div className="w-12 h-5 skeleton" />
        </div>
      </div>
    </motion.div>
  );
}

export default function DiscoveryFeed() {
  const user = useStore((s) => s.user);
  const userLocation = useStore((s) => s.userLocation);
  const setScreen = useStore((s) => s.setScreen);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const hasFetchedOnce = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const locationRef = useRef(userLocation);
  locationRef.current = userLocation;

  const fetchFeed = useCallback((showSkeleton: boolean) => {
    if (!user) return;
    if (showSkeleton) setLoading(true);
    else setRefreshing(true);

    const { lat, lng } = locationRef.current;
    fetch(`/api/discover?lat=${lat}&lng=${lng}&type=${filter}`)
      .then((r) => r.json())
      .then((data) => { setFeed(data); setLoading(false); setRefreshing(false); })
      .catch(() => { setLoading(false); setRefreshing(false); });
  }, [user, filter]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!hasFetchedOnce.current) {
      hasFetchedOnce.current = true;
      fetchFeed(true);
    } else {
      debounceRef.current = setTimeout(() => fetchFeed(false), 150);
    }
    return () => clearTimeout(debounceRef.current);
  }, [fetchFeed]);

  const searchLower = search.toLowerCase();
  const filtered = useMemo(() => {
    if (!searchLower) return feed;
    return feed.filter((item) =>
      (item.title || "").toLowerCase().includes(searchLower) ||
      (item.description || "").toLowerCase().includes(searchLower)
    );
  }, [feed, searchLower]);

  const resultCount = filtered.length;

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="h-full bg-[#f8f8fa] flex flex-col"
    >
      {/* ── Header ── */}
      <div className="bg-[#1a1a2e] px-5 pt-5 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setScreen("map")}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.15] transition-colors"
          >
            <ArrowLeft size={16} className="text-white/70" />
          </motion.button>
          <div className="flex-1">
            <h3 className="font-extrabold text-[22px] text-white tracking-tight">Discover</h3>
          </div>
          {!loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.08] rounded-full"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#a29bfe] animate-pulse" />
              <span className="text-[11px] text-white/70 font-semibold">{resultCount}</span>
            </motion.div>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities, gigs, trips..."
            className="w-full pl-10 pr-10 py-2.5 bg-white/[0.07] rounded-xl text-[13px] outline-none border border-white/[0.06] focus:bg-white/[0.12] focus:border-[#a29bfe]/40 transition-all placeholder:text-white/30 text-white"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.12 }}
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={10} className="text-white" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {FEED_FILTERS.map((f) => {
            const active = filter === f.value;
            const FilterIcon = f.icon;
            return (
              <motion.button
                key={f.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-1.5 px-3.5 py-[7px] rounded-full text-[12px] font-semibold whitespace-nowrap transition-all duration-200 border ${
                  active
                    ? "bg-[#6c5ce7] text-white border-[#6c5ce7] shadow-[0_0_12px_rgba(108,92,231,0.4)]"
                    : "bg-white/[0.07] text-white/50 border-white/[0.06] hover:bg-white/[0.12]"
                }`}
              >
                <FilterIcon size={13} />
                {f.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Refreshing indicator */}
      <AnimatePresence>
        {refreshing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 32, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-center bg-[#e8e5ff] overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-[1.5px] border-[#a29bfe] border-t-[#6c5ce7] rounded-full animate-spin" />
              <span className="text-[11px] text-[#6c5ce7] font-medium">Updating...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Feed ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 scroll-smooth">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} delay={i * 0.06} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="w-16 h-16 bg-[#1a1a2e] rounded-3xl flex items-center justify-center mb-4">
              <Globe size={28} className="text-[#6c5ce7]" />
            </div>
            <p className="text-[16px] font-bold text-[#1a1a2e]">Nothing here yet</p>
            <p className="text-[13px] text-[#9e9eb0] mt-1.5 text-center max-w-[240px]">
              {search ? "Try a different search term" : "Be the first to post something nearby"}
            </p>
            {search && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearch("")}
                className="mt-5 px-6 py-2.5 bg-[#6c5ce7] text-white text-[12px] font-semibold rounded-xl shadow-[0_0_20px_rgba(108,92,231,0.3)]"
              >
                Clear search
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            {/* Hero card for first item */}
            {filtered.length > 0 && (
              <HeroFeedCard item={filtered[0]} userLocation={userLocation} />
            )}
            {/* Grid for remaining items */}
            {filtered.length > 1 && (
              <div className="grid grid-cols-2 gap-2.5">
                {filtered.slice(1).map((item, idx) => (
                  <GridFeedCard key={item.id} item={item} idx={idx} userLocation={userLocation} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

const HeroFeedCard = ({ item, userLocation }: { item: FeedItem; userLocation: { lat: number; lng: number } }) => {
  const Icon = FEED_ICONS[item.feedType] || Users;
  const color = FEED_TYPE_COLORS[item.feedType] || "#6c5ce7";
  const dist = getDistance(userLocation.lat, userLocation.lng, item.lat, item.lng);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileTap={{ scale: 0.98 }}
      className="rounded-3xl overflow-hidden cursor-pointer relative"
      style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
    >
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)", backgroundSize: "30px 30px, 50px 50px" }} />
      <div className="relative p-5 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">
            {TYPE_LABELS[item.feedType] || item.feedType}
          </span>
          <span className="text-[10px] text-white/50 font-medium">{formatRelativeTime(item.createdAt)}</span>
        </div>
        <h3 className="text-[20px] font-extrabold text-white leading-tight mb-2">{item.title}</h3>
        {item.description && (
          <p className="text-[13px] text-white/60 line-clamp-2 leading-relaxed mb-4">{item.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[11px] text-white/70 font-medium">
              <MapPin size={11} /> {dist}
            </span>
            {item.creator && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-white/70">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-[8px] font-bold">
                  {item.creator.name?.charAt(0) || "?"}
                </span>
                {item.creator.name}
              </span>
            )}
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <Icon size={18} className="text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const GridFeedCard = ({ item, idx, userLocation }: { item: FeedItem; idx: number; userLocation: { lat: number; lng: number } }) => {
  const Icon = FEED_ICONS[item.feedType] || Users;
  const color = FEED_TYPE_COLORS[item.feedType] || "#6c5ce7";
  const dist = getDistance(userLocation.lat, userLocation.lng, item.lat, item.lng);
  const data = item.data as unknown as Record<string, unknown>;
  const staggerDelay = Math.min(idx * 0.04, 0.3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: staggerDelay, duration: 0.25 }}
      whileTap={{ scale: 0.96 }}
      className="bg-white rounded-2xl p-3.5 cursor-pointer border border-black/[0.04] flex flex-col"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}12` }}
        >
          <Icon size={15} style={{ color }} />
        </div>
        <span className="text-[9px] text-[#9e9eb0] font-medium">{formatRelativeTime(item.createdAt)}</span>
      </div>
      <span
        className="self-start px-1.5 py-[2px] rounded text-[8px] font-bold uppercase tracking-wider mb-1.5"
        style={{ background: `${color}10`, color }}
      >
        {TYPE_LABELS[item.feedType] || item.feedType}
      </span>
      <h4 className="font-bold text-[13px] leading-snug text-[#1a1a2e] line-clamp-2 mb-auto">{item.title}</h4>
      <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-black/[0.04]">
        <span className="text-[9px] text-[#9e9eb0] font-medium flex items-center gap-0.5">
          <MapPin size={8} /> {dist}
        </span>
        <span className="flex-1" />
        {item.feedType === "gig" && data.budget ? (
          <span className="text-[9px] font-bold text-[#00b894]">${String(data.budget)}</span>
        ) : item.feedType === "idea" ? (
          <span className="text-[9px] font-bold text-[#ff6b6b] flex items-center gap-0.5"><Heart size={8} /> {String(data.likes || 0)}</span>
        ) : item.feedType === "event" ? (
          <span className="text-[9px] font-bold text-[#6c5ce7]">Join →</span>
        ) : null}
      </div>
    </motion.div>
  );
};
