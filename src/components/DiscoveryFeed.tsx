"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Search, Briefcase, GraduationCap, Plane, Lightbulb,
  MapPin, DollarSign, Users, Heart, MessageCircle, Calendar
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

  // Debounce fetch when location/filter changes
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
      className="absolute inset-0 bottom-[70px] bg-gray-50 z-[900] flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => setScreen("map")}><ArrowLeft size={20} /></button>
          <h3 className="flex-1 font-bold text-lg">Discover</h3>
        </div>
        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search opportunities..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-violet-200 transition-all"
          />
        </div>
        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FEED_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filter === f.value
                  ? "bg-violet-600 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-10">Loading feed...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Lightbulb size={48} className="mx-auto mb-4 opacity-40" />
            <p className="text-sm">No opportunities nearby yet</p>
            <p className="text-xs mt-1">Be the first to create one!</p>
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                {/* Top row */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${color}20`, color }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                        style={{ background: `${color}20`, color }}
                      >
                        {item.feedType}
                      </span>
                      <span className="text-[10px] text-gray-400">{formatRelativeTime(item.createdAt)}</span>
                    </div>
                    <h4 className="font-bold text-sm mt-1 truncate">{item.title}</h4>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {dist}
                  </span>
                  {item.creator && (
                    <span>by {item.creator.name}</span>
                  )}
                  {item.feedType === "gig" && data.budget ? (
                    <span className="flex items-center gap-0.5 text-emerald-600 font-semibold">
                      <DollarSign size={12} /> {String(data.budget)}
                    </span>
                  ) : null}
                  {item.feedType === "skill" && data.isFree ? (
                    <span className="text-emerald-600 font-semibold">Free</span>
                  ) : item.feedType === "skill" && data.price ? (
                    <span className="flex items-center gap-0.5 text-emerald-600 font-semibold">
                      <DollarSign size={12} /> {String(data.price)}
                    </span>
                  ) : null}
                  {item.feedType === "idea" ? (
                    <span className="flex items-center gap-1">
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
