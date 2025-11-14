"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Custom hook to get current logged-in user info with session expiry handling
 * @returns {object} { user, loading, error, sessionExpiry, checkSession }
 */
export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const router = useRouter();

  // Use refs to avoid stale closures in intervals
  const intervalRef = useRef(null);
  const warningShownRef = useRef(false);

  // Function to refresh session
  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data.expiresAt) {
          // Update session expiry time
          setSessionExpiry(new Date(data.data.expiresAt));
          console.log("Session refreshed successfully");
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Session refresh failed:", error);
      return false;
    }
  }, []);

  // Function to check session validity
  const checkSession = useCallback(async (showErrors = true) => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (res.status === 401 || res.status === 403) {
        console.log("Session expired or invalid, redirecting to login...");
        // Clear any existing intervals
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        // Clear user state
        setUser(null);
        setSessionExpiry(null);
        setError("Session expired");
        // Redirect to home page
        router.push("/");
        return null;
      }

      if (!res.ok) {
        if (showErrors) {
          throw new Error("Failed to fetch user info");
        }
        return null;
      }

      const data = await res.json();
      const userData = data.data?.user || data.user || data.data;
      const sessionData = data.data?.session;

      if (userData) {
        setUser(userData);
        setError(null);

        // Use actual session expiry from API if available
        if (sessionData?.expiresAt) {
          setSessionExpiry(new Date(sessionData.expiresAt));
        } else {
          // Fallback to assuming 7 days from now
          const expiryTime = new Date();
          expiryTime.setDate(expiryTime.getDate() + 7);
          setSessionExpiry(expiryTime);
        }

        return userData;
      }

      return null;
    } catch (err) {
      if (showErrors) {
        console.error("Error checking session:", err);
        setError(err.message);
      }
      return null;
    }
  }, [router]);

  // Function to show session expiry warning
  const showExpiryWarning = useCallback(() => {
    if (warningShownRef.current) return;

    warningShownRef.current = true;

    // Show warning toast (assuming sonner is available)
    if (typeof window !== 'undefined' && window.sonner) {
      window.sonner.toast.warning("Session akan berakhir", {
        description: "Sesi Anda akan berakhir dalam 5 menit. Silakan simpan pekerjaan Anda.",
        duration: 10000,
      });
    } else {
      // Fallback alert
      alert("Peringatan: Sesi Anda akan berakhir dalam 5 menit. Silakan simpan pekerjaan Anda.");
    }
  }, []);

  // Function to handle automatic logout
  const handleAutoLogout = useCallback(() => {
    console.log("Session expired, performing automatic logout...");

    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Clear state
    setUser(null);
    setSessionExpiry(null);
    setError("Session expired");

    // Show logout message
    if (typeof window !== 'undefined' && window.sonner) {
      window.sonner.toast.error("Sesi Berakhir", {
        description: "Sesi Anda telah berakhir. Silakan login kembali.",
        duration: 5000,
      });
    }

    // Redirect after a short delay to show the message
    setTimeout(() => {
      router.push("/");
    }, 1000);
  }, [router]);

  // Initial session check
  useEffect(() => {
    const initializeSession = async () => {
      setLoading(true);
      await checkSession();
      setLoading(false);
    };

    initializeSession();
  }, [checkSession]);

  // Set up periodic session checking and expiry monitoring
  useEffect(() => {
    if (!user || !sessionExpiry) return;

    // Check session every 30 seconds
    intervalRef.current = setInterval(async () => {
      const currentUser = await checkSession(false); // Don't show errors for periodic checks

      if (!currentUser) {
        // Session is invalid, trigger logout
        handleAutoLogout();
        return;
      }

      // Check if session is about to expire (within 5 minutes)
      const now = new Date();
      const timeUntilExpiry = sessionExpiry.getTime() - now.getTime();
      const fiveMinutes = 5 * 60 * 1000;
      const tenMinutes = 10 * 60 * 1000;

      // If session expires within 10 minutes, try to refresh it
      if (timeUntilExpiry <= tenMinutes && timeUntilExpiry > fiveMinutes) {
        console.log("Session expiring soon, attempting refresh...");
        const refreshSuccess = await refreshSession();
        if (refreshSuccess) {
          console.log("Session refreshed automatically");
          // Reset warning flag since session was refreshed
          warningShownRef.current = false;
          return;
        }
      }

      // Show warning if session expires within 5 minutes
      if (timeUntilExpiry <= fiveMinutes && timeUntilExpiry > 0) {
        showExpiryWarning();
      }

      // If session has actually expired, logout immediately
      if (timeUntilExpiry <= 0) {
        handleAutoLogout();
      }
    }, 30000); // Check every 30 seconds

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, sessionExpiry, checkSession, handleAutoLogout, showExpiryWarning, refreshSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      warningShownRef.current = false;
    };
  }, []);

  return {
    user,
    loading,
    error,
    sessionExpiry,
    checkSession: () => checkSession(true), // Expose checkSession with error display
  };
}
