"use client";

import { useEffect, useState, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Briefcase,
  Calendar,
  ChevronRight,
  Coffee,
  Heart,
  MapPin,
  Music,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useStore } from "@/store";
const LeafletMap = lazy(() => import("@/components/LeafletMap"));
import { getDistance, formatRelativeTime, FEED_TYPE_COLORS } from "@/lib/utils";
import type { FeedItem } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const FEED_FILTERS = [
  { value: "all", label: "All", icon: null },
  { value: "activity", label: "Sports", icon: Trophy },
  { value: "skill", label: "Music", icon: Music },
  { value: "gig", label: "Gigs", icon: Briefcase },
  { value: "trip", label: "Hangouts", icon: Coffee },
  { value: "event", label: "Events", icon: Calendar },
];

const FEED_ICONS: Record<string, typeof Briefcase> = {
  activity: Users,
  gig: Briefcase,
  skill: Music,
  trip: Coffee,
  idea: Sparkles,
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

function SkeletonCard() {
  return (
    <Card className="rounded-2xl border-black/5 border border-solid p-0 gap-0 overflow-hidden">
      <div className="h-36 bg-zinc-100 animate-pulse" />
      <CardContent className="p-4 gap-2">
        <div className="h-4 w-16 bg-zinc-100 rounded-full animate-pulse" />
        <div className="h-5 w-3/4 bg-zinc-100 rounded animate-pulse mt-1" />
        <div className="h-4 w-1/2 bg-zinc-100 rounded animate-pulse mt-1" />
      </CardContent>
    </Card>
  );
}

function SkeletonTrending() {
  return (
    <div className="flex-shrink-0 rounded-2xl w-40 h-48 bg-zinc-100 animate-pulse" />
  );
}

export default function DiscoveryFeed() {
  const user = useStore((s) => s.user);
  const userLocation = useStore((s) => s.userLocation);
  const nearbyUsers = useStore((s) => s.nearbyUsers);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const hasFetchedOnce = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const locationRef = useRef(userLocation);
  locationRef.current = userLocation;

  const fetchFeed = useCallback(
    (showSkeleton: boolean) => {
      if (!user) return;
      if (showSkeleton) setLoading(true);
      else setRefreshing(true);

      const { lat, lng } = locationRef.current;
      fetch(`/api/discover?lat=${lat}&lng=${lng}&type=${filter}`)
        .then((r) => r.json())
        .then((data) => {
          setFeed(data);
          setLoading(false);
          setRefreshing(false);
        })
        .catch(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [user, filter],
  );

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
    return feed.filter(
      (item) =>
        (item.title || "").toLowerCase().includes(searchLower) ||
        (item.description || "").toLowerCase().includes(searchLower),
    );
  }, [feed, searchLower]);

  const trendingItems = filtered.slice(0, 3);
  const activityItems = filtered.slice(3);

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Scrollable content */}
      <div className="overflow-y-auto pb-20 flex-1">
        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <p className="text-[#71717b] text-sm leading-5">
                {"\uD83D\uDCCD"} Nearby
              </p>
              <h1 className="font-bold text-2xl leading-8 tracking-tight text-zinc-950">
                Explore
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Bell className="size-5 text-zinc-950" />
                <div className="rounded-full bg-[#e7000b] absolute -right-1 -top-1 w-2 h-2" />
              </div>
              <Avatar className="border-[#8e51ff] border-2 border-solid w-8 h-8">
                <AvatarFallback className="font-semibold bg-[#8e51ff]/10 text-[#8e51ff] text-xs leading-4">
                  {user?.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                    : "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        {/* ── Search bar ── */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative">
            <Search className="top-1/2 -translate-y-1/2 size-4 text-[#71717b] absolute left-3" />
            <Input
              className="rounded-xl bg-zinc-100 border-black/5 border border-solid px-10 h-10"
              placeholder="Search activities, people, places..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="top-1/2 -translate-y-1/2 absolute right-3">
              {search ? (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setSearch("")}
                  className="w-5 h-5 bg-zinc-200 hover:bg-zinc-300 rounded-full flex items-center justify-center transition-colors"
                >
                  <X size={10} className="text-zinc-600" />
                </motion.button>
              ) : (
                <SlidersHorizontal className="size-4 text-[#71717b]" />
              )}
            </div>
          </div>
        </div>

        {/* ── Category filter badges ── */}
        <div className="px-6 pt-4 pb-2">
          <div
            className="overflow-x-auto flex gap-2"
            style={{ scrollbarWidth: "none" }}
          >
            {FEED_FILTERS.map((f) => {
              const active = filter === f.value;
              const FilterIcon = f.icon;
              return (
                <Badge
                  key={f.value}
                  variant={active ? "default" : "secondary"}
                  className={`whitespace-nowrap cursor-pointer font-medium rounded-full text-xs leading-4 px-4 py-1.5 transition-all ${
                    active
                      ? "bg-[#8e51ff] text-violet-50 hover:bg-[#7a3ef0]"
                      : ""
                  }`}
                  onClick={() => setFilter(f.value)}
                >
                  {FilterIcon && <FilterIcon className="size-3 mr-1" />}
                  {f.label}
                </Badge>
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
              className="flex items-center justify-center overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-[1.5px] border-[#8e51ff]/30 border-t-[#8e51ff] rounded-full animate-spin" />
                <span className="text-[11px] text-[#8e51ff] font-medium">
                  Updating...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <>
            {/* Skeleton trending */}
            <div className="px-6 pt-4">
              <div className="h-5 w-32 bg-zinc-100 rounded animate-pulse mb-3" />
              <div
                className="overflow-x-auto flex pb-2 gap-4"
                style={{ scrollbarWidth: "none" }}
              >
                {[0, 1, 2].map((i) => (
                  <SkeletonTrending key={i} />
                ))}
              </div>
            </div>
            {/* Skeleton activities */}
            <div className="px-6 pt-6 space-y-4">
              <div className="h-5 w-36 bg-zinc-100 rounded animate-pulse" />
              {[0, 1].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-24 px-6"
          >
            <div className="w-16 h-16 bg-zinc-100 rounded-3xl flex items-center justify-center mb-4">
              <Search size={28} className="text-zinc-400" />
            </div>
            <p className="text-base font-bold text-zinc-950">
              Nothing here yet
            </p>
            <p className="text-sm text-[#71717b] mt-1.5 text-center max-w-[240px]">
              {search
                ? "Try a different search term"
                : "Be the first to post something nearby"}
            </p>
            {search && (
              <Button
                onClick={() => setSearch("")}
                className="mt-5 rounded-xl bg-[#8e51ff] text-violet-50 px-6"
              >
                Clear search
              </Button>
            )}
          </motion.div>
        ) : (
          <>
            {/* ── Trending Near You ── */}
            {trendingItems.length > 0 && (
              <div className="px-6 pt-4">
                <div className="flex mb-2 justify-between items-center">
                  <h2 className="font-semibold text-base leading-6 text-zinc-950">
                    {"\uD83D\uDD25"} Trending Near You
                  </h2>
                  <span className="font-medium text-[#8e51ff] text-xs leading-4 cursor-pointer">
                    See all
                  </span>
                </div>
                <div
                  className="overflow-x-auto flex pb-2 gap-4"
                  style={{ scrollbarWidth: "none" }}
                >
                  {trendingItems.map((item, idx) => (
                    <TrendingCard
                      key={item.id}
                      item={item}
                      idx={idx}
                      userLocation={userLocation}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Nearby Activities (Map Preview) ── */}
            <NearbyMapPreview
              activityCount={filtered.length}
              userLocation={userLocation}
            />

            {/* ── Popular This Week ── */}
            <div className="px-6 pt-2">
              <div className="flex mb-2 justify-between items-center">
                <h2 className="font-semibold text-base leading-6 text-zinc-950">
                  Popular This Week
                </h2>
                <span className="font-medium text-[#8e51ff] text-xs leading-4 cursor-pointer">
                  See all
                </span>
              </div>
              <div className="space-y-4">
                {(activityItems.length > 0 ? activityItems : filtered).map(
                  (item, idx) => (
                    <ActivityCard
                      key={item.id}
                      item={item}
                      idx={idx}
                      userLocation={userLocation}
                    />
                  ),
                )}
              </div>
            </div>

            {/* ── People to Connect With ── */}
            {nearbyUsers.length > 0 && (
              <div className="px-6 pt-6 pb-4">
                <div className="flex mb-2 justify-between items-center">
                  <h2 className="font-semibold text-base leading-6 text-zinc-950">
                    People to Connect With
                  </h2>
                  <span className="font-medium text-[#8e51ff] text-xs leading-4 cursor-pointer">
                    See all
                  </span>
                </div>
                <div
                  className="overflow-x-auto flex pb-2 gap-4"
                  style={{ scrollbarWidth: "none" }}
                >
                  {nearbyUsers.slice(0, 5).map((person) => (
                    <PersonBubble key={person.id} person={person} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Trending horizontal scroll card ─── */
function TrendingCard({
  item,
  idx,
  userLocation,
}: {
  item: FeedItem;
  idx: number;
  userLocation: { lat: number; lng: number };
}) {
  const dist = getDistance(userLocation.lat, userLocation.lng, item.lat, item.lng);
  const participantCount = (() => {
    const data = item.data as unknown as Record<string, unknown>;
    return (data?._count as Record<string, number>)?.participants ?? 0;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05, duration: 0.25 }}
      className="relative flex-shrink-0 rounded-2xl w-40 h-48 overflow-hidden cursor-pointer"
    >
      {/* Gradient placeholder background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${FEED_TYPE_COLORS[item.feedType] || "#8e51ff"}88, ${FEED_TYPE_COLORS[item.feedType] || "#8e51ff"})`,
        }}
      />
      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
        }}
      />
      {/* Live / type badge */}
      <div className="absolute left-2 top-2">
        <Badge className="font-medium rounded-full bg-green-500 text-white text-[10px] px-2 py-0.5">
          <span className="inline-block animate-pulse rounded-full bg-white mr-1 w-1.5 h-1.5" />
          {TYPE_LABELS[item.feedType] || item.feedType}
        </Badge>
      </div>
      {/* Bottom info */}
      <div className="absolute inset-x-2 bottom-2">
        <p className="leading-tight font-semibold text-white text-xs">
          {item.title}
        </p>
        <p className="text-white/70 text-[10px] mt-0.5">
          {dist} {participantCount > 0 ? `\u00B7 ${participantCount} joined` : ""}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Activity card (vertical list) ─── */
function ActivityCard({
  item,
  idx,
  userLocation,
}: {
  item: FeedItem;
  idx: number;
  userLocation: { lat: number; lng: number };
}) {
  const Icon = FEED_ICONS[item.feedType] || Users;
  const color = FEED_TYPE_COLORS[item.feedType] || "#8e51ff";
  const dist = getDistance(userLocation.lat, userLocation.lng, item.lat, item.lng);
  const data = item.data as unknown as Record<string, unknown>;
  const participantCount =
    (data?._count as Record<string, number>)?.participants ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.04, 0.3), duration: 0.25 }}
    >
      <Card className="rounded-2xl border-black/5 border border-solid p-0 gap-0 overflow-hidden">
        {/* Image area */}
        <div className="relative h-36">
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${color}44, ${color})`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)",
            }}
          />
          {/* Trending badge */}
          <div className="absolute right-2 top-2">
            <Badge className="rounded-full bg-[#8e51ff] text-violet-50 text-[10px] px-2 py-0.5">
              <TrendingUp className="size-3 mr-1" />
              {TYPE_LABELS[item.feedType] || item.feedType}
            </Badge>
          </div>
          {/* Participant avatars */}
          {participantCount > 0 && (
            <div className="flex absolute left-3 bottom-2 items-center gap-1">
              <div className="-space-x-2 flex">
                <div className="rounded-full bg-blue-400 border-white border border-solid w-5 h-5" />
                <div className="rounded-full bg-green-400 border-white border border-solid w-5 h-5" />
                <div className="rounded-full bg-amber-400 border-white border border-solid w-5 h-5" />
              </div>
              <span className="text-white text-[10px] ml-1">
                +{participantCount} interested
              </span>
            </div>
          )}
        </div>
        {/* Content */}
        <CardContent className="p-4 gap-2">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex mb-1 items-center gap-2">
                <Badge
                  variant="secondary"
                  className="font-medium rounded-full text-[10px] px-2 py-0.5"
                >
                  <Icon className="size-2.5 mr-1" />
                  {TYPE_LABELS[item.feedType] || item.feedType}
                </Badge>
                <span className="text-[#71717b] text-[10px]">
                  {formatRelativeTime(item.createdAt)}
                </span>
              </div>
              <h3 className="font-semibold text-sm leading-5 text-zinc-950">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-[#71717b] text-xs leading-4 line-clamp-2 mt-0.5">
                  {item.description}
                </p>
              )}
              <p className="text-[#71717b] text-xs leading-4 flex mt-1 items-center gap-1">
                <MapPin className="size-3" />
                {dist}
                {item.creator?.name ? ` \u00B7 by ${item.creator.name}` : ""}
              </p>
            </div>
            <Button
              size="sm"
              className="rounded-xl bg-[#8e51ff] text-violet-50 text-xs leading-4 px-4 h-8 ml-3 shrink-0"
            >
              Join
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Nearby Activities Map Preview ─── */
function NearbyMapPreview({
  activityCount,
  userLocation,
}: {
  activityCount: number;
  userLocation: { lat: number; lng: number };
}) {
  const setScreen = useStore((s) => s.setScreen);
  const activities = useStore((s) => s.activities);
  const nearbyUsers = useStore((s) => s.nearbyUsers);
  const hotspots = useStore((s) => s.hotspots);
  const hasLocation = userLocation.lat !== 0 || userLocation.lng !== 0;

  return (
    <div className="px-6 pt-6">
      <div className="flex mb-2 justify-between items-center">
        <h2 className="font-semibold text-base leading-6 text-zinc-950">
          Nearby Activities
        </h2>
        <button
          onClick={() => setScreen("map")}
          className="font-medium text-[#8e51ff] text-xs leading-4 cursor-pointer flex items-center gap-1"
        >
          Map view
          <ChevronRight className="size-3" />
        </button>
      </div>
      <button
        onClick={() => setScreen("map")}
        className="relative rounded-2xl w-full h-40 overflow-hidden mb-4 block"
      >
        {/* Live mini-map */}
        {hasLocation ? (
          <Suspense
            fallback={
              <div className="w-full h-full bg-zinc-100 animate-pulse" />
            }
          >
            <LeafletMap
              userLocation={userLocation}
              activities={activities}
              users={nearbyUsers}
              hotspots={hotspots}
              onActivityClick={() => {}}
              onUserClick={() => {}}
              onHotspotClick={() => {}}
            />
          </Suspense>
        ) : (
          <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
            <MapPin className="size-8 text-zinc-300" />
          </div>
        )}

        {/* Purple tint overlay */}
        <div className="bg-[#8e51ff]/5 absolute inset-0 pointer-events-none" />

        {/* Info card overlay */}
        <div className="shadow-lg rounded-xl bg-white flex absolute left-4 top-4 p-2 items-center gap-2 pointer-events-none">
          <div className="rounded-lg bg-[#8e51ff]/10 flex justify-center items-center w-8 h-8">
            <MapPin className="size-4 text-[#8e51ff]" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-[10px] text-zinc-950">
              {activityCount} {activityCount === 1 ? "activity" : "activities"}
            </p>
            <p className="text-[#71717b] text-[9px]">nearby</p>
          </div>
        </div>

        {/* Decorative colored dots */}
        <div className="shadow-md rounded-full bg-[#8e51ff] border-white border-2 border-solid absolute right-12 top-6 w-3 h-3 pointer-events-none" />
        <div className="shadow-md rounded-full bg-green-500 border-white border-2 border-solid absolute right-20 top-12 w-3 h-3 pointer-events-none" />
        <div className="shadow-md rounded-full bg-amber-500 border-white border-2 border-solid absolute left-20 bottom-10 w-3 h-3 pointer-events-none" />
        <div className="shadow-md rounded-full bg-rose-500 border-white border-2 border-solid absolute right-8 bottom-16 w-3 h-3 pointer-events-none" />
      </button>
    </div>
  );
}

/* ─── People bubble (horizontal scroll) ─── */
function PersonBubble({ person }: { person: { id: string; name: string; avatar: string; online: boolean; interests: string[] } }) {
  const initials = person.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
  const interest = person.interests?.[0] || "";

  return (
    <div className="flex-shrink-0 flex flex-col items-center gap-2">
      <div className="relative">
        <div className="bg-gradient-to-br from-[#8e51ff] to-[#8e51ff]/60 rounded-full p-0.5 w-14 h-14">
          <div className="rounded-full bg-white flex justify-center items-center w-full h-full overflow-hidden">
            {person.avatar ? (
              <img
                src={person.avatar}
                alt={person.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bold text-[#8e51ff] text-sm leading-5">
                {initials}
              </span>
            )}
          </div>
        </div>
        {person.online && (
          <div className="rounded-full bg-green-500 border-white border-2 border-solid absolute -right-0.5 -bottom-0.5 w-4 h-4" />
        )}
      </div>
      <p className="font-medium text-[10px] text-zinc-950">
        {person.name.split(" ")[0]}{" "}
        {person.name.split(" ")[1]?.[0] ? `${person.name.split(" ")[1][0]}.` : ""}
      </p>
      {interest && (
        <p className="text-[#71717b] text-[9px]">{interest}</p>
      )}
    </div>
  );
}
