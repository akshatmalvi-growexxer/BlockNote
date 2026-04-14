function extractShareToken(req) {
  return (
    req.headers["x-share-token"] ||
    req.query?.shareToken ||
    req.query?.share_token ||
    req.body?.shareToken ||
    req.body?.share_token ||
    null
  );
}

function rejectShareTokenOnWrite(req, res, next) {
  const token = extractShareToken(req);
  if (token) {
    return res
      .status(403)
      .json({ message: "Share token cannot be used for write access." });
  }
  return next();
}

module.exports = { rejectShareTokenOnWrite };
