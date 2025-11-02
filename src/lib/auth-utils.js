"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Custom hook to handle API responses and redirect on 401
 * @param {Response} response - Fetch API response
 * @returns {Response} - Original response for chaining
 */
export function useAuthRedirect() {
  const router = useRouter();

  const handleResponse = async (response) => {
    if (response.status === 401 || response.status === 403) {
      console.log("Unauthorized access detected, redirecting to login...");
      router.push("/");
      return null;
    }
    return response;
  };

  return { handleResponse };
}

/**
 * Wrapper fetch function that automatically handles 401/403
 */
export async function authFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: options.credentials || "include",
    });

    // If unauthorized, redirect to login
    if (response.status === 401 || response.status === 403) {
      console.log("Unauthorized access detected, redirecting to login...");
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
      throw new Error("Unauthorized");
    }

    return response;
  } catch (error) {
    // Re-throw if it's our intentional unauthorized error
    if (error.message === "Unauthorized") {
      throw error;
    }
    // Handle network errors normally
    throw error;
  }
}

/**
 * Check authentication status on mount
 */
export function useAuthCheck() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!response.ok) {
          console.log("Not authenticated, redirecting to login...");
          router.push("/");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/");
      }
    };

    checkAuth();
  }, [router]);
}
