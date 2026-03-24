"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, Briefcase, GraduationCap, Plane, Lightbulb,
  MapPin, DollarSign, Users, Heart, Calendar, Sparkles, Clock, X, ChevronRight
} from "lucide-react";
import { useStore } from "@/store";
import { getDistance, formatRelativeTime, FEED_TYPE_COLORS } from "@/lib/utils";
import type { FeedItem } from "@/types";

const FEED_FILTERS = [
  { value: "all", label: "All", icon: "🔥" },
  { value: "activity", label: "Activities", icon: "⚡" },
  { value: "gig", label: "Gigs", icon: "💰" },
  { value: "skill", label: "Skills", icon: "🧑‍💻" },
  { value: "trip", label: "Trips", icon: "✈️" },
  { value: "idea", label: "Ideas", icon: "💡" },
  { value: "event", label: "Events", icon: "🎉" },
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

/* Skeleton placeholder card */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100/80 shadow-sm animate-pulse">
      <div className="h-1.5 bg-gradient-to-r from-gray-100 via-gray-200/60 to-gray-100" />
      <div className="p-5">
        <div className="flex gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gray-100/80 shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="flex gap-2">
              <div className="w-16 h-4 bg-gray-100/80 rounded-lg" />
              <div className="w-10 h-4 bg-gray-50 rounded-lg" />
            </div>
            <div className="w-4/5 h-4.5 bg-gray-100/70 rounded-lg" />
            <div className="w-full h-3.5 bg-gray-50/80 rounded-lg" />
            <div className="w-2/3 h-3 bg-gray-50/60 rounded-lg" />
          </div>
        </div>
        <div className="flex gap-2.5 mt-4 pt-3.5 border-t border-gray-50">
          <div className="w-16 h-7 bg-gray-50 rounded-lg" />
          <div className="w-20 h-7 bg-gray-50 rounded-lg" />
          <div className="flex-1" />
          <div className="w-14 h-7 bg-gray-50 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function DiscoveryFeed() {
  const { user, userLocation, setScreen } = useStore();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const hasFetchedOnce = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchFeed = useCallback((showSkeleton: boolean) => {
    if (!user) return;
    if (showSkeleton) setLoading(true);
    else setRefreshing(true);

    fetch(`/api/discover?lat=${userLocation.lat}&lng=${userLocation.lng}&type=${filter}`)
      .then((r) => r.json())
      .then((data) => { setFeed(data); setLoading(false); setRefreshing(false); })
      .catch(() => { setLoading(false); setRefreshing(false); });
  }, [user, userLocation, filter]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    // First load: fetch instantly. Filter changes: short debounce, keep old data visible.
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
      className="absolute inset-0 bottom-[72px] bg-gray-50 z-[900] flex flex-col"
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setScreen("map")}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div className="flex-1">
            <h3 className="font-bold text-xl">Discover</h3>
            {!loading && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] text-gray-400 font-medium"
              >
                {resultCount} {resultCount === 1 ? "opportunity" : "opportunities"} nearby
                {refreshing && " · updating..."}
              </motion.p>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search opportunities..."
            className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all placeholder:text-gray-400"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={12} className="text-gray-500" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FEED_FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <motion.button
                key={f.value}
                whileTap={{ scale: 0.93 }}
                onClick={() => setFilter(f.value)}
                className={`relative px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                  active
                    ? "text-white border-violet-600 shadow-lg shadow-violet-200/50"
                    : "bg-white text-gray-500 border-gray-200 hover:border-violet-200 hover:text-violet-500 hover:bg-violet-50/30"
                }`}
                style={active ? { background: "linear-gradient(135deg, #7c3aed, #6366f1)" } : undefined}
              >
                {f.icon} {f.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
        {loading ? (
          /* Skeleton loading — feels instant */
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center justify-center py-20 text-gray-400"
          >
            <div className="relative w-24 h-24 mb-5">
              <div className="absolute inset-0 bg-violet-100/60 rounded-[28px] animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-violet-50 to-indigo-50 rounded-[28px] flex items-center justify-center border border-violet-100/50">
                <Sparkles size={36} className="text-violet-400" />
              </div>
            </div>
            <p className="text-base font-bold text-gray-600">No opportunities found</p>
            <p className="text-sm text-gray-400 mt-1.5 text-center max-w-[260px] leading-relaxed">
              {search ? "Try a different search term or filter" : "Be the first to create one and get discovered!"}
            </p>
            {search && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearch("")}
                className="mt-5 px-6 py-2.5 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-200/50"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
              >
                Clear Search
              </motion.button>
            )}
          </motion.div>
        ) : (
          filtered.map((item, idx) => (
            <FeedCard
              key={item.id}
              item={item}
              idx={idx}
              userLocation={userLocation}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}

/* Extracted card component — avoids re-rendering sibling cards */
const FeedCard = ({ item, idx, userLocation }: { item: FeedItem; idx: number; userLocation: { lat: number; lng: number } }) => {
  const Icon = FEED_ICONS[item.feedType] || Users;
  const color = FEED_TYPE_COLORS[item.feedType] || "#6C5CE7";
  const dist = getDistance(userLocation.lat, userLocation.lng, item.lat, item.lng);
  const data = item.data as unknown as Record<string, unknown>;
  // Cap stagger delay so large lists don't feel slow
  const staggerDelay = Math.min(idx * 0.03, 0.3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: staggerDelay, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-3xl overflow-hidden border border-gray-100/80 shadow-sm hover:shadow-lg active:shadow-md transition-all duration-200 cursor-pointer"
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 180px" }}
    >
      {/* Colored accent bar */}
      <div className="h-1 rounded-b-full mx-4" style={{ background: `linear-gradient(90deg, ${color}, ${color}88, ${color}33)` }} />

      <div className="p-5 pt-4">
        {/* Top row */}
        <div className="flex items-start gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ background: `linear-gradient(135deg, ${color}18, ${color}08)`, color, border: `1px solid ${color}12` }}
          >
            <Icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="px-2 py-[3px] rounded-md text-[10px] font-bold uppercase tracking-wider"
                style={{ background: `${color}14`, color }}
              >
                {TYPE_LABELS[item.feedType] || item.feedType}
              </span>
              <span className="flex items-center gap-0.5 text-[10px] text-gray-300 font-medium">
                <Clock size={9} /> {formatRelativeTime(item.createdAt)}
              </span>
            </div>
            <h4 className="font-bold text-[15px] leading-snug text-gray-900">{item.title}</h4>
            {item.description && (
              <p className="text-[13px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-gray-100/80">
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg font-medium">
            <MapPin size={11} /> {dist}
          </span>

          {item.creator && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
              <span
                className="w-[18px] h-[18px] rounded-md flex items-center justify-center text-white text-[8px] font-bold"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}
              >
                {item.creator.name?.charAt(0) || "?"}
              </span>
              <span className="font-medium text-gray-500 max-w-[80px] truncate">{item.creator.name}</span>
            </span>
          )}

          <span className="flex-1" />

          {item.feedType === "gig" && data.budget ? (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
              <DollarSign size={11} /> {String(data.budget)}
            </span>
          ) : null}
          {item.feedType === "skill" && data.isFree ? (
            <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">Free</span>
          ) : item.feedType === "skill" && data.price ? (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
              <DollarSign size={11} /> {String(data.price)}
            </span>
          ) : null}
          {item.feedType === "idea" ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-rose-500 font-semibold bg-rose-50 px-2 py-1 rounded-lg">
              <Heart size={11} /> {String(data.likes || 0)}
            </span>
          ) : null}
          {item.feedType === "trip" && data.budget ? (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-cyan-600 font-bold bg-cyan-50 px-2 py-1 rounded-lg">
              <DollarSign size={11} /> {String(data.budget)}
            </span>
          ) : null}
          {item.feedType === "event" ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-violet-50 text-violet-500 px-2 py-1 rounded-lg">
              <Users size={11} /> Join <ChevronRight size={11} />
            </span>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};
