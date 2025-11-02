import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* suppressHydrationWarning silences hydration attribute mismatches on <body>.
          Prefer debugging extensions (incognito) first; this is a safe fallback. */}
      <body suppressHydrationWarning className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
