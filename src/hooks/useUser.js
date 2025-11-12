"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Custom hook to get current logged-in user info
 * @returns {object} { user, loading, error }
 */
export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (res.status === 401 || res.status === 403) {
          router.push("/");
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to fetch user info");
        }

        const data = await res.json();
        setUser(data.user || data.data);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [router]);

  return { user, loading, error };
}
