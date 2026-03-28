"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, ChevronRight,
} from "lucide-react";
import { useStore } from "@/store";
import { getDistance, TYPE_COLORS, ACTIVITY_TYPES } from "@/lib/utils";
import type { CalendarDayType, ActivityType } from "@/types";

function DaySkeleton() {
  return (
    <div>
      <div className="w-20 h-4 skeleton mb-3" />
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-black/[0.03]">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl skeleton shrink-0" />
              <div className="flex-1 space-y-2 pt-0.5">
                <div className="w-3/4 h-4 skeleton" />
                <div className="w-1/2 h-3 skeleton" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CalendarView() {
  const user = useStore((s) => s.user);
  const userLocation = useStore((s) => s.userLocation);
  const setScreen = useStore((s) => s.setScreen);
  const setSelectedActivity = useStore((s) => s.setSelectedActivity);
  const [days, setDays] = useState<CalendarDayType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const hasFetched = useRef(false);
  const locationRef = useRef(userLocation);
  locationRef.current = userLocation;

  const fetchCalendar = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const { lat, lng } = locationRef.current;
    fetch(`/api/calendar?lat=${lat}&lng=${lng}&days=7`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDays(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchCalendar();
    }
  }, [fetchCalendar]);

  const totalActivities = days.reduce((sum, d) => sum + d.activities.length, 0);

  const filteredDays = useMemo(() => {
    return selectedDate ? days.filter((d) => d.date === selectedDate) : days;
  }, [selectedDate, days]);

  const today = new Date().toISOString().split("T")[0];

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
            <h3 className="font-extrabold text-[22px] text-white tracking-tight">Calendar</h3>
          </div>
          {!loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.08] rounded-full"
            >
              <Calendar size={11} className="text-[#a29bfe]" />
              <span className="text-[11px] text-white/70 font-semibold">{totalActivities} upcoming</span>
            </motion.div>
          )}
        </div>

        {/* Date strip */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedDate(null)}
            className={`px-3.5 py-[7px] rounded-full text-[12px] font-semibold whitespace-nowrap transition-all duration-200 ${
              selectedDate === null
                ? "bg-[#6c5ce7] text-white shadow-[0_0_12px_rgba(108,92,231,0.4)]"
                : "bg-white/[0.07] text-white/50 hover:bg-white/[0.12]"
            }`}
          >
            All
          </motion.button>
          {days.map((day) => {
            const active = selectedDate === day.date;
            const hasActivities = day.activities.length > 0;
            return (
              <motion.button
                key={day.date}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(active ? null : day.date)}
                className={`flex items-center gap-1.5 px-3.5 py-[7px] rounded-full text-[12px] font-semibold whitespace-nowrap transition-all duration-200 ${
                  active
                    ? "bg-[#6c5ce7] text-white shadow-[0_0_12px_rgba(108,92,231,0.4)]"
                    : "bg-white/[0.07] text-white/50 hover:bg-white/[0.12]"
                }`}
              >
                {day.label}
                {hasActivities && (
                  <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-white/60" : "bg-[#a29bfe]"}`} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 space-y-5 scroll-smooth">
        {loading ? (
          <div className="space-y-5">
            {[0, 1, 2].map((i) => <DaySkeleton key={i} />)}
          </div>
        ) : (
          filteredDays.map((day) => (
            <DaySection
              key={day.date}
              day={day}
              isToday={day.date === today}
              userLocation={userLocation}
              onActivityTap={(a) => {
                setSelectedActivity(a);
                setScreen("activity-detail");
              }}
            />
          ))
        )}

        {!loading && totalActivities === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="w-14 h-14 bg-[#f4f4f8] rounded-2xl flex items-center justify-center mb-4">
              <Calendar size={26} className="text-[#d1d1db]" />
            </div>
            <p className="text-[15px] font-bold text-[#1a1a2e]">No upcoming activities</p>
            <p className="text-[13px] text-[#9e9eb0] mt-1 text-center max-w-[240px]">
              Create an activity to get things going nearby
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function DaySection({
  day,
  isToday,
  userLocation,
  onActivityTap,
}: {
  day: CalendarDayType;
  isToday: boolean;
  userLocation: { lat: number; lng: number };
  onActivityTap: (a: ActivityType) => void;
}) {
  if (day.activities.length === 0) return null;

  return (
    <div className="flex gap-3">
      {/* Timeline column */}
      <div className="flex flex-col items-center w-12 shrink-0 pt-1">
        <div className={`w-10 h-10 rounded-2xl flex flex-col items-center justify-center text-center ${
          isToday ? "bg-[#6c5ce7] text-white shadow-[0_0_16px_rgba(108,92,231,0.35)]" : "bg-white border border-black/[0.06] text-[#1a1a2e]"
        }`}>
          <span className="text-[8px] font-bold uppercase leading-none mt-0.5">
            {new Date(day.date).toLocaleDateString(undefined, { weekday: "short" })}
          </span>
          <span className="text-[14px] font-extrabold leading-none">
            {new Date(day.date).getDate()}
          </span>
        </div>
        <div className={`w-0.5 flex-1 mt-2 rounded-full ${isToday ? "bg-[#6c5ce7]/20" : "bg-black/[0.04]"}`} />
      </div>

      {/* Cards column */}
      <div className="flex-1 space-y-2 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[13px] font-bold ${isToday ? "text-[#6c5ce7]" : "text-[#1a1a2e]"}`}>
            {day.label}
          </span>
          {isToday && <span className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7] animate-pulse" />}
          <span className="text-[11px] text-[#9e9eb0]">{day.activities.length}</span>
        </div>
        {day.activities.map((activity, idx) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            idx={idx}
            userLocation={userLocation}
            onTap={() => onActivityTap(activity)}
          />
        ))}
      </div>
    </div>
  );
}

function ActivityCard({
  activity,
  idx,
  userLocation,
  onTap,
}: {
  activity: ActivityType;
  idx: number;
  userLocation: { lat: number; lng: number };
  onTap: () => void;
}) {
  const color = TYPE_COLORS[activity.type] || "#6c5ce7";
  const icon = ACTIVITY_TYPES.find((t) => t.value === activity.type)?.icon || "?";
  const dist = getDistance(userLocation.lat, userLocation.lng, activity.lat, activity.lng);
  const time = new Date(activity.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(idx * 0.04, 0.3), duration: 0.25 }}
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer border border-black/[0.04] flex"
    >
      {/* Color bar */}
      <div className="w-1 shrink-0" style={{ background: color }} />
      <div className="flex-1 p-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base"
            style={{ background: `${color}12` }}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-[13px] leading-snug text-[#1a1a2e] truncate">{activity.title}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-[#6c5ce7] font-semibold">{time}</span>
              <span className="text-[10px] text-[#9e9eb0]">{dist}</span>
              <span className="text-[10px] font-semibold" style={{ color }}>
                {activity._count?.participants || 0}/{activity.playersNeeded}
              </span>
            </div>
          </div>
          <ChevronRight size={14} className="text-[#d1d1db] shrink-0" />
        </div>
      </div>
    </motion.div>
  );
}
