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
  durationType?: string;
  duration?: number;
  durationLabel?: string;
  features?: string[];
  recommended?: boolean;
  recommendedPlan?: boolean;
  offerEnabled?: boolean;
  offerActive?: boolean;
  offerPercentage?: number;
  offerPrice?: number;
  offerDiscount?: number;
  originalAmount?: number;
  badgeText?: string | null;
  badgeColor?: string | null;
  couponAvailable?: boolean;
  offerStart?: string | null;
  offerEnd?: string | null;
}

export interface PricingPreview {
  planId: string;
  planName: string;
  durationLabel: string;
  originalAmount: number;
  offerDiscount: number;
  offerPrice: number;
  couponCode: string | null;
  couponDiscount: number;
  gst: number;
  finalAmount: number;
  message?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  razorpayKey: string;
  planName: string;
  pendingSubscriptionId: string;
  pricing?: {
    originalAmount: number;
    offerDiscount: number;
    couponDiscount: number;
    couponCode: string | null;
    finalAmount: number;
    durationLabel: string;
  };
}

export interface SubscriptionCoupon {
  id: string;
  couponCode: string;
  description: string;
  discountType: string;
  discountValue: number;
  minimumAmount: number;
  maximumDiscount: number | null;
  expiryDate?: string | null;
  usageLimit?: number | null;
  usedCount?: number;
  perUserLimit: number;
  applicablePlans?: string | null;
  status: string;
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
