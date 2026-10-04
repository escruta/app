export interface Session {
  sessionId: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  current: boolean;
}
