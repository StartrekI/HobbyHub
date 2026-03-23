import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  if (d < 1) return `${Math.round(d * 1000)}m`;
  return `${d.toFixed(1)}km`;
}

export function getDistanceNum(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatRelativeTime(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const ACTIVITY_TYPES = [
  { value: "sports", label: "Sports", icon: "⚽" },
  { value: "travel", label: "Travel", icon: "✈️" },
  { value: "music", label: "Music", icon: "🎵" },
  { value: "gaming", label: "Gaming", icon: "🎮" },
  { value: "food", label: "Food & Drinks", icon: "🍔" },
  { value: "study", label: "Study Group", icon: "📚" },
  { value: "fitness", label: "Fitness", icon: "💪" },
  { value: "art", label: "Art & Craft", icon: "🎨" },
  { value: "photography", label: "Photography", icon: "📸" },
  { value: "hangout", label: "Hangout", icon: "☕" },
  { value: "event", label: "Event", icon: "🎉" },
  { value: "networking", label: "Networking", icon: "🤝" },
  { value: "workshop", label: "Workshop", icon: "🛠️" },
  { value: "other", label: "Other", icon: "⭐" },
] as const;

export const INTERESTS = [
  { id: "badminton", label: "Badminton", icon: "🏸" },
  { id: "cricket", label: "Cricket", icon: "🏏" },
  { id: "football", label: "Football", icon: "⚽" },
  { id: "basketball", label: "Basketball", icon: "🏀" },
  { id: "tennis", label: "Tennis", icon: "🎾" },
  { id: "cycling", label: "Cycling", icon: "🚴" },
  { id: "running", label: "Running", icon: "🏃" },
  { id: "yoga", label: "Yoga", icon: "🧘" },
  { id: "gym", label: "Gym", icon: "💪" },
  { id: "swimming", label: "Swimming", icon: "🏊" },
  { id: "hiking", label: "Hiking", icon: "🥾" },
  { id: "photography", label: "Photography", icon: "📸" },
  { id: "music", label: "Music", icon: "🎵" },
  { id: "gaming", label: "Gaming", icon: "🎮" },
  { id: "cooking", label: "Cooking", icon: "🍳" },
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "reading", label: "Reading", icon: "📚" },
  { id: "art", label: "Art", icon: "🎨" },
  { id: "dance", label: "Dance", icon: "💃" },
  { id: "coding", label: "Coding", icon: "💻" },
];

export const TYPE_COLORS: Record<string, string> = {
  sports: "#00B894",
  travel: "#00CED1",
  music: "#6C5CE7",
  gaming: "#E17055",
  food: "#FF6B6B",
  study: "#0984E3",
  fitness: "#FF4757",
  art: "#FD79A8",
  photography: "#636E72",
  hangout: "#F39C12",
  event: "#8E44AD",
  networking: "#2ECC71",
  workshop: "#E67E22",
  other: "#A29BFE",
};

export const ACTIVITY_CATEGORIES = [
  { value: "social", label: "Social", icon: "👋" },
  { value: "fitness", label: "Fitness", icon: "💪" },
  { value: "professional", label: "Professional", icon: "💼" },
  { value: "learning", label: "Learning", icon: "📖" },
  { value: "event", label: "Event", icon: "🎉" },
];

export const USER_ROLES = [
  { value: "founder", label: "Founder", icon: "🚀" },
  { value: "developer", label: "Developer", icon: "💻" },
  { value: "designer", label: "Designer", icon: "🎨" },
  { value: "marketer", label: "Marketer", icon: "📢" },
  { value: "student", label: "Student", icon: "🎓" },
  { value: "freelancer", label: "Freelancer", icon: "🔧" },
  { value: "investor", label: "Investor", icon: "💰" },
  { value: "other", label: "Other", icon: "👤" },
];

export const STARTUP_STAGES = [
  { value: "idea", label: "Idea Stage", icon: "💡" },
  { value: "building", label: "Building", icon: "🏗️" },
  { value: "scaling", label: "Scaling", icon: "📈" },
  { value: "established", label: "Established", icon: "🏢" },
];

export const LOOKING_FOR_OPTIONS = [
  { value: "cofounder", label: "Co-founder" },
  { value: "hiring", label: "Hiring" },
  { value: "networking", label: "Networking" },
  { value: "mentor", label: "Mentor" },
  { value: "investor", label: "Investor" },
  { value: "collaborator", label: "Collaborator" },
];

export const TRIP_TYPES = [
  { value: "adventure", label: "Adventure", icon: "🏔️" },
  { value: "beach", label: "Beach", icon: "🏖️" },
  { value: "road_trip", label: "Road Trip", icon: "🚗" },
  { value: "trekking", label: "Trekking", icon: "🥾" },
  { value: "cultural", label: "Cultural", icon: "🏛️" },
  { value: "weekend", label: "Weekend Getaway", icon: "🌅" },
];

export const IDEA_CATEGORIES = [
  { value: "tech", label: "Tech", icon: "💻" },
  { value: "social", label: "Social Impact", icon: "🌍" },
  { value: "business", label: "Business", icon: "💼" },
  { value: "creative", label: "Creative", icon: "🎨" },
  { value: "education", label: "Education", icon: "📚" },
  { value: "general", label: "General", icon: "💡" },
];

export const IDEA_STAGES = [
  { value: "concept", label: "Just an Idea" },
  { value: "validating", label: "Validating" },
  { value: "building", label: "Building MVP" },
  { value: "launched", label: "Launched" },
];

export const PROFESSIONAL_SKILLS = [
  "React", "Node.js", "Python", "Flutter", "Swift", "Kotlin",
  "ML/AI", "Design", "Marketing", "Sales", "Finance", "Operations",
  "DevOps", "Data Science", "Product", "Content", "SEO", "Video",
];

export const FEED_TYPE_COLORS: Record<string, string> = {
  activity: "#6C5CE7",
  gig: "#00B894",
  skill: "#0984E3",
  trip: "#00CED1",
  idea: "#FDCB6E",
  event: "#8E44AD",
};
