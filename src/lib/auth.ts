// Authentication & session management (JWT via jose, bcryptjs hashing)
import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

const SESSION_COOKIE = 'sals_session'
const SESSION_DAYS = 7

export type Role = 'CUSTOMER' | 'MANAGER' | 'OWNER'

export interface SessionPayload {
  userId: string
  email: string
  name: string
  role: Role
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || 'sals-dev-secret-change-me-in-production-0123456789'
  return new TextEncoder().encode(secret)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey())

  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: '/',
  })
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const store = await cookies()
    const token = store.get(SESSION_COOKIE)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, secretKey())
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as Role,
    }
  } catch {
    return null
  }
}

/** Verify the session against the live DB (catches suspended/removed accounts). */
export async function getLiveSession(): Promise<SessionPayload | null> {
  const session = await getSession()
  if (!session) return null
  const user = await db.user.findUnique({ where: { id: session.userId } })
  if (!user || user.status !== 'ACTIVE') return null
  return { ...session, role: user.role as Role }
}

export async function requireRole(roles: Role[]): Promise<SessionPayload | null> {
  const session = await getLiveSession()
  if (!session || !roles.includes(session.role)) return null
  return session
}

export const OWNER_EMAIL = process.env.OWNER_EMAIL || 'emmanuelfabom121@gmail.com'
