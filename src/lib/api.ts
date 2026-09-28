import { EncryptedPayload } from './crypto';
import { AdminMetrics, AdminUserAccount, AdminAuditLog } from '../types/khata';

const TOKEN_KEY = 'dk_session_token';

export function setAuthToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

// 1. Send Real-Time Gmail Verification Code (Zero Leaked OTP)
export async function sendGmailCodeApi(email: string): Promise<{
  success: boolean;
  message: string;
  email: string;
  expiresInSeconds: number;
}> {
  const res = await fetch('/api/auth/send-gmail-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gmail verification code bhejte samay samasya aayi.');
  }
  return res.json();
}

// Check Realtime In-App Delivery for local testing
export async function checkRealtimeDeliveryApi(email: string): Promise<{
  delivered: boolean;
  verificationCode?: string;
  notice?: string;
}> {
  try {
    const res = await fetch(`/api/auth/realtime-delivery-check?email=${encodeURIComponent(email)}`);
    if (!res.ok) return { delivered: false };
    return res.json();
  } catch {
    return { delivered: false };
  }
}

// 2. Verify Gmail Code
export async function verifyGmailCodeApi(params: {
  email: string;
  code: string;
  name?: string;
  businessName?: string;
  deviceName?: string;
  platform?: string;
}): Promise<{
  success: boolean;
  user: { id: string; email: string; name: string; businessName?: string; avatar?: string };
  deviceId: string;
  token: string;
}> {
  const res = await fetch('/api/auth/verify-gmail-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Verification asafal rahi. Kripya sahi code dalein.');
  }
  const data = await res.json();
  if (data.token) setAuthToken(data.token);
  return data;
}

// 3. One-Click Google Sign-In
export async function googleSignInApi(params: {
  credential?: string;
  email?: string;
  name?: string;
  avatar?: string;
  businessName?: string;
  deviceName?: string;
  platform?: string;
}): Promise<{
  success: boolean;
  user: { id: string; email: string; name: string; businessName?: string; avatar?: string };
  deviceId: string;
  token: string;
}> {
  const res = await fetch('/api/auth/google-signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Google Sign-In asafal raha.');
  }
  const data = await res.json();
  if (data.token) setAuthToken(data.token);
  return data;
}

// 4. Push Encrypted Vault (Protected with Bearer Token)
export async function pushEncryptedVaultApi(params: {
  email: string;
  deviceId: string;
  encryptedPayload: EncryptedPayload;
  approximateBytes: number;
  totalEntriesCount: number;
}): Promise<{ success: boolean; message: string; syncedAt: string }> {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/sync/push', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Sync fail ho gaya. Dobara try karein.');
  }
  return res.json();
}

// 5. Pull Encrypted Vault (Protected with Bearer Token)
export async function pullEncryptedVaultApi(email: string): Promise<{
  success: boolean;
  encryptedPayload: EncryptedPayload;
  syncedAt: string;
  deviceId: string;
}> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/sync/pull?email=${encodeURIComponent(email)}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Cloud backup prapt nahi ho paya.');
  }
  return res.json();
}

// 6. Device Management (Protected)
export async function fetchDevicesApi(email: string): Promise<any[]> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/devices?email=${encodeURIComponent(email)}`, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  return data.devices || [];
}

export async function revokeDeviceApi(email: string, deviceId: string): Promise<boolean> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/devices/${encodeURIComponent(deviceId)}?email=${encodeURIComponent(email)}`, {
    method: 'DELETE',
    headers,
  });
  return res.ok;
}

// Web Admin APIs
export async function adminLoginApi(email: string, password: string): Promise<{ success: boolean; token: string }> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Admin login failed.');
  }
  return res.json();
}

export async function fetchAdminMetricsApi(): Promise<AdminMetrics> {
  const res = await fetch('/api/admin/metrics');
  if (!res.ok) throw new Error('Failed to fetch admin metrics');
  return res.json();
}

export async function fetchAdminUsersApi(): Promise<AdminUserAccount[]> {
  const res = await fetch('/api/admin/users');
  if (!res.ok) throw new Error('Failed to fetch admin users');
  const data = await res.json();
  return data.users || [];
}

export async function fetchAdminAuditLogsApi(): Promise<AdminAuditLog[]> {
  const res = await fetch('/api/admin/audit-logs');
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  const data = await res.json();
  return data.logs || [];
}
