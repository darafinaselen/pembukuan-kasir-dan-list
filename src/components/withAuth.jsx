"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Higher-Order Component untuk protect admin pages
 * Automatically redirects ke "/" jika unauthorized
 */
export default function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
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

    // Intercept fetch globally untuk handle 401
    useEffect(() => {
      const originalFetch = window.fetch;

      window.fetch = async (...args) => {
        const response = await originalFetch(...args);

        // Clone response untuk bisa membaca body
        const clonedResponse = response.clone();

        // Check if unauthorized
        if (response.status === 401 || response.status === 403) {
          console.log("API returned 401/403, redirecting to login...");
          router.push("/");
        }

        return clonedResponse;
      };

      // Cleanup
      return () => {
        window.fetch = originalFetch;
      };
    }, [router]);

    return <WrappedComponent {...props} />;
  };
}
