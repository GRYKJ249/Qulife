import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import { chmod, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
type RegistrationResponseJSON = any;
type AuthenticationResponseJSON = any;

type StoredCredential = {
  id: string;
  publicKey: string;
  counter: number;
  transports?: string[];
};
type StoredUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  passwordHash: string;
  birthday?: string;
  gender?: string;
  credentials: StoredCredential[];
  patternHash?: string;
  createdAt: string;
};
type Store = { users: StoredUser[] };

type PendingRegistration = {
  userId: string;
  challenge: string;
  createdAt: number;
  profile: Omit<StoredUser, 'passwordHash' | 'credentials' | 'createdAt'>;
};
type PendingAuthentication = { challenge: string; userId?: string; createdAt: number };

const app = express();
const port = Number(process.env.AUTH_PORT || 4100);
const publicOrigin = process.env.PUBLIC_ORIGIN || `http://localhost:3000`;
const rpID = process.env.RP_ID || new URL(publicOrigin).hostname;
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const dataDir = resolve(process.env.DATA_DIR || resolve(projectDir, '..', '.qulife-auth-data'));
const dataFile = resolve(dataDir, 'users.json');
const legacyDataFile = resolve(projectDir, 'server/data/users.json');
const pendingRegistrations = new Map<string, PendingRegistration>();
const pendingAuthentications = new Map<string, PendingAuthentication>();
const sessions = new Map<string, string>();
const aiRateLimits = new Map<string, { startedAt: number; count: number }>();

let store: Store = { users: [] };
async function loadStore() {
  await mkdir(dataDir, { recursive: true, mode: 0o700 });
  await chmod(dataDir, 0o700);
  if (!existsSync(dataFile) && existsSync(legacyDataFile)) {
    try {
      store = JSON.parse(await readFile(legacyDataFile, 'utf8'));
      await saveStore();
      await unlink(legacyDataFile);
    } catch { store = { users: [] }; }
  } else if (existsSync(dataFile)) {
    try { store = JSON.parse(await readFile(dataFile, 'utf8')); } catch { store = { users: [] }; }
  }
  if (!existsSync(dataFile)) await saveStore();
}
async function saveStore() {
  const tempFile = `${dataFile}.${process.pid}.tmp`;
  await writeFile(tempFile, JSON.stringify(store, null, 2), { mode: 0o600 });
  await chmod(tempFile, 0o600);
  await rename(tempFile, dataFile);
}
function clean(v: unknown, max = 120) { return String(v ?? '').trim().slice(0, max); }
function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function checkPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}
function session(res: express.Response, userId: string) {
  const token = crypto.randomBytes(32).toString('base64url');
  sessions.set(token, userId);
  const secure = publicOrigin.startsWith('https://');
  res.cookie('qulife_session', token, { httpOnly: true, sameSite: secure ? 'none' : 'lax', secure, maxAge: 1000 * 60 * 60 * 24 * 30, path: '/' });
}
function publicUser(u: StoredUser) { return { id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, username: u.username, hasPasskey: u.credentials.length > 0, hasPattern: Boolean(u.patternHash) }; }
function fail(res: express.Response, status: number, message: string) { return res.status(status).json({ ok: false, error: message }); }
function purgePending() {
  const cutoff = Date.now() - 5 * 60_000;
  for (const [key, value] of pendingRegistrations) if (value.createdAt < cutoff) pendingRegistrations.delete(key);
  for (const [key, value] of pendingAuthentications) if (value.createdAt < cutoff) pendingAuthentications.delete(key);
}

app.use(express.json({ limit: '256kb' }));
app.use(cors({ origin: publicOrigin, credentials: true }));
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'qulife-auth', webauthn: true, rpID }));
app.post('/api/ai/chat', async (req, res) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const rate = aiRateLimits.get(ip);
  if (!rate || now - rate.startedAt > 60_000) aiRateLimits.set(ip, { startedAt: now, count: 1 });
  else if (rate.count >= 20) return fail(res, 429, 'طلبات كثيرة خلال وقت قصير. انتظر قليلًا ثم حاول مجددًا.');
  else rate.count += 1;

  const key = process.env.OPENAI_API_KEY;
  const base = (process.env.OPENAI_API_BASE || 'https://api.openai.com/v1').replace(/\/+$/, '');
  if (!key) return fail(res, 503, 'خدمة الذكاء الاصطناعي غير مهيأة على الخادم.');
  const incoming = req.body?.messages;
  if (!Array.isArray(incoming) || incoming.length < 1 || incoming.length > 24) return fail(res, 400, 'الرسائل غير صالحة.');
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  let total = 0;
  for (const item of incoming) {
    if (!item || !['user', 'assistant'].includes(item.role) || typeof item.content !== 'string') return fail(res, 400, 'الرسائل غير صالحة.');
    const content = item.content.trim(); total += content.length;
    if (!content || content.length > 6000 || total > 18000) return fail(res, 400, 'الرسائل أطول من المسموح.');
    messages.push({ role: item.role, content });
  }
  if (messages[messages.length - 1].role !== 'user') return fail(res, 400, 'أرسل رسالة أولًا.');
  try {
    const upstream = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.QULIFE_AI_MODEL || 'gpt-5-mini',
        messages: [{ role: 'system', content: 'أنت Qulife AI، مساعد عربي ودود وعملي. أجب بلغة المستخدم، واستخدم العربية بوضوح عندما يكتب بالعربية. قدّم إجابات مفيدة ومباشرة، واسأل للتوضيح عند الحاجة. لا تدّعِ أنك نفذت إجراءات في العالم الحقيقي، ولا تخترع معلومات غير مؤكدة. حافظ على سياق المحادثة.' }, ...messages],
        reasoning_effort: 'low',
        max_completion_tokens: 1600,
      }),
      signal: AbortSignal.timeout(60_000),
    });
    const result: any = await upstream.json().catch(() => ({}));
    if (!upstream.ok) { console.error('AI provider returned HTTP', upstream.status); return fail(res, 502, 'تعذّر على المساعد إنشاء رد الآن. حاول مرة أخرى.'); }
    const content = result?.choices?.[0]?.message?.content;
    const reply = typeof content === 'string' ? content : Array.isArray(content) ? content.filter((part: any) => part?.type === 'text').map((part: any) => part.text).join('') : '';
    if (!reply.trim()) return fail(res, 502, 'وصل رد فارغ من المساعد. أعد المحاولة.');
    return res.json({ ok: true, reply: reply.trim() });
  } catch (error) {
    console.error('AI request failed:', error instanceof Error ? error.name : 'Error');
    return fail(res, 502, 'تعذّر الاتصال بالمساعد. تحقق من الاتصال ثم أعد المحاولة.');
  }
});

app.post('/api/auth/passkey/register/options', async (req, res) => {
  purgePending();
  const firstName = clean(req.body.firstName, 30), lastName = clean(req.body.lastName, 30);
  const email = clean(req.body.email, 120).toLowerCase(), username = clean(req.body.username, 20).toLowerCase();
  const password = String(req.body.password || '');
  if (!firstName || !lastName || !email || !username || password.length < 8) return fail(res, 400, 'Incomplete registration data');
  if (store.users.some(u => u.email === email || u.username === username)) return fail(res, 409, 'Email or username already exists');
  const userId = crypto.randomBytes(24).toString('base64url');
  const options = await generateRegistrationOptions({
    rpName: 'Qulife', rpID, userID: new TextEncoder().encode(userId), userName: email, userDisplayName: `${firstName} ${lastName}`,
    attestationType: 'none',
    excludeCredentials: [],
    authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'preferred', userVerification: 'required' },
  });
  pendingRegistrations.set(userId, { userId, challenge: options.challenge, createdAt: Date.now(), profile: { id: userId, firstName, lastName, email, username } });
  res.json({ ok: true, userId, options });
});

app.post('/api/auth/passkey/register/finish', async (req, res) => {
  purgePending();
  const { userId, response, password, birthday, gender } = req.body as { userId?: string; response?: RegistrationResponseJSON; password?: string; birthday?: string; gender?: string };
  if (!userId || !response || !password) return fail(res, 400, 'Missing passkey registration data');
  const pending = pendingRegistrations.get(userId);
  if (!pending) return fail(res, 400, 'Registration challenge expired');
  try {
    const verification = await verifyRegistrationResponse({ response, expectedChallenge: pending.challenge, expectedOrigin: publicOrigin, expectedRPID: rpID, requireUserVerification: true });
    if (!verification.verified || !verification.registrationInfo) return fail(res, 400, 'Passkey verification failed');
    const info = verification.registrationInfo;
    const user: StoredUser = {
      ...pending.profile, birthday: clean(birthday, 20), gender: clean(gender, 40), passwordHash: hashPassword(password), credentials: [{ id: info.credential.id, publicKey: Buffer.from(info.credential.publicKey).toString('base64url'), counter: info.credential.counter, transports: info.credential.transports }], createdAt: new Date().toISOString(),
    };
    store.users.push(user); await saveStore(); pendingRegistrations.delete(userId); session(res, user.id);
    res.json({ ok: true, user: publicUser(user), verified: true });
  } catch (error) { console.error('WebAuthn registration failed', error); return fail(res, 400, 'The device could not be verified'); }
});

app.post('/api/auth/register/password', async (req, res) => {
  const { firstName, lastName, email, username, password, birthday, gender, unlockMethod, pattern } = req.body;
  const normalizedEmail = clean(email, 120).toLowerCase(), normalizedUsername = clean(username, 20).toLowerCase();
  const selectedMethod = unlockMethod === 'pattern' ? 'pattern' : 'password';
  const patternValue = String(pattern || '');
  const validPattern = /^[0-8]{4,9}$/.test(patternValue) && new Set(patternValue).size === patternValue.length;
  if (!firstName || !lastName || !normalizedEmail || !normalizedUsername || String(password || '').length < 8 || (selectedMethod === 'pattern' && !validPattern)) return fail(res, 400, 'Incomplete or invalid registration data');
  if (store.users.some(u => u.email === normalizedEmail || u.username === normalizedUsername)) return fail(res, 409, 'Email or username already exists');
  const user: StoredUser = { id: crypto.randomBytes(24).toString('base64url'), firstName: clean(firstName, 30), lastName: clean(lastName, 30), email: normalizedEmail, username: normalizedUsername, passwordHash: hashPassword(String(password)), patternHash: selectedMethod === 'pattern' ? hashPassword(patternValue) : undefined, birthday: clean(birthday, 20), gender: clean(gender, 40), credentials: [], createdAt: new Date().toISOString() };
  store.users.push(user); await saveStore(); session(res, user.id); res.json({ ok: true, user: publicUser(user), verified: true });
});

app.post('/api/auth/passkey/login/options', async (req, res) => {
  purgePending();
  const email = clean(req.body.email, 120).toLowerCase();
  const user = store.users.find(u => u.email === email);
  if (!user || !user.credentials.length) return fail(res, 404, 'No passkey is registered for this account');
  const options = await generateAuthenticationOptions({ rpID, userVerification: 'required', allowCredentials: user.credentials.map(c => ({ id: c.id, transports: c.transports as any })) });
  const requestId = crypto.randomBytes(16).toString('base64url'); pendingAuthentications.set(requestId, { challenge: options.challenge, userId: user.id, createdAt: Date.now() });
  res.json({ ok: true, requestId, options });
});

app.post('/api/auth/passkey/login/finish', async (req, res) => {
  const { requestId, response } = req.body as { requestId?: string; response?: AuthenticationResponseJSON };
  const pending = requestId ? pendingAuthentications.get(requestId) : undefined;
  if (!pending?.userId || !response) return fail(res, 400, 'Authentication challenge expired');
  const user = store.users.find(u => u.id === pending.userId); if (!user) return fail(res, 404, 'Account not found');
  const credential = user.credentials.find(c => c.id === response.id); if (!credential) return fail(res, 400, 'Unknown passkey');
  try {
    const verification = await verifyAuthenticationResponse({ response, expectedChallenge: pending.challenge, expectedOrigin: publicOrigin, expectedRPID: rpID, credential: { id: credential.id, publicKey: Buffer.from(credential.publicKey, 'base64url'), counter: credential.counter, transports: credential.transports as any }, requireUserVerification: true });
    if (!verification.verified) return fail(res, 401, 'Passkey verification failed');
    credential.counter = verification.authenticationInfo.newCounter; await saveStore(); pendingAuthentications.delete(requestId!); session(res, user.id); res.json({ ok: true, user: publicUser(user), verified: true });
  } catch { return fail(res, 401, 'The device could not be verified'); }
});

app.post('/api/auth/password/login', async (req, res) => {
  const email = clean(req.body.email, 120).toLowerCase(), password = String(req.body.password || '');
  const user = store.users.find(u => u.email === email);
  if (!user || !checkPassword(password, user.passwordHash)) return fail(res, 401, 'Invalid email or password');
  session(res, user.id); res.json({ ok: true, user: publicUser(user), verified: true });
});

await loadStore();
app.listen(port, '0.0.0.0', () => console.log(`Qulife auth server listening on 0.0.0.0:${port} (rpID=${rpID}, origin=${publicOrigin})`));
