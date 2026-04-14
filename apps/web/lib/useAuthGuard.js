"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "./api";
import {
  clearAccessToken,
  getAccessTokenFromCookie,
  setAccessToken,
} from "./auth";

function useAuthGuard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function ensureSession() {
      const currentToken = getAccessTokenFromCookie();
      if (!currentToken) {
        try {
          const data = await apiRequest("/auth/refresh", {
            method: "POST",
          });
          setAccessToken(data.accessToken);
          if (!cancelled) {
            setUser(data.user);
          }
        } catch (error) {
          clearAccessToken();
          if (!cancelled) {
            router.push("/login");
          }
        }
      } else {
        try {
          const data = await apiRequest("/auth/refresh", {
            method: "POST",
          });
          setAccessToken(data.accessToken);
          if (!cancelled) {
            setUser(data.user);
          }
        } catch (error) {
          if (!cancelled) {
            setUser(null);
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
