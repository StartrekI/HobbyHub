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

/* Skeleton placeholder card */
function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-white rounded-[20px] overflow-hidden animate-pulse"
    >
      <div className="p-4">
        <div className="flex gap-3">
          <div className="w-11 h-11 rounded-xl bg-gray-100 shrink-0" />
          <div className="flex-1 space-y-2.5 pt-0.5">
            <div className="w-14 h-3.5 bg-gray-100 rounded-md" />
            <div className="w-3/4 h-4 bg-gray-100 rounded-md" />
            <div className="w-full h-3 bg-gray-50 rounded-md" />
          </div>
        </div>
        <div className="flex gap-2 mt-3.5 pt-3 border-t border-gray-50">
          <div className="w-14 h-6 bg-gray-50 rounded-md" />
          <div className="w-20 h-6 bg-gray-50 rounded-md" />
          <div className="flex-1" />
          <div className="w-12 h-6 bg-gray-50 rounded-md" />
        </div>
      </div>
    </motion.div>
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
      className="h-full bg-[#f5f5f7] flex flex-col"
    >
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-2xl border-b border-gray-200/40">
        {/* Title row */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setScreen("map")}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={16} className="text-gray-600" />
          </motion.button>
          <div className="flex-1">
            <h3 className="font-extrabold text-[22px] text-gray-900 tracking-tight">Discover</h3>
          </div>
          {!loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 rounded-full"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-[11px] text-violet-600 font-semibold">
                {resultCount}
              </span>
            </motion.div>
          )}
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activities, gigs, trips..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-100/80 rounded-full text-[13px] outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:shadow-sm transition-all placeholder:text-gray-400"
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.12 }}
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-300 hover:bg-gray-400 rounded-full flex items-center justify-center transition-colors"
                >
                  <X size={10} className="text-white" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto px-5 pb-3 no-scrollbar">
          {FEED_FILTERS.map((f) => {
            const active = filter === f.value;
            const FilterIcon = f.icon;
            return (
              <motion.button
                key={f.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-1.5 px-3.5 py-[7px] rounded-full text-[12px] font-semibold whitespace-nowrap transition-all duration-200 ${
                  active
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-gray-100/80 text-gray-500 hover:bg-gray-200/80"
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
            className="flex items-center justify-center bg-violet-50 overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-[1.5px] border-violet-300 border-t-violet-600 rounded-full animate-spin" />
              <span className="text-[11px] text-violet-600 font-medium">Updating...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 space-y-2 scroll-smooth">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
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
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Globe size={28} className="text-gray-300" />
            </div>
            <p className="text-[15px] font-bold text-gray-800">Nothing here yet</p>
            <p className="text-[13px] text-gray-400 mt-1 text-center max-w-[240px]">
              {search ? "Try a different search term" : "Be the first to post something nearby"}
            </p>
            {search && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearch("")}
                className="mt-4 px-5 py-2 bg-gray-900 text-white text-[12px] font-semibold rounded-full"
              >
                Clear search
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
  const staggerDelay = Math.min(idx * 0.03, 0.3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: staggerDelay, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      whileTap={{ scale: 0.985 }}
      className="bg-white rounded-[20px] overflow-hidden active:bg-gray-50 transition-colors duration-150 cursor-pointer"
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 160px" }}
    >
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${color}12`, color }}
          >
            <Icon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="px-1.5 py-[2px] rounded text-[9px] font-bold uppercase tracking-wider"
                style={{ background: `${color}10`, color }}
              >
                {TYPE_LABELS[item.feedType] || item.feedType}
              </span>
              <span className="text-[10px] text-gray-300 font-medium">
                {formatRelativeTime(item.createdAt)}
              </span>
            </div>
            <h4 className="font-bold text-[14px] leading-snug text-gray-900 mt-0.5">{item.title}</h4>
            {item.description && (
              <p className="text-[12px] text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-gray-100/70">
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 px-2 py-[3px] rounded-md font-medium">
            <MapPin size={10} /> {dist}
          </span>

          {item.creator && (
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
              <span
                className="w-4 h-4 rounded flex items-center justify-center text-white text-[7px] font-bold"
                style={{ background: color }}
              >
                {item.creator.name?.charAt(0) || "?"}
              </span>
              <span className="font-medium text-gray-500 max-w-[70px] truncate">{item.creator.name}</span>
            </span>
          )}

          <span className="flex-1" />

          {item.feedType === "gig" && data.budget ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-[3px] rounded-md">
              <DollarSign size={10} /> {String(data.budget)}
            </span>
          ) : null}
          {item.feedType === "skill" && data.isFree ? (
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-[3px] rounded-md">Free</span>
          ) : item.feedType === "skill" && data.price ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-[3px] rounded-md">
              <DollarSign size={10} /> {String(data.price)}
            </span>
          ) : null}
          {item.feedType === "idea" ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-500 font-semibold bg-rose-50 px-2 py-[3px] rounded-md">
              <Heart size={10} /> {String(data.likes || 0)}
            </span>
          ) : null}
          {item.feedType === "trip" && data.budget ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-cyan-600 font-bold bg-cyan-50 px-2 py-[3px] rounded-md">
              <DollarSign size={10} /> {String(data.budget)}
            </span>
          ) : null}
          {item.feedType === "event" ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-violet-50 text-violet-500 px-2 py-[3px] rounded-md">
              <Users size={10} /> Join <ChevronRight size={10} />
            </span>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};
