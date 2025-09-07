import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { generateCSPHeader } from "@/utils/security";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "BRHS Utilities",
  description: "Useful Applications for BRHS",
  icons: {
    icon: [
      { url: '/spartan.png', sizes: '32x32', type: 'image/png' },
      { url: '/spartan.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/spartan.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  other: {
    'Content-Security-Policy': generateCSPHeader(),
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Force normal zoom level
              if (window.devicePixelRatio !== 1) {
              }
              
              // Check if browser zoom is not 100%
              if (window.outerWidth / window.innerWidth !== 1) {
                document.body.style.zoom = '1';
                document.body.style.transform = 'none';
              }
              
              // Force viewport to be exactly 100%
              const viewport = document.querySelector('meta[name="viewport"]');
              if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
              }
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
