export interface User {
  id: string;
  orgId: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  status: string;
  isEmailVerified: boolean;
  isSubscribed?: boolean;
  subscriptionName?: string;
  subscriptionExpiry?: string | null;
  remainingEmailLimit?: number;
  remainingExportLimit?: number;
  organization?: Organization;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  logoUrl?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  tokens: AuthTokens;
  user: User;
}

export interface GoogleLoginResponse {
  success: boolean;
  token: string;
  tokens: AuthTokens;
  user: User;
}

export interface RegisterRequest {
  organizationName: string;
  fullName: string;
  email: string;
  phone?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  validityDays: number;
  emailLimit: number;
  exportLimit: number;
  status?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  razorpayKey: string;
  planName: string;
  pendingSubscriptionId: string;
}

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'recruiter' | 'viewer';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  admin: 80,
  manager: 60,
  recruiter: 40,
  viewer: 20,
};

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}
