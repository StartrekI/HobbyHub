"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Search, Briefcase, GraduationCap, Plane, Lightbulb,
  MapPin, DollarSign, Users, Heart, Calendar, Sparkles
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
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
      )
    : feed;

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
          <button onClick={() => setScreen("map")} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h3 className="flex-1 font-bold text-xl">Discover</h3>
        </div>
        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search opportunities..."
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all"
          />
        </div>
        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FEED_FILTERS.map((f) => (
            <motion.button
              key={f.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                filter === f.value
                  ? "bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-200"
                  : "bg-white text-gray-500 border-gray-200"
              }`}
            >
              {f.icon} {f.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-16 h-16 bg-violet-50 rounded-3xl flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-violet-300" />
            </div>
            <p className="text-sm font-medium">No opportunities nearby</p>
            <p className="text-xs text-gray-300 mt-1">Be the first to create one!</p>
          </div>
        ) : (
          filtered.map((item, idx) => {
            const Icon = FEED_ICONS[item.feedType] || Users;
            const color = FEED_TYPE_COLORS[item.feedType] || "#6C5CE7";
            const dist = getDistance(userLocation.lat, userLocation.lng, item.lat, item.lng);
            const data = item.data as unknown as Record<string, unknown>;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-white rounded-3xl p-5 border border-gray-100 hover:shadow-md transition-shadow"
              >
                {/* Top row */}
                <div className="flex items-start gap-3.5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: `${color}12`, color }}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide"
                        style={{ background: `${color}12`, color }}
                      >
                        {item.feedType}
                      </span>
                      <span className="text-[10px] text-gray-300">{formatRelativeTime(item.createdAt)}</span>
                    </div>
                    <h4 className="font-bold text-[15px] leading-tight">{item.title}</h4>
                    {item.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                    )}
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-3 mt-3.5 pt-3 border-t border-gray-50">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin size={12} /> {dist}
                  </span>
                  {item.creator && (
                    <span className="text-xs text-gray-400">by <span className="font-medium text-gray-500">{item.creator.name}</span></span>
                  )}
                  {item.feedType === "gig" && data.budget ? (
                    <span className="flex items-center gap-0.5 text-xs text-emerald-600 font-bold ml-auto">
                      <DollarSign size={12} /> {String(data.budget)}
                    </span>
                  ) : null}
                  {item.feedType === "skill" && data.isFree ? (
                    <span className="text-xs text-emerald-600 font-bold ml-auto">Free</span>
                  ) : item.feedType === "skill" && data.price ? (
                    <span className="flex items-center gap-0.5 text-xs text-emerald-600 font-bold ml-auto">
                      <DollarSign size={12} /> {String(data.price)}
                    </span>
                  ) : null}
                  {item.feedType === "idea" ? (
                    <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                      <Heart size={12} /> {String(data.likes || 0)}
                    </span>
                  ) : null}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
