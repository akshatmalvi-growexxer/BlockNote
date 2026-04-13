const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { parseDurationToMs } = require("./duration");
const { env } = require("../config/env");

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.ACCESS_TOKEN_TTL,
    },
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getRefreshTokenExpiry() {
  const ttlMs = parseDurationToMs(env.REFRESH_TOKEN_TTL, 7 * 24 * 60 * 60 * 1000);
  return new Date(Date.now() + ttlMs);
}

function getRefreshTokenMaxAgeMs() {
  return parseDurationToMs(env.REFRESH_TOKEN_TTL, 7 * 24 * 60 * 60 * 1000);
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
  getRefreshTokenMaxAgeMs,
};
