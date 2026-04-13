const express = require("express");

const { prisma } = require("../db/prisma");
const {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
  getRefreshTokenMaxAgeMs,
} = require("../utils/security");
const { env } = require("../config/env");

const router = express.Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*\d).{8,}$/;

function isValidEmail(email) {
  return emailRegex.test(email);
}

function isValidPassword(password) {
  return passwordRegex.test(password);
}

function setRefreshCookie(res, token) {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: getRefreshTokenMaxAgeMs(),
    path: "/",
  });
}

function clearRefreshCookie(res) {
  res.clearCookie("refresh_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
  });
}

router.post("/register", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Email format is invalid." });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({
      message: "Password must be at least 8 characters and include a number.",
    });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ message: "Email is already registered." });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
    },
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  setRefreshCookie(res, refreshToken);

  return res.status(201).json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
    },
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  setRefreshCookie(res, refreshToken);

  return res.status(200).json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
    },
  });
});

router.post("/refresh", async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) {
    return res.status(401).json({ message: "Refresh token missing." });
  }

  const tokenHash = hashRefreshToken(token);
  const existingToken = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: true,
    },
  });

  if (!existingToken) {
    clearRefreshCookie(res);
    return res.status(401).json({ message: "Refresh token is invalid." });
  }

  await prisma.refreshToken.update({
    where: { id: existingToken.id },
    data: { revokedAt: new Date() },
  });

  const newRefreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: existingToken.userId,
      tokenHash: hashRefreshToken(newRefreshToken),
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  const accessToken = generateAccessToken(existingToken.user);
  setRefreshCookie(res, newRefreshToken);

  return res.status(200).json({
    accessToken,
    user: {
      id: existingToken.user.id,
      email: existingToken.user.email,
    },
  });
});

router.post("/logout", async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (token) {
    await prisma.refreshToken.updateMany({
      where: {
        tokenHash: hashRefreshToken(token),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  clearRefreshCookie(res);
  return res.status(200).json({ message: "Logged out." });
});

module.exports = { authRouter: router };
