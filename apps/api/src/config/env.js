const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(__dirname, "../../../../.env"),
});

dotenv.config({
  path: path.resolve(__dirname, "../../../../.env.local"),
  override: true,
});

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4000),
  WEB_APP_URL: process.env.WEB_APP_URL || "http://localhost:3000",
  API_BASE_URL: process.env.API_BASE_URL || "http://localhost:4000",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "",
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || "15m",
  REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL || "7d",
};

module.exports = { env };
