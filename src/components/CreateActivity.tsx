"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Minus,
  Plus,
  Calendar,
  Users,
  Megaphone,
  UsersRound,
  ChevronLeft,
  ChevronRight,
  Clock,
  Type,
  Trophy,
  Music,
  Coffee,
  CalendarDays,
  Briefcase,
  GraduationCap,
  Handshake,
  Sparkles,
  Dribbble,
  Circle,
  Volleyball,
  Dumbbell,
  Bike,
  Footprints,
  Leaf,
  Flame,
  Zap,
  Check,
  Eye,
  MessageSquare,
  Shield,
  Save,
  Rocket,
  AlignLeft,
} from "lucide-react";
import { useStore } from "@/store";
import { ACTIVITY_TYPES, ACTIVITY_CATEGORIES } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type CreateMode = "pick" | "activity" | "event" | "group";

// Activity creation card data for the picker grid
const ACTIVITY_CARDS = [
  {
    id: "activity" as const,
    mode: "activity" as CreateMode,
    icon: Trophy,
    iconBg: "bg-[#8e51ff]/90",
    label: "Sports Activity",
    desc: "Games, matches & more",
    badge: "Popular",
    image:
      "https://images.unsplash.com/photo-1765607076772-1675dfb9b99d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3ODc2NDd8MHwxfHNlYXJjaHwxfHxiYXNrZXRiYWxsJTIwc3BvcnRzJTIwYWN0aXZpdHklMjBvdXRkb29yfGVufDF8MHx8fDE3NzQ5MDM5MjV8MA&ixlib=rb-4.1.0&q=80&w=400",
    type: "sports",
  },
  {
    id: "music" as const,
    mode: "activity" as CreateMode,
    icon: Music,
    iconBg: "",
    iconBgStyle: { backgroundColor: "oklch(0.6 0.118 184.704 / 0.9)" },
    label: "Music Collab",
    desc: "Jam sessions & bands",
    image:
      "https://images.unsplash.com/photo-1679130707518-bc6561f0a7b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3ODc2NDd8MHwxfHNlYXJjaHwxfHxsaXZlJTIwbXVzaWMlMjBjb25jZXJ0JTIwamFtJTIwc2Vzc2lvbnxlbnwxfDB8fHwxNzc0OTAzOTI1fDA&ixlib=rb-4.1.0&q=80&w=400",
    type: "music",
  },
  {
    id: "hangout" as const,
    mode: "group" as CreateMode,
    icon: Coffee,
    iconBg: "",
    iconBgStyle: { backgroundColor: "oklch(0.769 0.188 70.08 / 0.9)" },
    label: "Hangout",
    desc: "Meet & chill",
    image:
      "https://images.unsplash.com/photo-1758274252215-dcd772697944?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3ODc2NDd8MHwxfHNlYXJjaHwxfHxmcmllbmRzJTIwaGFuZ291dCUyMGNhZmUlMjBzb2NpYWx8ZW58MXwwfHx8MTc3NDg5NTExNHww&ixlib=rb-4.1.0&q=80&w=400",
    type: "hangout",
  },
  {
    id: "event-card" as const,
    mode: "event" as CreateMode,
    icon: CalendarDays,
    iconBg: "",
    iconBgStyle: { backgroundColor: "oklch(0.646 0.222 41.116 / 0.9)" },
    label: "Event",
    desc: "Organize gatherings",
    image:
      "https://images.unsplash.com/photo-1766407354000-54a7129f7140?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3ODc2NDd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBldmVudCUyMGdhdGhlcmluZyUyMHBlb3BsZXxlbnwxfDB8fHwxNzc0ODg1NTg1fDA&ixlib=rb-4.1.0&q=80&w=400",
    type: "event",
  },
];

// Opportunity items for the picker
const OPPORTUNITY_ITEMS = [
  {
    type: "gig" as const,
    icon: Briefcase,
    iconBgStyle: { backgroundColor: "oklch(0.828 0.189 84.429 / 0.15)" },
    iconStyle: { color: "oklch(0.828 0.189 84.429)" },
    label: "Post a Gig",
    desc: "Offer your skills or find talent nearby",
  },
  {
    type: "skill" as const,
    icon: GraduationCap,
    iconBgStyle: { backgroundColor: "oklch(0.6 0.118 184.704 / 0.15)" },
    iconStyle: { color: "oklch(0.6 0.118 184.704)" },
    label: "Teach or Tutor",
    desc: "Share your expertise with the community",
  },
  {
    type: "idea" as const,
    icon: Handshake,
    iconBgStyle: { backgroundColor: "oklch(0.606 0.25 292.717 / 0.12)" },
    iconStyle: {},
    iconClassName: "text-[#8e51ff]",
    label: "Hire Someone",
    desc: "Find local help for tasks & projects",
  },
];

// Sport type pills for form
const SPORT_PILLS = [
  { value: "basketball", label: "Basketball", icon: Dribbble },
  { value: "soccer", label: "Soccer", icon: Circle },
  { value: "volleyball", label: "Volleyball", icon: Volleyball },
  { value: "gym", label: "Gym", icon: Dumbbell },
  { value: "cycling", label: "Cycling", icon: Bike },
  { value: "running", label: "Running", icon: Footprints },
  { value: "other", label: "Other", icon: Plus },
];

// Skill levels for form
const SKILL_LEVELS = [
  {
    value: "beginner",
    label: "Beginner",
    icon: Leaf,
    iconBg: "bg-[#009689]/15",
    iconStyle: { color: "oklch(0.6 0.118 184.704)" },
  },
  {
    value: "intermediate",
    label: "Intermediate",
    icon: Flame,
    iconBg: "bg-[#8e51ff]/15",
    iconClassName: "text-[#8e51ff]",
  },
  {
    value: "advanced",
    label: "Advanced",
    icon: Trophy,
    iconBg: "bg-[#f54900]/15",
    iconStyle: { color: "oklch(0.646 0.222 41.116)" },
  },
  {
    value: "any",
    label: "Any",
    icon: Zap,
    iconBg: "bg-[#ffb900]/15",
    iconStyle: { color: "oklch(0.828 0.189 84.429)" },
  },
];

// Game formats
const GAME_FORMATS = [
  { value: "3v3", label: "3v3", desc: "Half court" },
  { value: "5v5", label: "5v5", desc: "Full court" },
  { value: "1v1", label: "1v1", desc: "Duel" },
];

export default function CreateActivity() {
  const { user, userLocation, setScreen, addActivity, setOpportunityType } =
    useStore();
  const [mode, setMode] = useState<CreateMode>("pick");
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [playersNeeded, setPlayersNeeded] = useState(2);
  const [category, setCategory] = useState("social");
  const [isEvent, setIsEvent] = useState(false);
  const [ticketPrice, setTicketPrice] = useState("");
  const [eventUrl, setEventUrl] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  // Form-specific states
  const [skillLevel, setSkillLevel] = useState("intermediate");
  const [gameFormat, setGameFormat] = useState("3v3");
  const [isPublic, setIsPublic] = useState(true);
  const [enableChat, setEnableChat] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);

  const pickMode = (m: CreateMode, activityType?: string) => {
    setMode(m);
    if (activityType) {
      setType(activityType);
    }
    if (m === "event") {
      setIsEvent(true);
      setCategory("event");
      if (!activityType) setType("event");
    } else if (m === "group") {
      setCategory("social");
      setPlayersNeeded(10);
      if (!activityType) setType("hangout");
      setIsRecurring(true);
    } else {
      setIsEvent(false);
    }
  };

  const publish = async () => {
    if (!user) {
      setError("Please log in first");
      return;
    }
    if (!type) {
      setError("Please select an activity type");
      return;
    }
    if (!title) {
      setError("Please enter a title");
      return;
    }
    setPublishing(true);
    setError("");

    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          description,
          lat: userLocation.lat + (Math.random() - 0.5) * 0.005,
          lng: userLocation.lng + (Math.random() - 0.5) * 0.005,
          time: new Date(`${date}T${time}`).toISOString(),
          playersNeeded,
          creatorId: user.id,
          category,
          isEvent,
          ticketPrice: parseFloat(ticketPrice) || 0,
          isFree: !ticketPrice || parseFloat(ticketPrice) === 0,
          eventUrl,
          isRecurring,
          recurrencePattern,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create. Please try again.");
        return;
      }
      addActivity(data);
      setScreen("map");
    } catch (e) {
      console.error("Publish error:", e);
      setError("Network error. Check your connection and try again.");
    } finally {
      setPublishing(false);
    }
  };

  const selectedDateTime = new Date(`${date}T${time}`);
  const isPastDate = selectedDateTime < new Date();
  const canPublish = type && title && user && !publishing && !isPastDate;
  const formTitle =
    mode === "event"
      ? "Create Event"
      : mode === "group"
        ? "Create Group"
        : "Create Sports Activity";

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute inset-0 bottom-[68px] bg-white z-[900] flex flex-col"
    >
      <AnimatePresence mode="wait">
        {/* ========== PICKER SCREEN ========== */}
        {mode === "pick" && (
          <motion.div
            key="pick"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1">
              <div className="flex p-6 flex-col gap-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-[#8e51ff] flex justify-center items-center w-10 h-10">
                      <Plus className="size-5 text-violet-50" />
                    </div>
                    <div>
                      <h1 className="font-bold text-xl leading-7 text-zinc-950">
                        Create
                      </h1>
                      <p className="text-[#71717b] text-xs leading-4">
                        What would you like to share?
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setScreen("map")}
                    className="rounded-full bg-zinc-100 flex justify-center items-center w-8 h-8"
                  >
                    <X className="size-4 text-[#71717b]" />
                  </button>
                </div>

                {/* Activities & Events Section */}
                <div className="flex flex-col gap-4">
                  <p className="font-semibold uppercase text-[#71717b] text-xs leading-4 tracking-wider">
                    Activities & Events
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {ACTIVITY_CARDS.map((card, idx) => {
                      const Icon = card.icon;
                      return (
                        <motion.button
                          key={card.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.06 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => pickMode(card.mode, card.type)}
                          className="relative group rounded-2xl h-40 overflow-hidden text-left"
                        >
                          <img
                            alt={card.label}
                            className="object-cover w-full h-full"
                            src={card.image}
                          />
                          <div
                            className="absolute inset-0"
                            style={{
                              background:
                                "linear-gradient(to top, oklch(0.141 0.005 285.823 / 0.75), transparent)",
                            }}
                          />
                          <div className="flex absolute inset-x-0 bottom-0 p-4 flex-col gap-1">
                            <div
                              className={`rounded-xl flex justify-center items-center w-8 h-8 ${card.iconBg}`}
                              style={card.iconBgStyle}
                            >
                              <Icon className="size-4 text-white" />
                            </div>
                            <p className="font-semibold text-white text-sm leading-5">
                              {card.label}
                            </p>
                            <p className="text-white/70 text-[10px]">
                              {card.desc}
                            </p>
                          </div>
                          {card.badge && (
                            <div className="rounded-full bg-[#8e51ff]/90 absolute right-2 top-2 px-2 py-0.5">
                              <p className="font-medium text-violet-50 text-[9px]">
                                {card.badge}
                              </p>
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Work & Services Section */}
                <div className="flex flex-col gap-4">
                  <p className="font-semibold uppercase text-[#71717b] text-xs leading-4 tracking-wider">
                    Work & Services
                  </p>
                  <div className="flex flex-col gap-2">
                    {OPPORTUNITY_ITEMS.map((opt, idx) => {
                      const Icon = opt.icon;
                      return (
                        <motion.div
                          key={opt.type}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 + idx * 0.05 }}
                        >
                          <Card
                            className="border-zinc-200 border-0 border-solid p-4 gap-2 cursor-pointer hover:shadow-sm transition-shadow"
                            onClick={() => {
                              setOpportunityType(opt.type);
                              setScreen("create-opportunity");
                            }}
                          >
                            <CardContent className="flex p-0 items-center gap-2">
                              <div
                                className="shrink-0 rounded-xl flex justify-center items-center w-10 h-10"
                                style={opt.iconBgStyle}
                              >
                                <Icon
                                  className={`size-5 ${opt.iconClassName || ""}`}
                                  style={opt.iconStyle}
                                />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-sm leading-5 text-zinc-950">
                                  {opt.label}
                                </p>
                                <p className="text-[#71717b] text-[11px]">
                                  {opt.desc}
                                </p>
                              </div>
                              <ChevronRight className="size-4 text-[#71717b]" />
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Suggestion Banner */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="rounded-2xl flex p-4 items-center gap-2"
                  style={{
                    backgroundColor: "oklch(0.606 0.25 292.717 / 0.08)",
                  }}
                >
                  <div className="shrink-0 rounded-full bg-[#8e51ff]/20 flex justify-center items-center w-8 h-8">
                    <Sparkles className="size-4 text-[#8e51ff]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#8e51ff] text-xs leading-4">
                      AI Suggestion
                    </p>
                    <p className="text-[#71717b] text-[11px]">
                      Based on your area, try posting a{" "}
                      <span className="font-medium text-zinc-950">
                        Pickup Basketball
                      </span>{" "}
                      game — 8 people nearby are looking!
                    </p>
                  </div>
                </motion.div>

                <div className="h-4" />
              </div>
            </div>
          </motion.div>
        )}

        {/* ========== FORM SCREEN ========== */}
        {mode !== "pick" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Header with back/close and step indicator */}
            <div className="flex px-6 pt-6 pb-2 justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMode("pick")}
                  className="rounded-full bg-zinc-100 flex justify-center items-center w-8 h-8"
                >
                  <ChevronLeft className="size-4 text-zinc-950" />
                </button>
                <div>
                  <p className="text-[#71717b] text-xs leading-4">
                    Step 1 of 3
                  </p>
                  <h1 className="font-bold text-lg leading-7 text-zinc-950">
                    {formTitle}
                  </h1>
                </div>
              </div>
              <button
                onClick={() => setScreen("map")}
                className="rounded-full bg-zinc-100 flex justify-center items-center w-8 h-8"
              >
                <X className="size-4 text-[#71717b]" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-6 pt-2 pb-4">
              <div className="rounded-full bg-zinc-100 w-full h-1.5 overflow-hidden">
                <motion.div
                  className="rounded-full bg-[#8e51ff] h-full"
                  initial={{ width: 0 }}
                  animate={{ width: "33%" }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto pb-20">
              {/* Sport selection pills (activity mode) */}
              {mode === "activity" && (
                <div className="px-6 pb-4">
                  <p className="font-semibold text-zinc-950 text-sm leading-5 mb-2">
                    What sport?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SPORT_PILLS.map((sport) => {
                      const Icon = sport.icon;
                      const selected = type === sport.value;
                      return (
                        <motion.button
                          key={sport.value}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setType(sport.value)}
                          className={`font-medium rounded-full text-xs leading-4 flex px-3 py-2 items-center gap-1.5 transition-all ${
                            selected
                              ? "bg-[#8e51ff] text-violet-50"
                              : "bg-zinc-100 text-zinc-900 border border-zinc-200"
                          }`}
                        >
                          <Icon className="size-3.5" />
                          <span>{sport.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category (event/group modes) */}
              {mode === "event" && (
                <div className="px-6 pb-4">
                  <p className="font-semibold text-zinc-950 text-sm leading-5 mb-2">
                    Event Type
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {ACTIVITY_TYPES.map((t) => (
                      <motion.button
                        key={t.value}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setType(t.value)}
                        className={`font-medium rounded-full text-xs leading-4 flex px-3 py-2 items-center gap-1.5 transition-all ${
                          type === t.value
                            ? "bg-[#8e51ff] text-violet-50"
                            : "bg-zinc-100 text-zinc-900 border border-zinc-200"
                        }`}
                      >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {mode === "group" && (
                <div className="px-6 pb-4">
                  <p className="font-semibold text-zinc-950 text-sm leading-5 mb-2">
                    Group Type
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {ACTIVITY_CATEGORIES.map((c) => (
                      <motion.button
                        key={c.value}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCategory(c.value)}
                        className={`font-medium rounded-full text-xs leading-4 flex px-3 py-2 items-center gap-1.5 transition-all ${
                          category === c.value
                            ? "bg-[#8e51ff] text-violet-50"
                            : "bg-zinc-100 text-zinc-900 border border-zinc-200"
                        }`}
                      >
                        <span>{c.icon}</span>
                        <span>{c.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity name input */}
              <div className="px-6 pb-4">
                <p className="font-semibold text-zinc-950 text-sm leading-5 mb-2">
                  {mode === "group" ? "Group name" : "Activity name"}
                </p>
                <div className="rounded-xl bg-zinc-100 border border-zinc-200 flex px-4 py-3 items-center gap-2">
                  <Type className="size-4 text-[#71717b]" />
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      mode === "event"
                        ? "e.g., Friday Night DJ Party"
                        : mode === "group"
                          ? "e.g., Morning Runners Club"
                          : "e.g., 3v3 Street Basketball"
                    }
                    className="flex-1 bg-transparent text-zinc-950 text-sm leading-5 outline-none placeholder:text-[#71717b]"
                  />
                  <Sparkles className="size-4 text-[#8e51ff] ml-auto shrink-0" />
                </div>
                <p className="text-[#71717b] text-xs leading-4 flex mt-1 items-center gap-1">
                  <Sparkles className="size-3 text-[#8e51ff]" />
                  AI suggested based on your activity
                </p>
              </div>

              {/* Skill level (activity mode) */}
              {mode === "activity" && (
                <div className="px-6 pb-4">
                  <p className="font-semibold text-zinc-950 text-sm leading-5 mb-2">
                    Skill level
                  </p>
                  <div className="flex gap-2">
                    {SKILL_LEVELS.map((level) => {
                      const Icon = level.icon;
                      const selected = skillLevel === level.value;
                      return (
                        <motion.button
                          key={level.value}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSkillLevel(level.value)}
                          className={`rounded-xl flex p-3 flex-col items-center flex-1 gap-1.5 transition-all ${
                            selected
                              ? "bg-[#8e51ff]/5 border-2 border-[#8e51ff]"
                              : "bg-zinc-100 border border-zinc-200"
                          }`}
                        >
                          <div
                            className={`rounded-full flex justify-center items-center w-8 h-8 ${level.iconBg}`}
                          >
                            <Icon
                              className={`size-4 ${selected ? "text-[#8e51ff]" : level.iconClassName || ""}`}
                              style={
                                selected ? { color: "#8e51ff" } : level.iconStyle
                              }
                            />
                          </div>
                          <span
                            className={`text-xs leading-4 ${
                              selected
                                ? "font-semibold text-[#8e51ff]"
                                : "font-medium text-zinc-950"
                            }`}
                          >
                            {level.label}
                          </span>
                          {selected && (
                            <Check className="size-3 text-[#8e51ff]" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Game format (activity mode) */}
              {mode === "activity" && (
                <div className="px-6 pb-4">
                  <p className="font-semibold text-zinc-950 text-sm leading-5 mb-2">
                    Game format
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {GAME_FORMATS.map((fmt) => {
                      const selected = gameFormat === fmt.value;
                      return (
                        <motion.button
                          key={fmt.value}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setGameFormat(fmt.value)}
                          className={`rounded-xl flex p-3 flex-col items-center gap-1 transition-all ${
                            selected
                              ? "bg-[#8e51ff]/5 border-2 border-[#8e51ff]"
                              : "bg-zinc-100 border border-zinc-200"
                          }`}
                        >
                          <span
                            className={`font-bold text-lg leading-7 ${
                              selected ? "text-[#8e51ff]" : "text-zinc-950"
                            }`}
                          >
                            {fmt.label}
                          </span>
                          <span className="text-[#71717b] text-xs leading-4">
                            {fmt.desc}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* When & Where section */}
              <div className="px-6 pb-4">
                <p className="font-semibold text-zinc-950 text-sm leading-5 mb-2">
                  When & Where
                </p>
                <Card className="border-zinc-200 border p-4 gap-4">
                  <CardContent className="flex p-0 flex-col gap-4">
                    {/* Date/time row */}
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-[#8e51ff]/10 flex justify-center items-center w-10 h-10">
                        <Calendar className="size-5 text-[#8e51ff]" />
                      </div>
                      <div className="flex-1">
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="font-medium text-sm leading-5 text-zinc-950 bg-transparent outline-none w-full"
                        />
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="text-[#71717b] text-xs leading-4 bg-transparent outline-none w-full mt-0.5"
                        />
                      </div>
                      <ChevronRight className="size-4 text-[#71717b]" />
                    </div>

                    {isPastDate && (
                      <p className="text-xs text-amber-600 font-semibold bg-amber-50 px-3 py-2 rounded-xl">
                        Date/time is in the past -- please select a future time
                      </p>
                    )}

                    <Separator />

                    {/* Location row */}
                    <div className="flex items-center gap-4">
                      <div
                        className="rounded-xl flex justify-center items-center w-10 h-10"
                        style={{
                          backgroundColor: "oklch(0.6 0.118 184.704 / 0.1)",
                        }}
                      >
                        <MapPin
                          className="size-5"
                          style={{ color: "oklch(0.6 0.118 184.704)" }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm leading-5 text-zinc-950">
                          {userLocation.lat !== 0 || userLocation.lng !== 0
                            ? "Your Location"
                            : "Location not available"}
                        </p>
                        <p className="text-[#71717b] text-xs leading-4">
                          {userLocation.lat !== 0 || userLocation.lng !== 0
                            ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                            : "Enable GPS to set location"}
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-[#71717b]" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Players needed counter */}
              <div className="px-6 pb-4">
                <p className="font-semibold text-zinc-950 text-sm leading-5 mb-2">
                  {mode === "group"
                    ? "Max members"
                    : mode === "event"
                      ? "Capacity"
                      : "Players needed"}
                </p>
                <div className="rounded-xl bg-zinc-100 border border-zinc-200 flex px-4 py-3 items-center gap-4">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() =>
                      setPlayersNeeded(Math.max(1, playersNeeded - 1))
                    }
                    className="rounded-full bg-[#8e51ff]/10 flex justify-center items-center w-8 h-8"
                  >
                    <Minus className="size-4 text-[#8e51ff]" />
                  </motion.button>
                  <div className="text-center flex-1">
                    <span className="font-bold text-[#8e51ff] text-2xl leading-8">
                      {playersNeeded}
                    </span>
                    <p className="text-[#71717b] text-xs leading-4">
                      {mode === "group"
                        ? "members"
                        : mode === "event"
                          ? "capacity"
                          : "more players"}
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() =>
                      setPlayersNeeded(Math.min(100, playersNeeded + 1))
                    }
                    className="rounded-full bg-[#8e51ff]/10 flex justify-center items-center w-8 h-8"
                  >
                    <Plus className="size-4 text-[#8e51ff]" />
                  </motion.button>
                </div>
              </div>

              {/* Event-specific fields */}
              {mode === "event" && (
                <div className="px-6 pb-4 space-y-4">
                  <div>
                    <p className="font-semibold text-zinc-950 text-sm leading-5 mb-2">
                      Ticket Price (INR, 0 = free)
                    </p>
                    <div className="rounded-xl bg-zinc-100 border border-zinc-200 flex px-4 py-3 items-center gap-2">
                      <input
                        type="number"
                        value={ticketPrice}
                        onChange={(e) => setTicketPrice(e.target.value)}
                        placeholder="0"
                        className="flex-1 bg-transparent text-zinc-950 text-sm leading-5 outline-none placeholder:text-[#71717b]"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-950 text-sm leading-5 mb-2">
                      Event URL (optional)
                    </p>
                    <div className="rounded-xl bg-zinc-100 border border-zinc-200 flex px-4 py-3 items-center gap-2">
                      <input
                        value={eventUrl}
                        onChange={(e) => setEventUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 bg-transparent text-zinc-950 text-sm leading-5 outline-none placeholder:text-[#71717b]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Group schedule */}
              {mode === "group" && (
                <div className="px-6 pb-4">
                  <p className="font-semibold text-zinc-950 text-sm leading-5 mb-2">
                    How often does this group meet?
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {["daily", "weekly", "weekends", "monthly"].map((p) => (
                      <motion.button
                        key={p}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setRecurrencePattern(p);
                          setIsRecurring(true);
                        }}
                        className={`font-medium rounded-full text-xs leading-4 flex px-3 py-2 items-center capitalize transition-all ${
                          recurrencePattern === p
                            ? "bg-[#8e51ff] text-violet-50"
                            : "bg-zinc-100 text-zinc-900 border border-zinc-200"
                        }`}
                      >
                        {p}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional options / toggle switches */}
              <div className="px-6 pb-4">
                <p className="font-semibold text-zinc-950 text-sm leading-5 mb-2">
                  Additional options
                </p>
                <div className="flex flex-col gap-2">
                  {/* Public activity toggle */}
                  <div className="rounded-xl bg-zinc-100 border border-zinc-200 flex px-4 py-3 justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Eye className="size-4 text-[#71717b]" />
                      <span className="text-sm leading-5 text-zinc-950">
                        Public activity
                      </span>
                    </div>
                    <button
                      onClick={() => setIsPublic(!isPublic)}
                      className={`rounded-full flex p-0.5 w-10 h-6 transition-colors ${
                        isPublic
                          ? "bg-[#8e51ff] justify-end"
                          : "bg-zinc-200 justify-start"
                      }`}
                    >
                      <div
                        className={`rounded-full w-5 h-5 ${
                          isPublic ? "bg-violet-50" : "bg-[#71717b]/40"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Enable group chat toggle */}
                  <div className="rounded-xl bg-zinc-100 border border-zinc-200 flex px-4 py-3 justify-between items-center">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="size-4 text-[#71717b]" />
                      <span className="text-sm leading-5 text-zinc-950">
                        Enable group chat
                      </span>
                    </div>
                    <button
                      onClick={() => setEnableChat(!enableChat)}
                      className={`rounded-full flex p-0.5 w-10 h-6 transition-colors ${
                        enableChat
                          ? "bg-[#8e51ff] justify-end"
                          : "bg-zinc-200 justify-start"
                      }`}
                    >
                      <div
                        className={`rounded-full w-5 h-5 ${
                          enableChat ? "bg-violet-50" : "bg-[#71717b]/40"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Require approval toggle */}
                  <div className="rounded-xl bg-zinc-100 border border-zinc-200 flex px-4 py-3 justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Shield className="size-4 text-[#71717b]" />
                      <span className="text-sm leading-5 text-zinc-950">
                        Require approval
                      </span>
                    </div>
                    <button
                      onClick={() => setRequireApproval(!requireApproval)}
                      className={`rounded-full flex p-0.5 w-10 h-6 transition-colors ${
                        requireApproval
                          ? "bg-[#8e51ff] justify-end"
                          : "bg-zinc-200 justify-start"
                      }`}
                    >
                      <div
                        className={`rounded-full w-5 h-5 ${
                          requireApproval ? "bg-violet-50" : "bg-[#71717b]/40"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Recurring toggle (activity mode only) */}
              {mode === "activity" && (
                <div className="px-6 pb-4">
                  <div className="rounded-xl bg-zinc-100 border border-zinc-200 flex px-4 py-3 justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Calendar className="size-4 text-[#71717b]" />
                      <span className="text-sm leading-5 text-zinc-950">
                        Recurring Activity
                      </span>
                    </div>
                    <button
                      onClick={() => setIsRecurring(!isRecurring)}
                      className={`rounded-full flex p-0.5 w-10 h-6 transition-colors ${
                        isRecurring
                          ? "bg-[#8e51ff] justify-end"
                          : "bg-zinc-200 justify-start"
                      }`}
                    >
                      <div
                        className={`rounded-full w-5 h-5 ${
                          isRecurring ? "bg-violet-50" : "bg-[#71717b]/40"
                        }`}
                      />
                    </button>
                  </div>
                  <AnimatePresence>
                    {isRecurring && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex gap-2 flex-wrap pt-2">
                          {["daily", "weekly", "weekends", "monthly"].map(
                            (p) => (
                              <motion.button
                                key={p}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setRecurrencePattern(p)}
                                className={`font-medium rounded-full text-xs leading-4 flex px-3 py-2 items-center capitalize transition-all ${
                                  recurrencePattern === p
                                    ? "bg-[#8e51ff] text-violet-50"
                                    : "bg-white text-zinc-900 border border-zinc-200"
                                }`}
                              >
                                {p}
                              </motion.button>
                            )
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Add a note / description */}
              <div className="px-6 pb-6">
                <p className="font-semibold text-zinc-950 text-sm leading-5 mb-2">
                  Add a note
                </p>
                <div className="min-h-[72px] rounded-xl bg-zinc-100 border border-zinc-200 px-4 py-3">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      mode === "group"
                        ? "What is this group about? Who should join?"
                        : "Tell others what you're planning..."
                    }
                    rows={3}
                    className="w-full bg-transparent text-zinc-950 text-sm leading-5 outline-none resize-none placeholder:text-[#71717b]"
                  />
                </div>
              </div>

              {/* AI Boost Suggestion */}
              <div className="px-6 pb-8">
                <div className="rounded-xl bg-[#8e51ff]/5 border border-[#8e51ff]/20 flex p-4 items-start gap-3">
                  <Sparkles className="size-5 text-[#8e51ff] mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-[#8e51ff] text-sm leading-5">
                      AI Boost Suggestion
                    </p>
                    <p className="text-[#71717b] text-xs leading-4 mt-0.5">
                      Post this at 2:00 PM for 3x more visibility. 12 players
                      are active nearby right now.
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-[#8e51ff] mt-0.5 shrink-0" />
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Fixed bottom bar with Save Draft + Publish */}
            <div className="bg-white border-t border-zinc-200 px-6 py-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="font-medium rounded-xl text-sm leading-5 flex-1 h-12"
                  onClick={() => setScreen("map")}
                >
                  <Save className="size-4 mr-1.5" />
                  Save Draft
                </Button>
                <Button
                  onClick={publish}
                  disabled={!canPublish}
                  className="flex-[2] font-semibold rounded-xl bg-[#8e51ff] hover:bg-[#7a3fff] text-violet-50 text-sm leading-5 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {publishing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-violet-200 border-t-white rounded-full animate-spin" />
                      Publishing...
                    </span>
                  ) : (
                    <>
                      <Rocket className="size-4 mr-1.5" />
                      {mode === "event"
                        ? "Publish Event"
                        : mode === "group"
                          ? "Publish Group"
                          : "Publish Activity"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
