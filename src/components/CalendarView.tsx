"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, ChevronRight,
} from "lucide-react";
import { useStore } from "@/store";
import { getDistance, TYPE_COLORS, ACTIVITY_TYPES } from "@/lib/utils";
import type { CalendarDayType, ActivityType } from "@/types";

function DaySkeleton() {
  return (
    <div className="animate-pulse">
      <div className="w-20 h-4 bg-gray-100 rounded-md mb-3" />
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4">
            <div className="flex gap-3">
              <div className="w-11 h-11 rounded-xl bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2 pt-0.5">
                <div className="w-3/4 h-4 bg-gray-100 rounded-md" />
                <div className="w-1/2 h-3 bg-gray-50 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CalendarView() {
  const { user, userLocation, setScreen, setSelectedActivity } = useStore();
  const [days, setDays] = useState<CalendarDayType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchCalendar = useCallback(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/calendar?lat=${userLocation.lat}&lng=${userLocation.lng}&days=7`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDays(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, userLocation]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchCalendar();
    }
  }, [fetchCalendar]);

  const totalActivities = days.reduce((sum, d) => sum + d.activities.length, 0);

  // Date strip at top
  const today = new Date().toISOString().split("T")[0];

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute inset-0 bottom-[72px] bg-[#f5f5f7] z-[900] flex flex-col"
    >
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-2xl border-b border-gray-200/40">
        <div className="flex items-center gap-3 px-5 pt-4 pb-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setScreen("map")}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={16} className="text-gray-600" />
          </motion.button>
          <div className="flex-1">
            <h3 className="font-extrabold text-[22px] text-gray-900 tracking-tight">Calendar</h3>
          </div>
          {!loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 rounded-full"
            >
              <Calendar size={11} className="text-violet-500" />
              <span className="text-[11px] text-violet-600 font-semibold">
                {totalActivities} upcoming
              </span>
            </motion.div>
          )}
        </div>

        {/* Date strip */}
        <div className="flex gap-1.5 overflow-x-auto px-5 pb-3 no-scrollbar">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedDate(null)}
            className={`px-3.5 py-[7px] rounded-full text-[12px] font-semibold whitespace-nowrap transition-all duration-200 ${
              selectedDate === null
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-gray-100/80 text-gray-500 hover:bg-gray-200/80"
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
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-gray-100/80 text-gray-500 hover:bg-gray-200/80"
                }`}
              >
                {day.label}
                {hasActivities && (
                  <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-white/60" : "bg-violet-500"}`} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 space-y-5 scroll-smooth">
        {loading ? (
          <div className="space-y-5">
            {[0, 1, 2].map((i) => <DaySkeleton key={i} />)}
          </div>
        ) : (
          (selectedDate ? days.filter((d) => d.date === selectedDate) : days).map((day) => (
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
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Calendar size={28} className="text-gray-300" />
            </div>
            <p className="text-[15px] font-bold text-gray-800">No upcoming activities</p>
            <p className="text-[13px] text-gray-400 mt-1 text-center max-w-[240px]">
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
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className={`text-[13px] font-bold ${isToday ? "text-violet-600" : "text-gray-800"}`}>
          {day.label}
        </span>
        {isToday && (
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
        )}
        <span className="text-[11px] text-gray-400 font-medium">
          {day.activities.length} activit{day.activities.length === 1 ? "y" : "ies"}
        </span>
      </div>

      <div className="space-y-2">
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
  const color = TYPE_COLORS[activity.type] || "#6C5CE7";
  const icon = ACTIVITY_TYPES.find((t) => t.value === activity.type)?.icon || "?";
  const dist = getDistance(userLocation.lat, userLocation.lng, activity.lat, activity.lng);
  const time = new Date(activity.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.04, 0.3), duration: 0.25 }}
      whileTap={{ scale: 0.985 }}
      onClick={onTap}
      className="bg-white rounded-[20px] overflow-hidden active:bg-gray-50 transition-colors cursor-pointer"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg"
            style={{ background: `${color}12` }}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-[14px] leading-snug text-gray-900">{activity.title}</h4>
            {activity.description && (
              <p className="text-[12px] text-gray-400 mt-0.5 line-clamp-1 leading-relaxed">{activity.description}</p>
            )}
          </div>
          <ChevronRight size={16} className="text-gray-300 mt-1 shrink-0" />
        </div>

        <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-gray-100/70">
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 px-2 py-[3px] rounded-md font-medium">
            <Clock size={10} /> {time}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 px-2 py-[3px] rounded-md font-medium">
            <MapPin size={10} /> {dist}
          </span>
          {activity.creator && (
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
              <span
                className="w-4 h-4 rounded flex items-center justify-center text-white text-[7px] font-bold"
                style={{ background: color }}
              >
                {activity.creator.name?.charAt(0) || "?"}
              </span>
              <span className="font-medium text-gray-500 max-w-[60px] truncate">{activity.creator.name}</span>
            </span>
          )}
          <span className="flex-1" />
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-violet-50 text-violet-500 px-2 py-[3px] rounded-md">
            <Users size={10} /> {activity._count?.participants || 0}/{activity.playersNeeded}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
