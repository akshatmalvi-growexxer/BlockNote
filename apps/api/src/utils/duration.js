const durationRegex = /^(\d+)(ms|s|m|h|d)?$/;

function parseDurationToMs(value, fallbackMs) {
  if (value == null) {
    return fallbackMs;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const match = String(value).trim().match(durationRegex);
  if (!match) {
    return fallbackMs;
  }

  const amount = Number(match[1]);
  const unit = match[2] || "ms";

  switch (unit) {
    case "ms":
      return amount;
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60 * 1000;
    case "h":
      return amount * 60 * 60 * 1000;
    case "d":
      return amount * 24 * 60 * 60 * 1000;
    default:
      return fallbackMs;
  }
}

module.exports = { parseDurationToMs };
