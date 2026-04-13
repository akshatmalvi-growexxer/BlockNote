const ACCESS_COOKIE = "bn_access";

function setAccessToken(token) {
  if (typeof document === "undefined") return;
  document.cookie = `${ACCESS_COOKIE}=${token}; Path=/; SameSite=Lax`;
}

function clearAccessToken() {
  if (typeof document === "undefined") return;
  document.cookie = `${ACCESS_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function getAccessTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const entry = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${ACCESS_COOKIE}=`));
  if (!entry) return null;
  return entry.split("=")[1] || null;
}

export { setAccessToken, clearAccessToken, getAccessTokenFromCookie };
