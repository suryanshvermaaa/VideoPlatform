import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { signAccessToken, signRefreshToken, sha256, verifyRefreshToken } from '../lib/jwt.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/errors.js';

export async function registerWithEmailPassword(email: string, password: string, name?: string) {
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw new HttpError(409, 'Email already in use');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name?.trim() ? name.trim() : undefined,
      passwordHash,
      role: 'USER'
    }
  });

  const tokenId = cryptoRandomId();
  const refreshToken = signRefreshToken({ sub: user.id, tokenId });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000)
    }
  });

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      planStatus: user.planStatus,
      planActiveUntil: user.planActiveUntil
    },
    accessToken,
    refreshToken
  };
}

export async function loginWithEmailPassword(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new HttpError(401, 'Invalid credentials');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'Invalid credentials');

  const tokenId = cryptoRandomId();
  const refreshToken = signRefreshToken({ sub: user.id, tokenId });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000)
    }
  });

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      planStatus: user.planStatus,
      planActiveUntil: user.planActiveUntil
    },
    accessToken,
    refreshToken
  };
}

export async function rotateRefreshToken(currentRefreshToken: string) {
  const payload = verifyRefreshToken(currentRefreshToken);

  const currentHash = sha256(currentRefreshToken);
  const record = await prisma.refreshToken.findFirst({
    where: {
      userId: payload.sub,
      tokenHash: currentHash,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: { user: true }
  });

  if (!record) throw new HttpError(401, 'Invalid refresh token');

  // Revoke old token (rotation)
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });

  const newTokenId = cryptoRandomId();
  const newRefreshToken = signRefreshToken({ sub: record.userId, tokenId: newTokenId });

  await prisma.refreshToken.create({
    data: {
      userId: record.userId,
      tokenHash: sha256(newRefreshToken),
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000)
    }
  });

  const accessToken = signAccessToken({ sub: record.userId, role: record.user.role });

  return {
    user: {
      id: record.user.id,
      email: record.user.email,
      name: record.user.name,
      role: record.user.role,
      planStatus: record.user.planStatus,
      planActiveUntil: record.user.planActiveUntil
    },
    accessToken,
    refreshToken: newRefreshToken
  };
}

export async function revokeRefreshToken(refreshToken: string) {
  const tokenHash = sha256(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

function cryptoRandomId() {
  // Avoid adding another dependency; random CUID isn't required here.
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}
