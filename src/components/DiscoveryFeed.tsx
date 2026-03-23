"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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

export default function DiscoveryFeed() {
  const { user, userLocation, setScreen } = useStore();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fetchFeed = useCallback(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/discover?lat=${userLocation.lat}&lng=${userLocation.lng}&type=${filter}`)
      .then((r) => r.json())
      .then((data) => { setFeed(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, userLocation, filter]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchFeed, 300);
    return () => clearTimeout(debounceRef.current);
  }, [fetchFeed]);

  const filtered = search
    ? feed.filter((item) =>
        (item.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(search.toLowerCase())
      )
    : feed;

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
              <p className="text-[10px] text-gray-400 font-medium">{resultCount} {resultCount === 1 ? "opportunity" : "opportunities"} nearby</p>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search opportunities..."
            className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"
              >
                <X size={12} className="text-gray-500" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FEED_FILTERS.map((f) => (
            <motion.button
              key={f.value}
              whileTap={{ scale: 0.93 }}
              onClick={() => setFilter(f.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                filter === f.value
                  ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200/50"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              {f.icon} {f.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-3"
            >
              <div className="w-10 h-10 border-[3px] border-gray-200 border-t-violet-500 rounded-full animate-spin" />
              <p className="text-xs text-gray-400 font-medium">Finding opportunities...</p>
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-gray-400"
            >
              <div className="w-20 h-20 bg-violet-50 rounded-[28px] flex items-center justify-center mb-4">
                <Sparkles size={32} className="text-violet-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500">No opportunities found</p>
              <p className="text-xs text-gray-400 mt-1 text-center max-w-[220px]">
                {search ? "Try a different search term" : "Be the first to create one!"}
              </p>
              {search && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSearch("")}
                  className="mt-4 px-5 py-2.5 bg-violet-600 text-white text-xs font-bold rounded-xl"
                >
                  Clear Search
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {filtered.map((item, idx) => {
                const Icon = FEED_ICONS[item.feedType] || Users;
                const color = FEED_TYPE_COLORS[item.feedType] || "#6C5CE7";
                const dist = getDistance(userLocation.lat, userLocation.lng, item.lat, item.lng);
                const data = item.data as unknown as Record<string, unknown>;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, type: "spring", damping: 25, stiffness: 300 }}
                    whileTap={{ scale: 0.985 }}
                    className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    {/* Colored accent bar */}
                    <div className="h-1" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

                    <div className="p-5">
                      {/* Top row */}
                      <div className="flex items-start gap-3.5">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                          style={{ background: `linear-gradient(135deg, ${color}20, ${color}10)`, color }}
                        >
                          <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                              style={{ background: `${color}15`, color }}
                            >
                              {TYPE_LABELS[item.feedType] || item.feedType}
                            </span>
                            <span className="flex items-center gap-0.5 text-[10px] text-gray-300">
                              <Clock size={9} /> {formatRelativeTime(item.createdAt)}
                            </span>
                          </div>
                          <h4 className="font-bold text-[15px] leading-tight text-gray-900">{item.title}</h4>
                          {item.description && (
                            <p className="text-[13px] text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-2.5 mt-4 pt-3.5 border-t border-gray-100">
                        <span className="flex items-center gap-1 text-[11px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                          <MapPin size={11} className="text-gray-400" /> {dist}
                        </span>
                        {item.creator && (
                          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <div
                              className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[9px] font-bold"
                              style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
                            >
                              {item.creator.name?.charAt(0) || "?"}
                            </div>
                            <span className="font-medium text-gray-500">{item.creator.name}</span>
                          </span>
                        )}

                        <span className="flex-1" />

                        {item.feedType === "gig" && data.budget ? (
                          <span className="flex items-center gap-0.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
                            <DollarSign size={12} /> {String(data.budget)}
                          </span>
                        ) : null}
                        {item.feedType === "skill" && data.isFree ? (
                          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">Free</span>
                        ) : item.feedType === "skill" && data.price ? (
                          <span className="flex items-center gap-0.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
                            <DollarSign size={12} /> {String(data.price)}
                          </span>
                        ) : null}
                        {item.feedType === "idea" ? (
                          <span className="flex items-center gap-1 text-xs text-rose-500 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg">
                            <Heart size={12} /> {String(data.likes || 0)}
                          </span>
                        ) : null}
                        {item.feedType === "trip" && data.budget ? (
                          <span className="flex items-center gap-0.5 text-xs text-cyan-600 font-bold bg-cyan-50 px-2.5 py-1 rounded-lg">
                            <DollarSign size={12} /> {String(data.budget)}
                          </span>
                        ) : null}
                        {item.feedType === "event" ? (
                          <span className="flex items-center gap-1 text-xs font-semibold bg-gray-50 text-gray-500 px-2.5 py-1 rounded-lg">
                            <Users size={11} /> Join
                            <ChevronRight size={12} />
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
