import { startAuthentication, startRegistration } from '@simplewebauthn/browser';

type Profile = { firstName: string; lastName: string; email: string; username: string; password: string; birthday?: string; gender?: string; unlockMethod?: string; pattern?: string };
function apiOrigin() {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return `${location.protocol}//${location.hostname}:4100`;
  const host = location.host.replace(/^\d+-/, '4100-');
  return `${location.protocol}//${host}`;
}
async function request(path: string, body: unknown) {
  const res = await fetch(`${apiOrigin()}${path}`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.error || 'Authentication request failed');
  return data;
}
async function registerPasskey(profile: Profile) {
  const begin = await request('/api/auth/passkey/register/options', profile);
  const response = await startRegistration({ optionsJSON: begin.options });
  return request('/api/auth/passkey/register/finish', { userId: begin.userId, response, password: profile.password, birthday: profile.birthday, gender: profile.gender });
}
async function registerPassword(profile: Profile) {
  return request('/api/auth/register/password', profile);
}
async function loginPasskey(email: string) {
  const begin = await request('/api/auth/passkey/login/options', { email });
  const response = await startAuthentication({ optionsJSON: begin.options });
  return request('/api/auth/passkey/login/finish', { requestId: begin.requestId, response });
}
async function loginPassword(email: string, password: string) {
  return request('/api/auth/password/login', { email, password });
}
(window as any).QulifeAuth = { registerPasskey, registerPassword, loginPasskey, loginPassword, apiOrigin };
