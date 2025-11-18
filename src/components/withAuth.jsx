"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Higher-Order Component untuk protect admin pages
 * Automatically redirects ke "/" jika unauthorized dengan improved session handling
 */
export default function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const router = useRouter();
    const redirectInProgressRef = useRef(false);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const response = await fetch("/api/auth/me", {
            credentials: "include",
          });

          if (!response.ok) {
            console.log("Not authenticated, redirecting to login...");
            performRedirect();
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          performRedirect();
        }
      };

      // Only check auth if not already redirecting
      if (!redirectInProgressRef.current) {
        checkAuth();
      }
    }, [router]);

    // Function to handle redirect with proper cleanup
    const performRedirect = () => {
      if (redirectInProgressRef.current) return;

      redirectInProgressRef.current = true;
      console.log("Performing auth redirect to home page...");

      // Clear any existing timers or intervals
      if (typeof window !== 'undefined') {
        // Clear any session-related intervals (if they exist globally)
        const highestId = window.setTimeout(() => {}, 0);
        for (let i = 0; i < highestId; i++) {
          window.clearTimeout(i);
          window.clearInterval(i);
        }
      }

      // Show logout message if toast library is available
      if (typeof window !== 'undefined' && window.sonner) {
        window.sonner.toast.error("Sesi Berakhir", {
          description: "Sesi Anda telah berakhir. Silakan login kembali.",
          duration: 3000,
        });
      }

      // Small delay to show the message before redirect
      setTimeout(() => {
        router.push("/");
      }, 500);
    };

    // Intercept fetch globally untuk handle 401/403 dengan improved logic
    useEffect(() => {
      const originalFetch = window.fetch;

      window.fetch = async (...args) => {
        const response = await originalFetch(...args);

        // Clone response untuk bisa membaca body
        const clonedResponse = response.clone();

        // Check if unauthorized or forbidden
        if (response.status === 401 || response.status === 403) {
          // Check if this is an auth-related endpoint to avoid loops
          const url = args[0] instanceof Request ? args[0].url : args[0];
          const isAuthEndpoint = url.includes('/api/auth/');

          if (!isAuthEndpoint) {
            console.log("API returned 401/403, session expired, redirecting...");
            performRedirect();
            return clonedResponse;
          }
        }

        return clonedResponse;
      };

      // Cleanup
      return () => {
        window.fetch = originalFetch;
      };
    }, [router]);

    // Handle page visibility changes to check session when user returns
    useEffect(() => {
      const handleVisibilityChange = () => {
        if (!document.hidden && !redirectInProgressRef.current) {
          // User returned to tab, check if session is still valid
          fetch("/api/auth/me", { credentials: "include" })
            .then(response => {
              if (!response.ok) {
                console.log("Session invalid after tab focus, redirecting...");
                performRedirect();
              }
            })
            .catch(error => {
              console.error("Session check failed on visibility change:", error);
              // Don't redirect on network errors, only on auth failures
            });
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }, []);

    return <WrappedComponent {...props} />;
  };
}
