export interface AuthResponse {
  token: string;
  email: string;
  nickname: string;
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
  plan: Plan;
  createdAt: string;
}

export interface PlanPostRequest {
  planId: number;
  title: string;
  description?: string;
}

