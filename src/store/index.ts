import { create } from "zustand";
import type { ActivityType, UserType, MessageType, NotificationType, HotspotType } from "@/types";

type Screen =
  | "map"
  | "create"
  | "chat-list"
  | "chat"
  | "profile"
  | "notifications"
  | "activity-detail"
  | "discover"
  | "networking"
  | "create-opportunity"
  | "calendar";

interface AppState {
  // User
  user: UserType | null;
  setUser: (user: UserType | null) => void;

  // Location
  userLocation: { lat: number; lng: number };
  setUserLocation: (loc: { lat: number; lng: number }) => void;

  // Screen
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;

  // Activities
  activities: ActivityType[];
  setActivities: (activities: ActivityType[]) => void;
  addActivity: (activity: ActivityType) => void;

  // Nearby users
  nearbyUsers: UserType[];
  setNearbyUsers: (users: UserType[]) => void;

  // Hotspots
  hotspots: HotspotType[];
  setHotspots: (hotspots: HotspotType[]) => void;

  // Selected activity
  selectedActivity: ActivityType | null;
  setSelectedActivity: (activity: ActivityType | null) => void;

  // Chat
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
  chatMessages: Record<string, MessageType[]>;
  setChatMessages: (id: string, messages: MessageType[]) => void;
  addChatMessage: (id: string, message: MessageType) => void;

  // Notifications
  notifications: NotificationType[];
  setNotifications: (notifications: NotificationType[]) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;

  // Map filter
  mapFilter: "all" | "activities" | "people" | "online" | "hotspots";
  setMapFilter: (filter: "all" | "activities" | "people" | "online" | "hotspots") => void;

  // Bottom sheet
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;

  // Onboarding
  onboarded: boolean;
  setOnboarded: (done: boolean) => void;

  // Create opportunity type
  opportunityType: "gig" | "trip" | "skill" | "idea";
  setOpportunityType: (type: "gig" | "trip" | "skill" | "idea") => void;

}

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  userLocation: { lat: 0, lng: 0 },
  setUserLocation: (userLocation) => set({ userLocation }),

  currentScreen: "map",
  setScreen: (currentScreen) => set({ currentScreen }),

  activities: [],
  setActivities: (activities) => set({ activities }),
  addActivity: (activity) =>
    set((state) => ({ activities: [activity, ...state.activities] })),

  nearbyUsers: [],
  setNearbyUsers: (nearbyUsers) => set({ nearbyUsers }),

  hotspots: [],
  setHotspots: (hotspots) => set({ hotspots }),

  selectedActivity: null,
  setSelectedActivity: (selectedActivity) => set({ selectedActivity }),

  currentChatId: null,
  setCurrentChatId: (currentChatId) => set({ currentChatId }),
  chatMessages: {},
  setChatMessages: (id, messages) =>
    set((state) => ({ chatMessages: { ...state.chatMessages, [id]: messages } })),
  addChatMessage: (id, message) =>
    set((state) => ({
      chatMessages: {
        ...state.chatMessages,
        [id]: [...(state.chatMessages[id] || []), message],
      },
    })),

  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  unreadCount: 0,
  setUnreadCount: (unreadCount) => set({ unreadCount }),

  mapFilter: "all",
  setMapFilter: (mapFilter) => set({ mapFilter }),

  sheetOpen: false,
  setSheetOpen: (sheetOpen) => set({ sheetOpen }),

  onboarded: false,
  setOnboarded: (onboarded) => set({ onboarded }),

  opportunityType: "gig",
  setOpportunityType: (opportunityType) => set({ opportunityType }),

}));
