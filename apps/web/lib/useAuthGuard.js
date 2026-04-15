"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "./api";
import {
  clearAccessToken,
  getAccessTokenFromCookie,
  setAccessToken,
} from "./auth";

/**
 * Decode the payload of a JWT without verifying the signature.
 * This is safe for extracting display info (email) on the client side.
 */
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Extract user info ({ id, email }) from a JWT access token.
 * Falls back to null if the token cannot be parsed.
 */
function getUserFromToken(token) {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return {
    id: payload.sub || null,
    email: payload.email || null,
  };
}

function useAuthGuard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function ensureSession() {
      const currentToken = getAccessTokenFromCookie();

      // Always try to refresh — even if we have a token, refreshing
      // gives us a new access token and confirms the session is valid.
      try {
        const data = await apiRequest("/auth/refresh", {
          method: "POST",
        });
        setAccessToken(data.accessToken);
        if (!cancelled) {
          setUser(data.user);
        }
      } catch (error) {
        if (!currentToken) {
          // No access token and refresh failed — redirect to login
          clearAccessToken();
          if (!cancelled) {
            router.push("/login");
          }
        } else {
          // Refresh failed but we still have an access token.
          // Decode user info from the existing JWT so the UI shows
          // the email instead of "unknown user".
          if (!cancelled) {
            const tokenUser = getUserFromToken(currentToken);
            setUser(tokenUser);
          }
        }
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    ensureSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return { user, loading };
}

export { useAuthGuard };
