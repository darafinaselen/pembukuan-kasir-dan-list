import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: {
    default: "Pembukuan Kasir & Rental Mobil",
    template: "%s | Pembukuan Kasir",
  },
  description:
    "Sistem manajemen pembukuan kasir dan rental mobil untuk mencatat transaksi, pengeluaran, armada, dan laporan keuangan",
  keywords: [
    "pembukuan",
    "kasir",
    "rental mobil",
    "manajemen armada",
    "laporan keuangan",
    "transaksi",
  ],
  authors: [{ name: "Pembukuan Kasir Team" }],
  creator: "Pembukuan Kasir",
  publisher: "Pembukuan Kasir",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "Pembukuan Kasir & Rental Mobil",
    description: "Sistem manajemen pembukuan kasir dan rental mobil",
    type: "website",
    locale: "id_ID",
    siteName: "Pembukuan Kasir",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body suppressHydrationWarning className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
