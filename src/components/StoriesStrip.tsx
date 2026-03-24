"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/store";
import { formatRelativeTime } from "@/lib/utils";
import type { StoryType } from "@/types";
import {
  Users, Plane, Briefcase, Lightbulb, UserPlus,
} from "lucide-react";

const STORY_ICONS: Record<string, typeof Users> = {
  new_activity: Users,
  join: UserPlus,
  new_trip: Plane,
  new_gig: Briefcase,
  new_idea: Lightbulb,
};

const STORY_COLORS: Record<string, string> = {
  new_activity: "#6C5CE7",
  join: "#00B894",
  new_trip: "#00CED1",
  new_gig: "#E17055",
  new_idea: "#FDCB6E",
};

export default function StoriesStrip() {
  const { stories, setStories, userLocation, user } = useStore();
  const hasFetched = useRef(false);

  const fetchStories = useCallback(() => {
    if (!user) return;
    fetch(`/api/stories?lat=${userLocation.lat}&lng=${userLocation.lng}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setStories(data); })
      .catch(() => {});
  }, [user, userLocation, setStories]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchStories();
    }
    const interval = setInterval(fetchStories, 30000);
    return () => clearInterval(interval);
  }, [fetchStories]);

  if (stories.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 px-1">
      {stories.slice(0, 12).map((story, i) => (
        <StoryBubble key={story.id} story={story} index={i} />
      ))}
    </div>
  );
}

function StoryBubble({ story, index }: { story: StoryType; index: number }) {
  const Icon = STORY_ICONS[story.type] || Users;
  const color = STORY_COLORS[story.type] || "#6C5CE7";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="flex flex-col items-center gap-1 min-w-[68px] max-w-[68px]"
    >
      <div
        className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center relative shadow-sm"
        style={{ background: `${color}14`, border: `2px solid ${color}40` }}
      >
        {story.avatar ? (
          <img
            src={story.avatar}
            alt=""
            className="w-9 h-9 rounded-xl object-cover"
          />
        ) : (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-bold"
            style={{ background: color }}
          >
            {story.userName.charAt(0)}
          </div>
        )}
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md flex items-center justify-center shadow-sm"
          style={{ background: color }}
        >
          <Icon size={10} className="text-white" />
        </div>
      </div>
      <div className="text-center w-full">
        <p className="text-[9px] font-semibold text-gray-700 truncate leading-tight">
          {story.userName.split(" ")[0]}
        </p>
        <p className="text-[8px] text-gray-400 leading-tight">
          {formatRelativeTime(story.createdAt)}
        </p>
      </div>
    </motion.div>
  );
}
