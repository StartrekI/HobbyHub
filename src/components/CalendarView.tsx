"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, ChevronLeft, ChevronRight, Clock, MapPin, Users, Search,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/store";
import { getDistance, TYPE_COLORS, ACTIVITY_TYPES } from "@/lib/utils";
import type { CalendarDayType, ActivityType } from "@/types";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday=0 ... Sunday=6
}

function CalendarSkeleton() {
  return (
    <div className="px-6 py-4 space-y-4">
      <div className="w-40 h-5 skeleton rounded" />
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-8 skeleton rounded" />
        ))}
      </div>
      <div className="w-32 h-4 skeleton rounded mt-6" />
      <div className="h-28 skeleton rounded-xl" />
      <div className="h-20 skeleton rounded-xl" />
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

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

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

  // Build a map of date -> activities for the calendar grid
  const activityDateMap = useMemo(() => {
    const map: Record<string, ActivityType[]> = {};
    days.forEach((day) => {
      if (day.activities.length > 0) {
        map[day.date] = day.activities;
      }
    });
    return map;
  }, [days]);

  const filteredDays = useMemo(() => {
    return selectedDate ? days.filter((d) => d.date === selectedDate) : days;
  }, [selectedDate, days]);

  const today = new Date().toISOString().split("T")[0];
  const todayDate = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();

  // Calendar grid calculations
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);

  const monthName = new Date(viewYear, viewMonth).toLocaleString("default", { month: "long" });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  const goToday = () => {
    setViewYear(todayYear);
    setViewMonth(todayMonth);
    setSelectedDate(null);
  };

  // Build calendar grid cells
  const calendarCells = useMemo(() => {
    const cells: { day: number; inMonth: boolean; dateStr: string }[] = [];

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = viewMonth === 0 ? 12 : viewMonth;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({ day: d, inMonth: false, dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, inMonth: true, dateStr });
    }

    // Next month leading days
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const m = viewMonth === 11 ? 1 : viewMonth + 2;
        const y = viewMonth === 11 ? viewYear + 1 : viewYear;
        cells.push({ day: d, inMonth: false, dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
      }
    }

    return cells;
  }, [viewYear, viewMonth, firstDay, prevMonthDays, daysInMonth]);

  // Color legend entries derived from actual activity data
  const TYPE_DOT_COLORS: Record<string, string> = {
    sports: "#8e51ff",
    music: "#0d9488",
    food: "#eab308",
    hangout: "#eab308",
    gaming: "#e24434",
    travel: "#0d9488",
    fitness: "#e24434",
    study: "#0d9488",
    art: "#e24434",
    event: "#8e51ff",
    networking: "#0d9488",
    other: "#eab308",
  };

  function getDotsForDate(dateStr: string) {
    const activities = activityDateMap[dateStr];
    if (!activities || activities.length === 0) return [];
    const uniqueColors = new Set<string>();
    activities.forEach((a) => {
      uniqueColors.add(TYPE_DOT_COLORS[a.type] || "#8e51ff");
    });
    return Array.from(uniqueColors).slice(0, 3);
  }

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="h-full bg-white flex flex-col"
    >
      {/* Header */}
      <div className="flex px-6 pt-6 pb-0 flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setScreen("map")}
            >
              <ChevronLeft className="size-5 text-zinc-950" />
            </motion.button>
            <span className="font-semibold text-lg leading-7 text-zinc-950">Calendar</span>
          </div>
          <div className="flex items-center gap-4">
            <Search className="size-5 text-[#71717b]" />
            <Bell className="size-5 text-[#71717b]" />
          </div>
        </div>

        {/* Month/year with navigation */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl leading-7 text-zinc-950">{monthName} {viewYear}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="p-1 h-auto" onClick={prevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" className="p-1 h-auto" onClick={nextMonth}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="outline" className="rounded-lg text-xs leading-4 px-2 h-7" onClick={goToday}>
              Today
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <CalendarSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-7 text-center gap-1">
              {/* Day headers */}
              {DAY_NAMES.map((name) => (
                <span key={name} className="font-medium text-[#71717b] text-xs leading-4 py-1">{name}</span>
              ))}

              {/* Date cells */}
              {calendarCells.map((cell, idx) => {
                const isToday = cell.inMonth && cell.day === todayDate && viewMonth === todayMonth && viewYear === todayYear;
                const isSelected = selectedDate === cell.dateStr;
                const dots = getDotsForDate(cell.dateStr);

                return (
                  <motion.button
                    key={idx}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (cell.inMonth) {
                        setSelectedDate(isSelected ? null : cell.dateStr);
                      }
                    }}
                    className="flex flex-col items-center gap-0.5"
                  >
                    {isSelected || isToday ? (
                      <div className={`rounded-full flex justify-center items-center w-7 h-7 ${
                        isSelected ? "bg-[#8e51ff]" : "bg-[#8e51ff]"
                      }`}>
                        <span className="font-semibold text-violet-50 text-xs leading-4">{cell.day}</span>
                      </div>
                    ) : (
                      <span className={`text-xs leading-4 py-2 ${
                        cell.inMonth ? "text-zinc-950" : "text-[#71717b]/40"
                      }`}>
                        {cell.day}
                      </span>
                    )}
                    {dots.length > 0 && (
                      <div className="flex gap-0.5">
                        {dots.map((color, di) => (
                          <div
                            key={di}
                            className="rounded-full w-1 h-1"
                            style={{ background: (isSelected || isToday) ? "rgba(255,255,255,0.7)" : color }}
                          />
                        ))}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex justify-center items-center gap-4 pb-2">
              <div className="flex items-center gap-1">
                <div className="rounded-full bg-[#8e51ff] w-2 h-2" />
                <span className="text-[#71717b] text-[10px]">Sports</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="rounded-full bg-[#e24434] w-2 h-2" />
                <span className="text-[#71717b] text-[10px]">Fitness</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="rounded-full bg-[#0d9488] w-2 h-2" />
                <span className="text-[#71717b] text-[10px]">Music</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="rounded-full bg-[#eab308] w-2 h-2" />
                <span className="text-[#71717b] text-[10px]">Hangouts</span>
              </div>
            </div>

            <Separator />
          </>
        )}
      </div>

      {/* Upcoming Events */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex px-6 pt-4 pb-4 flex-col gap-4">
          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 skeleton rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              {/* Selected date header or "Upcoming" */}
              {selectedDate ? (
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm leading-5 text-zinc-950">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <span className="font-medium text-[#8e51ff] text-xs leading-4">
                    {filteredDays.reduce((sum, d) => sum + d.activities.length, 0)} activities
                  </span>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#71717b] text-sm leading-5">Upcoming</span>
                  <Button variant="ghost" className="text-[#8e51ff] text-xs leading-4 p-0 h-auto">
                    View all
                  </Button>
                </div>
              )}

              {/* Activity Cards */}
              {filteredDays.map((day) =>
                day.activities.map((activity, idx) => (
                  <ActivityEventCard
                    key={activity.id}
                    activity={activity}
                    day={day}
                    idx={idx}
                    userLocation={userLocation}
                    onTap={() => {
                      setSelectedActivity(activity);
                      setScreen("activity-detail");
                    }}
                  />
                ))
              )}

              {!loading && totalActivities === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16"
                >
                  <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4">
                    <Clock size={26} className="text-zinc-300" />
                  </div>
                  <p className="text-sm font-bold text-zinc-950">No upcoming activities</p>
                  <p className="text-xs text-[#71717b] mt-1 text-center max-w-[240px]">
                    Create an activity to get things going nearby
                  </p>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ActivityEventCard({
  activity,
  day,
  idx,
  userLocation,
  onTap,
}: {
  activity: ActivityType;
  day: CalendarDayType;
  idx: number;
  userLocation: { lat: number; lng: number };
  onTap: () => void;
}) {
  const color = TYPE_COLORS[activity.type] || "#8e51ff";
  const icon = ACTIVITY_TYPES.find((t) => t.value === activity.type)?.icon || "?";
  const dist = getDistance(userLocation.lat, userLocation.lng, activity.lat, activity.lng);
  const time = new Date(activity.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const participantCount = activity._count?.participants || 0;
  const dateObj = new Date(day.date + "T00:00:00");
  const monthShort = dateObj.toLocaleString("default", { month: "short" }).toUpperCase();
  const dayNum = dateObj.getDate();
  const weekday = dateObj.toLocaleString("default", { weekday: "short" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.05, 0.3), duration: 0.25 }}
    >
      <Card className="p-4 border-0 cursor-pointer hover:bg-zinc-50 transition-colors" onClick={onTap}>
        <CardContent className="p-0">
          <div className="flex items-start gap-4">
            {/* Date column */}
            <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
              <span className="font-medium text-[#71717b] text-[10px]">{monthShort}</span>
              <span className="leading-none font-bold text-zinc-950 text-lg">{dayNum}</span>
              <span className="text-[#71717b] text-[10px]">{weekday}</span>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 gap-1">
              <div className="flex items-center gap-2">
                <div className="rounded-full w-1.5 h-1.5" style={{ background: color }} />
                <span className="font-medium text-sm leading-5 text-zinc-950">{activity.title}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="size-3 text-[#71717b]" />
                <span className="text-[#71717b] text-[11px]">{time}</span>
                <span className="text-[#71717b] text-[11px]">·</span>
                <MapPin className="size-3 text-[#71717b]" />
                <span className="text-[#71717b] text-[11px]">{dist} away</span>
              </div>
              {participantCount > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="-space-x-2 flex">
                    {Array.from({ length: Math.min(participantCount, 3) }).map((_, i) => (
                      <Avatar key={i} className="border-white border-1 border-solid w-5 h-5">
                        <AvatarFallback className={`${i === 0 ? "bg-[#8e51ff] text-violet-50" : "bg-zinc-100 text-zinc-900"} text-[8px]`}>
                          {i === 2 && participantCount > 3 ? `+${participantCount - 2}` : "??"}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-[#71717b] text-[11px]">{participantCount} going</span>
                </div>
              )}
            </div>

            {/* Join button */}
            <Button
              size="sm"
              className="rounded-lg bg-[#8e51ff] text-violet-50 text-xs leading-4 px-3 self-center h-7 hover:bg-[#7c3aed]"
              onClick={(e) => { e.stopPropagation(); onTap(); }}
            >
              Join
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
