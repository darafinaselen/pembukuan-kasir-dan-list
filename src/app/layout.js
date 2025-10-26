import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* suppressHydrationWarning silences hydration attribute mismatches on <body>.
          Prefer debugging extensions (incognito) first; this is a safe fallback. */}
      <body suppressHydrationWarning className="antialiased">
        {children}
      </body>
    </html>
  );
}
