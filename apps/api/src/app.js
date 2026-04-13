const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { env } = require("./config/env");

const app = express();

app.use(
  cors({
    origin: env.WEB_APP_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "blocknote-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "BlockNote API setup is ready.",
    docs: {
      health: "/health",
    },
  });
});

module.exports = { app };
