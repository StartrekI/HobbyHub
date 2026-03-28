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
      <div className="header-glass">
        <div className="flex items-center gap-3 px-5 pt-4 pb-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setScreen("map")}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f4f4f8] hover:bg-[#e8e8ef] transition-colors"
          >
            <ArrowLeft size={16} className="text-[#4a4a5e]" />
          </motion.button>
          <div className="flex-1">
            <h3 className="font-bold text-xl text-[#1a1a2e] tracking-tight">Discover</h3>
          </div>
          {!loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#e8e5ff] rounded-full"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7] animate-pulse" />
              <span className="text-[11px] text-[#6c5ce7] font-semibold">{resultCount}</span>
            </motion.div>
          )}
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9e9eb0] pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activities, gigs, trips..."
              className="w-full pl-10 pr-10 py-2.5 bg-[#f4f4f8] rounded-xl text-[13px] outline-none border border-transparent focus:bg-white focus:border-[#a29bfe] focus:shadow-[0_0_0_3px_rgba(108,92,231,0.12)] transition-all placeholder:text-[#9e9eb0]"
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.12 }}
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-[#d1d1db] hover:bg-[#9e9eb0] rounded-full flex items-center justify-center transition-colors"
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
                className={`flex items-center gap-1.5 px-3.5 py-[7px] rounded-full text-[12px] font-semibold whitespace-nowrap transition-all duration-200 border ${
                  active
                    ? "bg-[#1a1a2e] text-white border-[#1a1a2e] shadow-sm"
                    : "bg-white text-[#6e6e82] border-black/[0.04] hover:bg-[#f4f4f8]"
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
            <div className="w-14 h-14 bg-[#f4f4f8] rounded-2xl flex items-center justify-center mb-4">
              <Globe size={26} className="text-[#d1d1db]" />
            </div>
            <p className="text-[15px] font-bold text-[#1a1a2e]">Nothing here yet</p>
            <p className="text-[13px] text-[#9e9eb0] mt-1 text-center max-w-[240px]">
              {search ? "Try a different search term" : "Be the first to post something nearby"}
            </p>
            {search && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearch("")}
                className="mt-4 px-5 py-2 bg-[#1a1a2e] text-white text-[12px] font-semibold rounded-full"
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

const FeedCard = ({ item, idx, userLocation }: { item: FeedItem; idx: number; userLocation: { lat: number; lng: number } }) => {
  const Icon = FEED_ICONS[item.feedType] || Users;
  const color = FEED_TYPE_COLORS[item.feedType] || "#6C5CE7";
  const dist = getDistance(userLocation.lat, userLocation.lng, item.lat, item.lng);
  const data = item.data as unknown as Record<string, unknown>;
  const staggerDelay = Math.min(idx * 0.03, 0.3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: staggerDelay, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      whileTap={{ scale: 0.985 }}
      className="bg-white rounded-2xl overflow-hidden active:bg-[#f4f4f8] transition-colors duration-150 cursor-pointer border border-black/[0.03]"
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 160px" }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${color}10`, color }}
          >
            <Icon size={17} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="px-1.5 py-[2px] rounded text-[9px] font-bold uppercase tracking-wider"
                style={{ background: `${color}10`, color }}
              >
                {TYPE_LABELS[item.feedType] || item.feedType}
              </span>
              <span className="text-[10px] text-[#d1d1db] font-medium">
                {formatRelativeTime(item.createdAt)}
              </span>
            </div>
            <h4 className="font-bold text-[14px] leading-snug text-[#1a1a2e] mt-0.5">{item.title}</h4>
            {item.description && (
              <p className="text-[12px] text-[#9e9eb0] mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-black/[0.03]">
          <span className="badge">
            <MapPin size={10} /> {dist}
          </span>

          {item.creator && (
            <span className="inline-flex items-center gap-1 text-[10px] text-[#9e9eb0]">
              <span
                className="w-4 h-4 rounded flex items-center justify-center text-white text-[7px] font-bold"
                style={{ background: color }}
              >
                {item.creator.name?.charAt(0) || "?"}
              </span>
              <span className="font-medium text-[#6e6e82] max-w-[70px] truncate">{item.creator.name}</span>
            </span>
          )}

          <span className="flex-1" />

          {item.feedType === "gig" && data.budget ? (
            <span className="badge" style={{ background: "#e6f9f4", color: "#00b894" }}>
              <DollarSign size={10} /> {String(data.budget)}
            </span>
          ) : null}
          {item.feedType === "skill" && data.isFree ? (
            <span className="badge" style={{ background: "#e6f9f4", color: "#00b894" }}>Free</span>
          ) : item.feedType === "skill" && data.price ? (
            <span className="badge" style={{ background: "#e6f9f4", color: "#00b894" }}>
              <DollarSign size={10} /> {String(data.price)}
            </span>
          ) : null}
          {item.feedType === "idea" ? (
            <span className="badge" style={{ background: "#ffe8e8", color: "#ff6b6b" }}>
              <Heart size={10} /> {String(data.likes || 0)}
            </span>
          ) : null}
          {item.feedType === "trip" && data.budget ? (
            <span className="badge" style={{ background: "#e8f4ff", color: "#74b9ff" }}>
              <DollarSign size={10} /> {String(data.budget)}
            </span>
          ) : null}
          {item.feedType === "event" ? (
            <span className="badge" style={{ background: "#e8e5ff", color: "#6c5ce7" }}>
              <Users size={10} /> Join <ChevronRight size={10} />
            </span>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};
