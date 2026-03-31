"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck,
  Bell,
  Briefcase,
  Calendar,
  ChevronRight,
  Coffee,
  Heart,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Music,
  Search,
  Share2,
  Trophy,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { useStore } from "@/store";
import {
  getDistance,
  formatRelativeTime,
  USER_ROLES,
  STARTUP_STAGES,
  LOOKING_FOR_OPTIONS,
  FEED_TYPE_COLORS,
} from "@/lib/utils";
import type { UserType, FeedItem } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const FEED_CATEGORY_FILTERS = [
  { value: "all", label: "All" },
  { value: "activity", label: "Sports" },
  { value: "event", label: "Events" },
  { value: "gig", label: "Gigs" },
  { value: "trip", label: "Hangouts" },
  { value: "skill", label: "Music" },
];

const TYPE_LABELS: Record<string, string> = {
  activity: "Activity",
  gig: "Gig",
  skill: "Skill Exchange",
  trip: "Trip",
  idea: "Idea",
  event: "Event",
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function NetworkingView() {
  const { user, userLocation, setScreen, setCurrentChatId, nearbyUsers } =
    useStore();
  const [people, setPeople] = useState<UserType[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [lookingForFilter, setLookingForFilter] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const locationRef = useRef(userLocation);
  locationRef.current = userLocation;

  const fetchPeople = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const { lat, lng } = locationRef.current;
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      userId: user.id,
    });
    if (roleFilter) params.set("role", roleFilter);
    if (stageFilter) params.set("stage", stageFilter);
    if (lookingForFilter) params.set("lookingFor", lookingForFilter);

    fetch(`/api/networking?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setPeople(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, roleFilter, stageFilter, lookingForFilter]);

  // Fetch feed items for the feed tab
  const fetchFeed = useCallback(() => {
    if (!user) return;
    setFeedLoading(true);
    const { lat, lng } = locationRef.current;
    fetch(
      `/api/discover?lat=${lat}&lng=${lng}&type=${categoryFilter === "all" ? "" : categoryFilter}`,
    )
      .then((r) => r.json())
      .then((data) => {
        setFeedItems(data);
        setFeedLoading(false);
      })
      .catch(() => setFeedLoading(false));
  }, [user, categoryFilter]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchPeople, 300);
    return () => clearTimeout(debounceRef.current);
  }, [fetchPeople]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const filtered = search
    ? feedItems.filter(
        (item) =>
          (item.title || "").toLowerCase().includes(search.toLowerCase()) ||
          (item.description || "")
            .toLowerCase()
            .includes(search.toLowerCase()),
      )
    : feedItems;

  const sendHi = (personId: string) => {
    if (!user) return;
    fetch("/api/dm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: user.id,
        receiverId: personId,
        text: "Hey! Let's connect \uD83E\uDD1D",
      }),
    }).then(() => {
      setCurrentChatId(`dm:${personId}`);
      setScreen("chat");
    });
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="overflow-y-auto pb-20 flex-1">
        {/* ── Header ── */}
        <div className="flex px-6 pt-6 pb-2 justify-between items-center">
          <div className="flex flex-col gap-1">
            <span className="text-[#71717b] text-sm leading-5">
              {getGreeting()} {"\uD83D\uDC4B"}
            </span>
            <h1 className="font-bold text-xl leading-7 text-zinc-950">
              Your Feed
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell className="size-5 text-zinc-950" />
              <div className="rounded-full bg-[#e7000b] absolute -right-1 -top-1 w-2 h-2" />
            </div>
            <button onClick={() => setShowSearch(!showSearch)}>
              <Search className="size-5 text-zinc-950" />
            </button>
          </div>
        </div>

        {/* ── Collapsible search ── */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-6"
            >
              <div className="relative pb-2">
                <Search className="top-1/2 -translate-y-1/2 size-4 text-[#71717b] absolute left-3 -mt-1" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search feed..."
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 rounded-xl text-sm outline-none border border-black/5 focus:border-[#8e51ff]/40 transition-all placeholder:text-zinc-400 text-zinc-950"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Category filter badges ── */}
        <div className="px-6 py-4">
          <div
            className="overflow-x-auto flex gap-2"
            style={{ scrollbarWidth: "none" }}
          >
            {FEED_CATEGORY_FILTERS.map((f) => {
              const active = categoryFilter === f.value;
              return (
                <Badge
                  key={f.value}
                  variant={active ? "default" : "outline"}
                  className={`whitespace-nowrap font-medium rounded-full text-xs leading-4 px-4 py-1.5 cursor-pointer transition-all ${
                    active
                      ? "bg-[#8e51ff] text-violet-50 hover:bg-[#7a3ef0]"
                      : ""
                  }`}
                  onClick={() => setCategoryFilter(f.value)}
                >
                  {f.label}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* ── Feed cards ── */}
        {feedLoading ? (
          <div className="px-6 space-y-4">
            {[0, 1, 2].map((i) => (
              <SkeletonFeedCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4">
              <Search size={26} className="text-zinc-400" />
            </div>
            <p className="text-sm font-semibold text-zinc-950">
              No posts yet
            </p>
            <p className="text-xs text-[#71717b] mt-1">
              Try expanding your filters or check back later
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((item, idx) => (
              <FeedCard
                key={item.id}
                item={item}
                idx={idx}
                userLocation={userLocation}
              />
            ))}
          </div>
        )}

        {/* ── Nearby Connections section ── */}
        {!loading && people.length > 0 && (
          <div className="px-6 pb-4 pt-4">
            <Card className="border-black/5 border border-solid p-0 gap-0 overflow-hidden">
              <div className="flex px-4 pt-4 pb-2 items-center gap-2">
                <div className="rounded-full bg-[#8e51ff]/10 flex justify-center items-center w-9 h-9">
                  <Users className="size-4 text-[#8e51ff]" />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-sm leading-5 text-zinc-950">
                    {"\uD83D\uDD17"} Nearby Connections
                  </span>
                  <span className="block text-[#71717b] text-xs leading-4">
                    {people.length} people near you share your interests
                  </span>
                </div>
                <ChevronRight className="size-5 text-[#71717b]" />
              </div>
              <div
                className="flex px-4 pb-4 gap-2 overflow-x-auto"
                style={{ scrollbarWidth: "none" }}
              >
                {people.slice(0, 3).map((person) => (
                  <NearbyPersonCard
                    key={person.id}
                    person={person}
                    userLocation={userLocation}
                    onSendHi={sendHi}
                  />
                ))}
              </div>
            </Card>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}

/* ─── Feed Card ─── */
function FeedCard({
  item,
  idx,
  userLocation,
}: {
  item: FeedItem;
  idx: number;
  userLocation: { lat: number; lng: number };
}) {
  const dist = getDistance(
    userLocation.lat,
    userLocation.lng,
    item.lat,
    item.lng,
  );
  const data = item.data as unknown as Record<string, unknown>;
  const participantCount =
    (data?._count as Record<string, number>)?.participants ?? 0;
  const color = FEED_TYPE_COLORS[item.feedType] || "#8e51ff";

  // Deterministic engagement counts derived from item id
  const hash = item.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const likeCount = (hash % 40) + 5;
  const commentCount = (hash % 15) + 1;
  const shareCount = (hash % 10) + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.04, 0.3), duration: 0.25 }}
      className="px-6"
    >
      <Card className="border-black/5 border border-solid p-0 gap-0 overflow-hidden">
        {/* Creator header */}
        <div className="flex px-4 pt-4 pb-2 items-center gap-2">
          <Avatar className="w-9 h-9">
            {item.creator?.avatar ? (
              <img
                src={item.creator.avatar}
                alt={item.creator.name}
                className="object-cover w-full h-full"
              />
            ) : (
              <AvatarFallback className="font-semibold bg-[#8e51ff]/10 text-[#8e51ff] text-xs">
                {item.creator?.name?.charAt(0) || "?"}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm leading-5 text-zinc-950">
                {item.creator?.name || "Anonymous"}
              </span>
              {item.creator?.verified && (
                <BadgeCheck className="size-3.5 text-[#8e51ff]" />
              )}
            </div>
            <div className="text-[#71717b] text-xs leading-4 flex items-center gap-1">
              <MapPin className="size-3" />
              <span>
                {dist} {"\u00B7"} {formatRelativeTime(item.createdAt)}
              </span>
            </div>
          </div>
          <MoreHorizontal className="size-5 text-[#71717b]" />
        </div>

        {/* Activity image area */}
        <div className="relative">
          <div
            className="w-full h-48"
            style={{
              background: `linear-gradient(135deg, ${color}66, ${color})`,
            }}
          />
          {/* Type badge overlay */}
          <div className="font-semibold rounded-full bg-[#8e51ff]/90 text-violet-50 text-xs leading-4 flex absolute left-2 top-2 px-2.5 py-1 items-center gap-1">
            <Zap className="size-3" />
            <span>{TYPE_LABELS[item.feedType] || item.feedType}</span>
          </div>
          {/* Spots indicator */}
          {participantCount > 0 && (
            <div className="font-medium rounded-full bg-zinc-950/60 text-white text-xs leading-4 absolute right-2 bottom-2 px-2 py-0.5">
              {participantCount} joined
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex px-4 pt-2 pb-4 flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm leading-5 text-zinc-950">
              {item.title}
            </span>
            {item.description && (
              <span className="text-[#71717b] text-xs leading-4 line-clamp-2">
                {item.description}
              </span>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="font-normal rounded-full text-xs leading-4 px-2 py-0.5"
            >
              {TYPE_LABELS[item.feedType] || item.feedType}
            </Badge>
            {item.feedType === "gig" && !!(data as Record<string, unknown>)?.budget && (
              <Badge className="font-normal rounded-full bg-amber-100 text-amber-700 text-xs leading-4 border-amber-200 border-0 border-solid px-2 py-0.5">
                ${String((data as Record<string, unknown>).budget)}/hr
              </Badge>
            )}
            <Badge
              variant="secondary"
              className="font-normal rounded-full text-xs leading-4 px-2 py-0.5"
            >
              {dist}
            </Badge>
          </div>

          <Separator />

          {/* Action buttons */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 cursor-pointer">
                <Heart className="size-4 text-[#71717b]" />
                <span className="text-[#71717b] text-xs leading-4">
                  {likeCount}
                </span>
              </div>
              <div className="flex items-center gap-1 cursor-pointer">
                <MessageCircle className="size-4 text-[#71717b]" />
                <span className="text-[#71717b] text-xs leading-4">
                  {commentCount}
                </span>
              </div>
              <div className="flex items-center gap-1 cursor-pointer">
                <Share2 className="size-4 text-[#71717b]" />
                <span className="text-[#71717b] text-xs leading-4">
                  {shareCount}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              className="rounded-full bg-[#8e51ff] text-violet-50 text-xs leading-4 px-4 h-8"
            >
              <UserPlus className="size-3 mr-1" />
              Join
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ─── Nearby Person Card (inside Nearby Connections) ─── */
function NearbyPersonCard({
  person,
  userLocation,
  onSendHi,
}: {
  person: UserType;
  userLocation: { lat: number; lng: number };
  onSendHi: (id: string) => void;
}) {
  const interest = person.interests?.[0] || person.role || "";

  return (
    <div className="rounded-xl bg-zinc-100 flex p-2 flex-col items-center flex-1 gap-1.5 min-w-[80px] cursor-pointer">
      <Avatar className="w-10 h-10">
        {person.avatar ? (
          <img
            src={person.avatar}
            alt={person.name}
            className="object-cover w-full h-full"
          />
        ) : (
          <AvatarFallback className="font-semibold bg-[#8e51ff]/10 text-[#8e51ff] text-xs">
            {person.name.charAt(0)}
          </AvatarFallback>
        )}
      </Avatar>
      <span className="font-medium text-xs leading-4 text-zinc-950">
        {person.name.split(" ")[0]}
      </span>
      {interest && (
        <span className="text-[#71717b] text-xs leading-4">{interest}</span>
      )}
    </div>
  );
}

/* ─── Skeleton Feed Card ─── */
function SkeletonFeedCard() {
  return (
    <div className="px-6">
      <Card className="border-black/5 border border-solid p-0 gap-0 overflow-hidden">
        <div className="flex px-4 pt-4 pb-2 items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-zinc-100 animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-24 bg-zinc-100 rounded animate-pulse" />
            <div className="h-3 w-32 bg-zinc-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-48 bg-zinc-100 animate-pulse" />
        <div className="p-4 space-y-2">
          <div className="h-4 w-3/4 bg-zinc-100 rounded animate-pulse" />
          <div className="h-3 w-full bg-zinc-100 rounded animate-pulse" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 w-16 bg-zinc-100 rounded-full animate-pulse" />
            <div className="h-5 w-20 bg-zinc-100 rounded-full animate-pulse" />
          </div>
        </div>
      </Card>
    </div>
  );
}
