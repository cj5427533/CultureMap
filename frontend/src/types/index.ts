export interface AuthResponse {
  token: string;
  refreshToken?: string;
  email: string;
  nickname: string;
  role?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Place {
  id: number;
  name: string;
  address?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  visitOrder?: number;
  visitTime?: string;
}

export interface Plan {
  id: number;
  planDate: string;
  title?: string;
  memberNickname: string;
  places: Place[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanRequest {
  planDate: string;
  title?: string;
  placeIds: number[];
  visitTimes?: { [placeId: string]: string }; // placeId (string) -> visitTime (HH:mm 형식)
}

export interface PlanPost {
  id: number;
  planId: number;
  title: string;
  description?: string;
  authorNickname: string;
  averageRating?: number;
  ratingCount?: number;
  plan: Plan;
  createdAt: string;
}

export interface Comment {
  id: number;
  postId: number;
  content: string;
  rating?: number;
  authorNickname: string;
  createdAt: string;
  updatedAt: string;
  isAuthor: boolean;
}

export interface CommentRequest {
  postId: number;
  content: string;
  rating?: number;
}

export interface Rating {
  id?: number;
  postId: number;
  score: number;
  userRating?: number; // 현재 사용자가 준 별점
}

export interface PlanPostRequest {
  planId: number;
  title: string;
  description?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalPlans: number;
  totalPosts: number;
  totalComments: number;
  totalRatings: number;
  apiUsage: {
    directionsApiCallsToday: number;
    directionsApiCallsThisMonth: number;
    searchApiCallsToday: number;
    searchApiCallsThisMonth: number;
  };
}

