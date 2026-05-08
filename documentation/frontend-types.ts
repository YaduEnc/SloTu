/**
 * SLOTU — Frontend API Contract Types
 * =====================================
 * This file is the SINGLE SOURCE OF TRUTH for what the React frontend expects
 * from every backend endpoint. The backend Pydantic models MUST produce JSON
 * that matches these TypeScript interfaces exactly (field names, types,
 * nullability, enum values).
 *
 * If the backend wants to change any contract here, this file must be updated
 * first and the frontend must be coordinated.
 *
 * Conventions:
 *  - All money fields end in `_paise` and are integer paise (₹1 = 100 paise).
 *  - All datetimes are ISO 8601 UTC strings ending in 'Z'.
 *  - All IDs are UUID v4 strings.
 *  - Pagination: { items, total, page, page_size }.
 *  - Errors: see `ApiErrorEnvelope`.
 */

// =============================================================================
// COMMON
// =============================================================================

export type UUID = string;
export type ISODate = string;          // "2026-01-01T12:34:56Z"
export type Paise = number;            // integer paise
export interface ApiErrorEnvelope {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiErrorCode =
  | "INVALID_EMAIL"
  | "RATE_LIMITED"
  | "EMAIL_PROVIDER_DOWN"
  | "OTP_INVALID"
  | "OTP_EXPIRED"
  | "OTP_TOO_MANY_ATTEMPTS"
  | "ALREADY_REVEALED"
  | "UNAUTHORIZED"
  | "INSUFFICIENT_ROLE"
  | "KYC_REQUIRED"
  | "KYC_PENDING"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "IDEMPOTENCY_CONFLICT"
  | "LISTING_SOLD_OUT"
  | "LISTING_NOT_AVAILABLE"
  | "INVALID_STATE_TRANSITION"
  | "ORDER_NOT_PAID"
  | "ORDER_EXPIRED"
  | "DISPUTE_ALREADY_OPEN"
  | "REVIEW_NOT_ALLOWED"
  | "PAYMENT_FAILED"
  | "PAYOUT_FAILED"
  | "REFUND_FAILED"
  | "WEBHOOK_SIGNATURE_INVALID"
  | "INTERNAL_ERROR";

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;        // 1-indexed
  page_size: number;
}

export type SortDirection = "asc" | "desc";

// =============================================================================
// CONSTANTS / ENUMS
// =============================================================================

export type UserRole = "buyer" | "seller" | "admin";

export type ServiceCategory =
  | "video"
  | "music"
  | "design"
  | "productivity"
  | "ai"
  | "learning"
  | "gaming"
  | "security";

export type ListingStatus = "draft" | "active" | "paused" | "sold_out" | "removed";

export type OrderStatus =
  | "pending"
  | "paid"
  | "delivered"
  | "confirmed"
  | "released"
  | "disputed"
  | "refunded"
  | "cancelled"
  | "expired";

export type PaymentStatus = "created" | "pending" | "success" | "failed" | "user_dropped";
export type PayoutStatus  = "not_started" | "queued" | "processing" | "success" | "failed" | "reversed";
export type RefundStatus  = "not_started" | "queued" | "processing" | "success" | "failed";

export type CredentialType = "login" | "family_invite_link" | "invite_email_target";

export type DisputeStatus =
  | "open"
  | "investigating"
  | "resolved_buyer"
  | "resolved_seller"
  | "withdrawn";

export type DisputeReasonCode =
  | "access_not_working"
  | "seller_unresponsive"
  | "wrong_credentials"
  | "removed_from_plan"
  | "other";

export type KycStatus = "pending" | "submitted" | "approved" | "rejected";

export type NotificationChannel = "in_app" | "sms" | "email" | "ws";

export type NotificationType =
  | "auth.otp_sent"
  | "order.created"
  | "order.paid"
  | "order.delivered"
  | "order.confirmed"
  | "order.released"
  | "order.cancelled"
  | "order.expired"
  | "order.disputed"
  | "dispute.resolved"
  | "kyc.approved"
  | "kyc.rejected"
  | "payout.failed"
  | "review.received";

// =============================================================================
// AUTH
// =============================================================================

export interface OtpSendRequest {
  email: string;
}
export interface OtpSendResponse {
  request_id: UUID;
  expires_in: number;        // seconds, e.g. 300
}

export interface OtpVerifyRequest {
  request_id: UUID;
  email: string;
  otp: string;               // 6-digit
}
export interface OtpVerifyResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;        // seconds, e.g. 900
  user: User;
  is_new_user: boolean;
}

export interface RefreshResponse {
  access_token: string;
  expires_in: number;
}

// =============================================================================
// USER
// =============================================================================

export interface User {
  id: UUID;
  phone: string | null;              // currently null in the email-OTP flow
  name: string | null;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: ISODate;
  seller_profile?: SellerProfile | null;   // included on /api/auth/me when seller
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
}

export interface SellerProfile {
  id: UUID;
  user_id: UUID;
  upi_id: string | null;
  upi_verified: boolean;
  aadhaar_verified: boolean;        // legacy optional field, not used in current onboarding UI
  trust_score: number;          // 0.0–5.0, 2 decimals
  total_sales: number;
  total_disputes: number;
  kyc_status: KycStatus;
  pro_plan_active: boolean;
  pro_plan_expires_at: ISODate | null;
  member_since: ISODate;        // = created_at
}

export interface PublicSellerProfile {
  id: UUID;
  name: string;                 // first name + initial
  trust_score: number;
  total_sales: number;
  kyc_verified: boolean;
  member_since: ISODate;
}

export interface BecomeSellerResponse {
  seller_profile: SellerProfile;
}

export interface UpiSetRequest { upi_id: string; }
export interface UpiSetResponse {
  upi_id: string;
  upi_verified: boolean;
  verification_status: string;
}

export interface AadhaarSendOtpRequest { aadhaar: string; }   // legacy optional flow, 12 digits, NEVER stored
export interface AadhaarSendOtpResponse { kyc_request_id: UUID; }

export interface AadhaarVerifyOtpRequest {
  kyc_request_id: UUID;
  otp: string;
}
export type AadhaarVerifyOtpResponse = SellerProfile;

// =============================================================================
// LISTING
// =============================================================================

export interface ListingSellerSummary {
  id: UUID;
  name: string;
  trust_score: number;
  total_sales: number;
  kyc_verified: boolean;
}

export interface Listing {
  id: UUID;
  service_name: string;
  service_slug: string;
  service_category: ServiceCategory;
  price_paise: Paise;
  duration_days: number;
  slots_total: number;
  slots_available: number;
  description: string | null;
  status: ListingStatus;
  rating_avg: number;
  rating_count: number;
  is_boosted: boolean;
  seller: ListingSellerSummary;
  created_at: ISODate;
}

export interface ListingDetail extends Listing {
  recent_reviews: Review[];   // last 10
  views: number;
}

export interface MyListing extends Listing {
  total_revenue_paise: Paise;
  active_orders: number;
  has_credentials: boolean;
}

export interface ListingListQuery {
  category?: ServiceCategory;
  service_slug?: string;
  min_price?: Paise;
  max_price?: Paise;
  min_duration?: number;
  max_duration?: number;
  min_rating?: number;
  sort?: "price_asc" | "price_desc" | "rating_desc" | "recent" | "boosted";
  page?: number;
  page_size?: number;
}

export interface ListingCreateRequest {
  service_slug: string;
  price_paise: Paise;
  duration_days: number;
  slots_total: number;          // 1–10
  description?: string;
}

export interface ListingUpdateRequest {
  price_paise?: Paise;
  slots_total?: number;
  description?: string;
  status?: "active" | "paused" | "draft";
}

export interface ServiceCatalogItem {
  slug: string;
  name: string;
  category: ServiceCategory;
  logo_url: string | null;
  tos_sharing_allowed: boolean;
}

// =============================================================================
// ORDER
// =============================================================================

export interface ListingSnapshot {
  service_name: string;
  service_slug: string;
  duration_days: number;
}

export interface Order {
  id: UUID;
  order_number: string;          // SLOT-2026-000123
  listing_id: UUID;
  listing_snapshot: ListingSnapshot;
  buyer_id: UUID;
  seller_id: UUID;
  amount_paise: Paise;
  platform_fee_paise: Paise;
  seller_payout_paise: Paise;
  fee_percent: number;           // 4.0 or 6.0 etc.
  status: OrderStatus;
  delivery_method: CredentialType | null;
  expires_at: ISODate;
  delivered_at: ISODate | null;
  confirmed_at: ISODate | null;
  released_at: ISODate | null;
  cancelled_reason: string | null;
  created_at: ISODate;
}

export interface OrderCreateRequest {
  listing_id: UUID;
  idempotency_key: UUID;
}

export interface OrderCreateResponse {
  order_id: UUID;
  order_number: string;
  amount_paise: Paise;
  cashfree_order_id: string;
  payment_session_id: string;
  expires_at: ISODate;
}

export interface OrderListQuery {
  role?: "buyer" | "seller";
  status?: OrderStatus | "active" | "completed";
  page?: number;
  page_size?: number;
}

export interface OrderStatusResponse {
  order_id: UUID;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payout_status: PayoutStatus;
  refund_status: RefundStatus;
}

// =============================================================================
// VAULT
// =============================================================================

export interface VaultCredentialCreateRequest {
  credential_type: CredentialType;
  data: VaultLoginData | VaultInviteLinkData | VaultInviteEmailData;
}

export interface VaultLoginData {
  email: string;
  password: string;
  notes?: string;
}
export interface VaultInviteLinkData {
  invite_url: string;
  notes?: string;
}
export interface VaultInviteEmailData {
  send_to_email: string;
  instructions: string;
}

/** Server NEVER returns plaintext data here. */
export interface VaultCredentialMeta {
  id: UUID;
  credential_type: CredentialType;
  consumed_by_order_id: UUID | null;
  created_at: ISODate;
}

export interface VaultRevealRequestResponse {
  request_id: UUID;
  expires_in: number;       // seconds
}

export interface VaultRevealVerifyRequest {
  request_id: UUID;
  otp: string;
}

/** Returned ONCE on successful reveal verify — never cached, never re-fetchable. */
export interface VaultRevealVerifyResponse {
  credential_type: CredentialType;
  data: VaultLoginData | VaultInviteLinkData | VaultInviteEmailData;
  delivered_at: ISODate;
  warning: string;          // e.g. "These credentials will not be shown again..."
}

// =============================================================================
// REVIEW
// =============================================================================

export interface Review {
  id: UUID;
  order_id: UUID;
  buyer_id: UUID;
  buyer_name: string;        // first + initial
  seller_id: UUID;
  listing_id: UUID;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string | null;
  created_at: ISODate;
}

export interface ReviewCreateRequest {
  order_id: UUID;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
}

// =============================================================================
// DISPUTE
// =============================================================================

export interface Dispute {
  id: UUID;
  order_id: UUID;
  raised_by: UUID;
  reason_code: DisputeReasonCode;
  reason_text: string | null;
  evidence_urls: string[];
  status: DisputeStatus;
  resolution_note: string | null;
  resolved_at: ISODate | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface DisputeCreateRequest {
  order_id: UUID;
  reason_code: DisputeReasonCode;
  reason_text?: string;
  evidence_urls?: string[];
}

export interface DisputeUploadPresignRequest {
  filename: string;
  content_type: "image/png" | "image/jpeg" | "image/webp" | "application/pdf";
  size_bytes: number;
}
export interface DisputeUploadPresignResponse {
  upload_url: string;       // presigned PUT URL
  public_url: string;       // final URL to send back in evidence_urls
  expires_in: number;
}

// =============================================================================
// PAYOUT
// =============================================================================

export interface Payout {
  id: UUID;
  order_id: UUID;
  amount_paise: Paise;
  upi_id: string | null;
  status: PayoutStatus;
  failure_reason: string | null;
  initiated_at: ISODate | null;
  settled_at: ISODate | null;
  created_at: ISODate;
}

// =============================================================================
// NOTIFICATION
// =============================================================================

export interface Notification {
  id: UUID;
  type: NotificationType;
  title: string;
  message: string;
  cta_url: string | null;
  read: boolean;
  channel: NotificationChannel;
  meta: Record<string, unknown> | null;
  created_at: ISODate;
}

export interface NotificationListResponse {
  unread: Notification[];
  read: Notification[];
  unread_count: number;
}

// WebSocket frames
export type WsServerEvent =
  | { type: "ping" }
  | { type: "notification.new"; data: Notification }
  | { type: "order.state"; data: { order_id: UUID; status: OrderStatus } };

export type WsClientEvent =
  | { type: "pong" }
  | { type: "subscribe"; topics: string[] };

// =============================================================================
// ADMIN
// =============================================================================

export interface AdminDashboardKpis {
  gmv_paise: Paise;
  platform_revenue_paise: Paise;
  active_listings: number;
  active_sellers: number;
  active_buyers: number;
  open_disputes: number;
  pending_kyc: number;
  queued_payouts: number;
  failed_payouts_last_24h: number;
}

export interface AdminDashboardResponse {
  kpis: AdminDashboardKpis;
  trend: {
    gmv_daily: { date: string; amount_paise: Paise }[];
    orders_daily: { date: string; count: number }[];
  };
  top_services: { service_slug: string; orders: number; gmv_paise: Paise }[];
}

export interface AdminDisputeResolveRequest {
  resolution: "buyer_refund" | "seller_release" | "split";
  split_percent_to_seller?: number;     // 0–100, only when resolution=split
  note: string;
}

export interface AdminKycRejectRequest { reason: string; }
export interface AdminListingTakedownRequest { reason: string; }
export interface AdminUserSuspendRequest {
  reason: string;
  suspend_for_days: number;
}

export interface AdminBroadcastRequest {
  audience:
    | "all_buyers"
    | "all_sellers"
    | "kyc_pending"
    | { user_ids: UUID[] };
  title: string;
  message: string;
  channels: NotificationChannel[];
}

// =============================================================================
// WAITLIST (used by current landing page)
// =============================================================================

export interface WaitlistJoinRequest {
  name: string;
  email: string;
  intent: "buyer" | "seller";
}

export interface WaitlistJoinResponse {
  ok: true;
  position: number;        // queue position
}

export interface WaitlistCountResponse {
  total: number;
}

// =============================================================================
// PUBLIC CONFIG (server-driven feature flags)
// =============================================================================

export interface PublicConfig {
  features: {
    waitlist_enabled: boolean;
    checkout_enabled: boolean;
    pro_plan_enabled: boolean;
  };
  fee: {
    default_percent: number;
    pro_percent: number;
  };
  service_catalog: ServiceCatalogItem[];
}

// =============================================================================
// HEALTH
// =============================================================================

export interface HealthResponse {
  status: "ok" | "degraded" | "down";
  version: string;
  db: "ok" | "down";
  redis: "ok" | "down";
}

// =============================================================================
// HTTP CALL MAP — backend MUST implement these exact paths and shapes
// =============================================================================
//
// Method   Path                                                Req                              Res
// -------- --------------------------------------------------- -------------------------------- -------------------------------
// GET      /api/health                                         —                                HealthResponse
// GET      /api/config/public                                  —                                PublicConfig
//
// POST     /api/auth/otp/send                                  OtpSendRequest                   OtpSendResponse
// POST     /api/auth/otp/verify                                OtpVerifyRequest                 OtpVerifyResponse
// POST     /api/auth/refresh                                   — (cookie)                       RefreshResponse
// POST     /api/auth/logout                                    —                                204
// GET      /api/auth/me                                        —                                User
//
// PATCH    /api/users/me                                       UserUpdateRequest                User
// POST     /api/users/become-seller                            —                                BecomeSellerResponse
// POST     /api/users/seller/upi                               UpiSetRequest                    UpiSetResponse
// POST     /api/users/seller/aadhaar/send-otp                  AadhaarSendOtpRequest            AadhaarSendOtpResponse   (legacy optional flow)
// POST     /api/users/seller/aadhaar/verify-otp                AadhaarVerifyOtpRequest          AadhaarVerifyOtpResponse (legacy optional flow)
// GET      /api/users/seller/:user_id/public                   —                                PublicSellerProfile
//
// GET      /api/listings                                       ListingListQuery (qs)            PaginatedResponse<Listing>
// GET      /api/listings/:id                                   —                                ListingDetail
// POST     /api/listings                                       ListingCreateRequest             Listing
// PATCH    /api/listings/:id                                   ListingUpdateRequest             Listing
// DELETE   /api/listings/:id                                   —                                204
// GET      /api/listings/me                                    —                                PaginatedResponse<MyListing>
// GET      /api/listings/services/catalog                      —                                ServiceCatalogItem[]
//
// POST     /api/orders                                         OrderCreateRequest               OrderCreateResponse
// GET      /api/orders/:id                                     —                                Order
// GET      /api/orders/me                                      OrderListQuery (qs)              PaginatedResponse<Order>
// POST     /api/orders/:id/confirm                             —                                Order
// POST     /api/orders/:id/cancel                              —                                Order
//
// POST     /api/payments/create-session                        { order_id }                     { payment_session_id, cashfree_order_id }
// POST     /api/payments/webhook/cashfree                      raw Cashfree payload             200
// POST     /api/payments/webhook/payouts                       raw Cashfree Payouts payload     200
// GET      /api/payments/order-status/:order_id                —                                OrderStatusResponse
//
// POST     /api/vault/listings/:listing_id/credentials         VaultCredentialCreateRequest     VaultCredentialMeta
// DELETE   /api/vault/credentials/:id                          —                                204
// POST     /api/vault/orders/:order_id/reveal/request          —                                VaultRevealRequestResponse
// POST     /api/vault/orders/:order_id/reveal/verify           VaultRevealVerifyRequest         VaultRevealVerifyResponse
//
// POST     /api/reviews                                        ReviewCreateRequest              Review
// GET      /api/reviews/seller/:user_id                        page,page_size                   PaginatedResponse<Review>
// GET      /api/reviews/listing/:listing_id                    page,page_size                   PaginatedResponse<Review>
//
// POST     /api/disputes                                       DisputeCreateRequest             Dispute
// GET      /api/disputes/me                                    page,page_size                   PaginatedResponse<Dispute>
// POST     /api/disputes/:id/withdraw                          —                                Dispute
// POST     /api/disputes/uploads/presign                       DisputeUploadPresignRequest      DisputeUploadPresignResponse
//
// GET      /api/payouts/me                                     page,page_size                   PaginatedResponse<Payout>
//
// GET      /api/notifications                                  —                                NotificationListResponse
// POST     /api/notifications/:id/read                         —                                204
// POST     /api/notifications/read-all                         —                                204
// WS       /api/ws/notifications?token=<jwt>                   WsClientEvent                    WsServerEvent
//
// GET      /api/admin/dashboard                                range=7d|30d|90d|all             AdminDashboardResponse
// GET      /api/admin/disputes                                 status,page,page_size            PaginatedResponse<Dispute>
// GET      /api/admin/disputes/:id                             —                                Dispute
// POST     /api/admin/disputes/:id/resolve                     AdminDisputeResolveRequest       Dispute
// GET      /api/admin/sellers/pending-kyc                      page,page_size                   PaginatedResponse<SellerProfile>
// POST     /api/admin/sellers/:user_id/kyc/approve             —                                SellerProfile
// POST     /api/admin/sellers/:user_id/kyc/reject              AdminKycRejectRequest            SellerProfile
// GET      /api/admin/listings                                 status,service,page              PaginatedResponse<Listing>
// POST     /api/admin/listings/:id/takedown                    AdminListingTakedownRequest      Listing
// GET      /api/admin/users                                    q,page                           PaginatedResponse<User>
// POST     /api/admin/users/:id/suspend                        AdminUserSuspendRequest          User
// POST     /api/admin/users/:id/unsuspend                      —                                User
// POST     /api/admin/broadcast                                AdminBroadcastRequest            { ok: true }
//
// POST     /api/waitlist                                       WaitlistJoinRequest              WaitlistJoinResponse
// GET      /api/waitlist/count                                 —                                WaitlistCountResponse
//
// =============================================================================
// END
// =============================================================================
