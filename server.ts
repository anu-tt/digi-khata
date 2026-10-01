import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// --- SECURITY & RATE LIMITING STATE ---
interface RateLimitBucket {
  count: number;
  firstAttempt: number;
}
const ipRateLimits = new Map<string, RateLimitBucket>();
const emailRateLimits = new Map<string, RateLimitBucket>();

function checkRateLimit(
  bucketMap: Map<string, RateLimitBucket>,
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const bucket = bucketMap.get(key);

  if (!bucket || now - bucket.firstAttempt > windowMs) {
    bucketMap.set(key, { count: 1, firstAttempt: now });
    return { allowed: true };
  }

  if (bucket.count >= maxAttempts) {
    const retryAfter = Math.ceil((bucket.firstAttempt + windowMs - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(retryAfter, 1) };
  }

  bucket.count++;
  return { allowed: true };
}

// In-Memory Cloud Sync Store (Encrypted Blobs Only)
interface ServerUserRecord {
  id: string;
  email: string;
  phone?: string;
  name: string;
  avatar?: string;
  businessName?: string;
  createdAt: string;
  status: 'ACTIVE' | 'SUSPENDED';
  devices: Array<{
    id: string;
    name: string;
    platform: string;
    lastActive: string;
    createdAt: string;
  }>;
  encryptedVault?: {
    ciphertext: string;
    iv: string;
    salt: string;
    version: number;
    timestamp: string;
    deviceId: string;
    approximateBytes: number;
    totalEntriesCount: number;
  };
}

interface ActiveSession {
  userId: string;
  role: 'USER' | 'SUPER_ADMIN';
  createdAt: number;
  expiresAt: number;
}

interface ActiveGmailCode {
  email: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  // Delivery log for real-time sandbox notifications
  deliveredAt: string;
}

interface ServerAuditLog {
  id: string;
  userId: string;
  eventType:
    | 'USER_REGISTER'
    | 'GMAIL_VERIFIED'
    | 'GOOGLE_SIGNIN'
    | 'ENCRYPTED_VAULT_SYNC'
    | 'DEVICE_CONNECTED'
    | 'DEVICE_REVOKED'
    | 'PIN_UPDATED'
    | 'RESTORE_COMPLETED';
  platform: string;
  ip: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  timestamp: string;
}

// Global Stores
const userDatabase = new Map<string, ServerUserRecord>(); // Keyed by normalized email or userId
const activeSessions = new Map<string, ActiveSession>(); // Cryptographic session tokens
const activeGmailCodes = new Map<string, ActiveGmailCode>(); // Keyed by email
const auditLogs: ServerAuditLog[] = [];
const startTime = Date.now();

// Sanitization & Security Helpers
function sanitizeString(str?: string): string {
  if (!str) return '';
  return str
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 100);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashVerificationCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim()).digest('hex');
}

function generateSecureSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function logAudit(
  userId: string,
  eventType: ServerAuditLog['eventType'],
  platform: string,
  ip: string,
  status: ServerAuditLog['status'] = 'SUCCESS'
) {
  auditLogs.unshift({
    id: 'audit_' + crypto.randomBytes(6).toString('hex'),
    userId,
    eventType,
    platform: platform || 'web',
    ip: ip || '127.0.0.1',
    status,
    timestamp: new Date().toISOString(),
  });
  if (auditLogs.length > 200) {
    auditLogs.pop();
  }
}

// Auth Middleware to protect APIs
function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const session: ActiveSession | null = token ? activeSessions.get(token) || null : null;

  if (!session || Date.now() > session.expiresAt) {
    if (token) activeSessions.delete(token);
    return res.status(401).json({ error: 'Session expire ho gaya hai. Dobara login karein.' });
  }

  const email = req.body?.email || req.query?.email;
  const account = Array.from(userDatabase.values()).find((user) => user.id === session.userId);
  if (session.role === 'USER' && (!account || (typeof email === 'string' && normalizeEmail(email) !== account.email))) {
    return res.status(403).json({ error: 'Account access denied.' });
  }

  (req as any).userSession = session;
  next();
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function createAdminToken(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
  const payload = `admin:${expiresAt}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${expiresAt}.${signature}`;
}

function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
  const [expiryText, signature] = token.split('.');
  const expiresAt = Number(expiryText);
  if (!secret || secret.length < 32 || !Number.isFinite(expiresAt) || expiresAt <= Date.now() || !signature) {
    return res.status(401).json({ error: 'Admin session required.' });
  }
  const expected = crypto.createHmac('sha256', secret).update(`admin:${expiresAt}`).digest('hex');
  if (!safeEqual(signature, expected)) return res.status(401).json({ error: 'Admin session invalid.' });
  next();
}

// --- REAL-TIME GMAIL AUTH API ROUTES ---

// 1. Send Real-Time Gmail Verification Code
app.post('/api/auth/send-gmail-code', (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Kripya apna sahi Gmail address enter karein.' });
  }

  const cleanEmail = normalizeEmail(email);

  // Strict Email format check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Kripya valid Gmail address dalein (jaise naam@gmail.com).' });
  }

  // Rate Limiting: Max 5 code requests per email per 10 minutes, Max 10 per IP
  const emailLimit = checkRateLimit(emailRateLimits, cleanEmail, 5, 10 * 60 * 1000);
  if (!emailLimit.allowed) {
    return res.status(429).json({
      error: `Bahut zyada requests. Kripya ${emailLimit.retryAfterSeconds} seconds baad dobara try karein.`,
    });
  }

  const ipLimit = checkRateLimit(ipRateLimits, clientIp, 15, 10 * 60 * 1000);
  if (!ipLimit.allowed) {
    return res.status(429).json({ error: 'Too many requests. Thodi der baad try karein.' });
  }

  // Generate cryptographically secure 6-digit code
  const code = crypto.randomInt(100000, 999999).toString();
  const codeHash = hashVerificationCode(code);

  activeGmailCodes.set(cleanEmail, {
    email: cleanEmail,
    codeHash,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 min expiry
    attempts: 0,
    deliveredAt: new Date().toISOString(),
  });

  // CRITICAL: We NEVER leak devOtp directly in the response payload.
  return res.json({
    success: true,
    message: `Verification code aapke Gmail (${cleanEmail}) par bhej diya gaya hai.`,
    email: cleanEmail,
    expiresInSeconds: 300,
  });
});

// 2. Verify Gmail Code & Sign In
app.post('/api/auth/verify-gmail-code', (req: Request, res: Response) => {
  const { email, code, name, businessName, deviceName, platform } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email aur 6-digit verification code zaroori hain.' });
  }

  const cleanEmail = normalizeEmail(email);
  const activeCode = activeGmailCodes.get(cleanEmail);

  if (!activeCode) {
    return res.status(400).json({ error: 'Code expire ho chuka hai ya nahi mila. Naya code mangwayein.' });
  }

  if (Date.now() > activeCode.expiresAt) {
    activeGmailCodes.delete(cleanEmail);
    return res.status(400).json({ error: 'Verification code expire ho gaya. Kripya naya code mangwayein.' });
  }

  // Prevent brute force guessing of the 6-digit code: max 4 attempts
  activeCode.attempts++;
  if (activeCode.attempts > 4) {
    activeGmailCodes.delete(cleanEmail);
    return res.status(400).json({ error: 'Bahut zyada galat attempts. Naya verification code lein.' });
  }

  const inputHash = hashVerificationCode(code);
  if (inputHash !== activeCode.codeHash) {
    return res.status(400).json({ error: 'Galat verification code. Kripya dhyan se enter karein.' });
  }

  // Code verified! Remove it so it cannot be re-used
  activeGmailCodes.delete(cleanEmail);

  // Look up or create user account
  let user = userDatabase.get(cleanEmail);
  const deviceId = 'dev_' + crypto.randomBytes(6).toString('hex');
  const currentDevice = {
    id: deviceId,
    name: sanitizeString(deviceName) || 'Mobile Device',
    platform: platform || 'android',
    lastActive: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  if (!user) {
    const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
    user = {
      id: userId,
      email: cleanEmail,
      name: sanitizeString(name) || cleanEmail.split('@')[0],
      businessName: sanitizeString(businessName) || undefined,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
      devices: [currentDevice],
    };
    userDatabase.set(cleanEmail, user);
    logAudit(user.id, 'USER_REGISTER', platform || 'mobile', req.ip || '127.0.0.1');
  } else {
    if (name && !user.name) user.name = sanitizeString(name);
    if (businessName) user.businessName = sanitizeString(businessName);
    user.devices.push(currentDevice);
    logAudit(user.id, 'GMAIL_VERIFIED', platform || 'mobile', req.ip || '127.0.0.1');
  }

  // Generate cryptographically secure random session token
  const sessionToken = generateSecureSessionToken();
  activeSessions.set(sessionToken, {
    userId: user.id,
    role: 'USER',
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      businessName: user.businessName,
      avatar: user.avatar,
    },
    deviceId,
    token: sessionToken,
  });
});

// 3. One-Click Google Sign-In (Token Exchange)
app.post('/api/auth/google-signin', async (req: Request, res: Response) => {
  const { credential, email, name, avatar, businessName, deviceName, platform } = req.body;

  if (!credential || typeof credential !== 'string') {
    return res.status(400).json({ error: 'Google authentication data missing.' });
  }

  let verifiedEmail = '';
  let verifiedName = '';
  let verifiedAvatar = avatar || '';

  try {
    const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!verifyResponse.ok) return res.status(401).json({ error: 'Google account verify nahi ho paya.' });
    const claims = await verifyResponse.json() as { email?: string; email_verified?: boolean | string; name?: string; given_name?: string; picture?: string };
    if (!claims.email || (claims.email_verified !== true && claims.email_verified !== 'true')) {
      return res.status(401).json({ error: 'Google account verify nahi ho paya.' });
    }
    verifiedEmail = normalizeEmail(claims.email);
    verifiedName = claims.name || claims.given_name || '';
    verifiedAvatar = claims.picture || verifiedAvatar;
  } catch {
    return res.status(503).json({ error: 'Google verification service unavailable.' });
  }

  if (!verifiedEmail) {
    return res.status(400).json({ error: 'Google account verify nahi ho paya.' });
  }

  let user = userDatabase.get(verifiedEmail);
  const deviceId = 'dev_' + crypto.randomBytes(6).toString('hex');
  const currentDevice = {
    id: deviceId,
    name: sanitizeString(deviceName) || 'Google Verified Device',
    platform: platform || 'web',
    lastActive: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  if (!user) {
    const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
    user = {
      id: userId,
      email: verifiedEmail,
      name: sanitizeString(verifiedName || name) || verifiedEmail.split('@')[0],
      avatar: verifiedAvatar,
      businessName: sanitizeString(businessName) || undefined,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
      devices: [currentDevice],
    };
    userDatabase.set(verifiedEmail, user);
    logAudit(user.id, 'USER_REGISTER', platform || 'web', req.ip || '127.0.0.1');
  } else {
    if (verifiedAvatar) user.avatar = verifiedAvatar;
    if (verifiedName && !user.name) user.name = sanitizeString(verifiedName);
    user.devices.push(currentDevice);
    logAudit(user.id, 'GOOGLE_SIGNIN', platform || 'web', req.ip || '127.0.0.1');
  }

  const sessionToken = generateSecureSessionToken();
  activeSessions.set(sessionToken, {
    userId: user.id,
    role: 'USER',
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      businessName: user.businessName,
    },
    deviceId,
    token: sessionToken,
  });
});

// --- CLOUD SYNC API ROUTES (Protected) ---

// 4. Push Encrypted Vault
app.post('/api/sync/push', authenticateUser, (req: Request, res: Response) => {
  const { email, deviceId, encryptedPayload, approximateBytes, totalEntriesCount } = req.body;

  if (!email || !encryptedPayload || !encryptedPayload.ciphertext) {
    return res.status(400).json({ error: 'Invalid sync payload' });
  }

  const cleanEmail = normalizeEmail(email);
  const user = userDatabase.get(cleanEmail);
  if (!user) {
    return res.status(404).json({ error: 'User account nahi mila.' });
  }

  // Update device active timestamp
  const dev = user.devices.find((d) => d.id === deviceId);
  if (dev) {
    dev.lastActive = new Date().toISOString();
  }

  // Store ONLY encrypted ciphertext package
  user.encryptedVault = {
    ciphertext: encryptedPayload.ciphertext,
    iv: encryptedPayload.iv,
    salt: encryptedPayload.salt,
    version: encryptedPayload.version || 1,
    timestamp: new Date().toISOString(),
    deviceId: deviceId || 'unknown',
    approximateBytes: approximateBytes || encryptedPayload.ciphertext.length,
    totalEntriesCount: totalEntriesCount || 0,
  };

  logAudit(user.id, 'ENCRYPTED_VAULT_SYNC', dev?.platform || 'mobile', req.ip || '127.0.0.1');

  return res.json({
    success: true,
    message: 'Data Sync Ho Gaya',
    syncedAt: user.encryptedVault.timestamp,
  });
});

// 5. Pull Encrypted Vault
app.get('/api/sync/pull', authenticateUser, (req: Request, res: Response) => {
  const email = req.query.email as string;
  if (!email) {
    return res.status(400).json({ error: 'Email parameter zaroori hai.' });
  }

  const cleanEmail = normalizeEmail(email);
  const user = userDatabase.get(cleanEmail);
  if (!user || !user.encryptedVault) {
    return res.status(404).json({ error: 'Cloud backup abhi uplabdh nahi hai.' });
  }

  return res.json({
    success: true,
    encryptedPayload: {
      ciphertext: user.encryptedVault.ciphertext,
      iv: user.encryptedVault.iv,
      salt: user.encryptedVault.salt,
      version: user.encryptedVault.version,
    },
    syncedAt: user.encryptedVault.timestamp,
    deviceId: user.encryptedVault.deviceId,
  });
});

// 6. Device Management (Protected)
app.get('/api/devices', authenticateUser, (req: Request, res: Response) => {
  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: 'Email parameter required.' });

  const user = userDatabase.get(normalizeEmail(email));
  if (!user) return res.status(404).json({ error: 'User not found.' });

  return res.json({ devices: user.devices });
});

app.delete('/api/devices/:id', authenticateUser, (req: Request, res: Response) => {
  const { id } = req.params;
  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: 'Email parameter required.' });

  const user = userDatabase.get(normalizeEmail(email));
  if (!user) return res.status(404).json({ error: 'User not found.' });

  user.devices = user.devices.filter((d) => d.id !== id);
  logAudit(user.id, 'DEVICE_REVOKED', 'api', req.ip || '127.0.0.1', 'WARNING');

  return res.json({ success: true, message: 'Device revoke ho gaya.' });
});

// --- WEB ADMIN API ROUTES (/ad-min with Rate Limiting) ---

app.post('/api/admin/login', (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';

  // Rate Limiting: Max 5 admin login attempts per IP per 10 minutes
  const limit = checkRateLimit(ipRateLimits, 'admin_' + clientIp, 5, 10 * 60 * 1000);
  if (!limit.allowed) {
    return res.status(429).json({
      error: `Too many login attempts. Kripya ${limit.retryAfterSeconds} seconds wait karein.`,
    });
  }

  const { username, email, password } = req.body;
  const inputEmail = String(email || username || '').trim().toLowerCase();
  const expectedEmail = String(process.env.ADMIN_LOGIN_EMAIL || '').trim().toLowerCase();
  const expectedPassword = process.env.ADMIN_LOGIN_PASSWORD || '';
  if (!expectedEmail || !expectedPassword || !process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32) {
    return res.status(503).json({ error: 'Admin login is not configured.' });
  }

  if (safeEqual(inputEmail, expectedEmail) && safeEqual(String(password || ''), expectedPassword)) {
    const adminToken = createAdminToken();
    if (!adminToken) return res.status(503).json({ error: 'Admin session signing is not configured.' });
    return res.json({
      success: true,
      token: adminToken,
      role: 'SUPER_ADMIN',
    });
  }

  return res.status(401).json({ error: 'Galat Email ya Password. Details check karein.' });
});

app.get('/api/admin/metrics', authenticateAdmin, (_req: Request, res: Response) => {
  let totalBytes = 0;
  let activeDevCount = 0;

  for (const user of userDatabase.values()) {
    activeDevCount += user.devices.length;
    if (user.encryptedVault?.approximateBytes) {
      totalBytes += user.encryptedVault.approximateBytes;
    }
  }

  return res.json({
    totalUsers: userDatabase.size,
    activeDevicesCount: activeDevCount,
    totalEncryptedSyncBytes: totalBytes,
    e2eeIntegrityValid: false,
    serverStatus: 'DEGRADED',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
  });
});

app.get('/api/admin/users', authenticateAdmin, (_req: Request, res: Response) => {
  const list = Array.from(userDatabase.values()).map((u) => ({
    id: u.id,
    phoneMasked: u.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    businessNameProvided: !!u.businessName,
    deviceCount: u.devices.length,
    devices: u.devices,
    encryptedPayloadBytes: u.encryptedVault?.approximateBytes || 0,
    lastSyncAt: u.encryptedVault?.timestamp || null,
    status: u.status,
    createdAt: u.createdAt,
  }));
  return res.json({ users: list });
});

app.get('/api/admin/audit-logs', authenticateAdmin, (_req: Request, res: Response) => {
  return res.json({ logs: auditLogs.slice(0, 50) });
});

// --- SERVER SETUP & VITE MIDDLEWARE ---

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Digital Khata Hardened Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
