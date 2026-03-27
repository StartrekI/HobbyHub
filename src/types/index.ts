export interface UserType {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio: string;
  avatar: string;
  interests: string[];
  lat: number;
  lng: number;
  online: boolean;
  lastSeenAt?: string;
  shareLocation: boolean;
  rating: number;
  verified: boolean;
  // Professional
  role: string;
  startupStage: string;
  company: string;
  title: string;
  lookingFor: string;
  skills: string[];
  // College
  collegeId: string;
  collegeName: string;
  graduationYear: number;
  // Stats
  connectionsCount: number;
  activitiesJoined: number;
}

export interface ActivityType {
  id: string;
  type: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  time: string;
  playersNeeded: number;
  status: string;
  category: string;
  isEvent: boolean;
  ticketPrice: number;
  isFree: boolean;
  eventUrl: string;
  isRecurring: boolean;
  recurrencePattern: string;
  creatorId: string;
  creator: UserType;
  participants: ParticipantType[];
  _count?: { participants: number; messages: number };
}

export interface ParticipantType {
  id: string;
  userId: string;
  activityId: string;
  joinedAt: string;
  user: UserType;
}

export interface MessageType {
  id: string;
  text: string;
  createdAt: string;
  senderId: string;
  activityId: string;
  sender: UserType;
}

export interface NotificationType {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  data: string;
  createdAt: string;
}

export interface HotspotType {
  id: string;
  lat: number;
  lng: number;
  count: number;
  label: string;
  activities: ActivityType[];
}

export interface SkillSessionType {
  id: string;
  skill: string;
  description: string;
  sessionType: string;
  isFree: boolean;
  price: number;
  schedule: string;
  lat: number;
  lng: number;
  status: string;
  createdAt: string;
  teacherId: string;
  teacher: UserType;
  learnerId?: string;
  learner?: UserType;
}

export interface GigType {
  id: string;
  title: string;
  description: string;
  budget: number;
  skills: string[];
  deadline: string;
  location: string;
  lat: number;
  lng: number;
  status: string;
  createdAt: string;
  creatorId: string;
  creator: UserType;
  applications?: GigApplicationType[];
  _count?: { applications: number };
}

export interface GigApplicationType {
  id: string;
  message: string;
  status: string;
  createdAt: string;
  gigId: string;
  userId: string;
  user: UserType;
}

export interface TripType {
  id: string;
  destination: string;
  description: string;
  startDate: string;
  endDate: string;
  tripType: string;
  budget: string;
  maxBuddies: number;
  lat: number;
  lng: number;
  status: string;
  createdAt: string;
  creatorId: string;
  creator: UserType;
  participants?: TripParticipantType[];
  _count?: { participants: number };
}

export interface TripParticipantType {
  id: string;
  tripId: string;
  userId: string;
  user: UserType;
}

export interface IdeaType {
  id: string;
  title: string;
  description: string;
  category: string;
  stage: string;
  lookingFor: string;
  likes: number;
  lat: number;
  lng: number;
  createdAt: string;
  creatorId: string;
  creator: UserType;
  comments?: IdeaCommentType[];
  _count?: { comments: number };
}

export interface IdeaCommentType {
  id: string;
  text: string;
  createdAt: string;
  ideaId: string;
  userId: string;
  user: UserType;
}

export interface ConnectionType {
  id: string;
  status: string;
  interactionCount: number;
  fromUserId: string;
  toUserId: string;
  fromUser: UserType;
  toUser: UserType;
}

export interface BusinessType {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  website: string;
  hours: string;
  rating: number;
  ownerId: string;
  owner: UserType;
}

export interface CalendarDayType {
  date: string;
  label: string;
  activities: ActivityType[];
}

export interface FeedItem {
  id: string;
  feedType: "activity" | "gig" | "skill" | "trip" | "idea" | "event";
  title: string;
  description: string;
  lat: number;
  lng: number;
  createdAt: string;
  creator: UserType;
  data: ActivityType | GigType | SkillSessionType | TripType | IdeaType;
}
