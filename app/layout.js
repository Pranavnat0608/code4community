import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthContext";

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
  title: "BRHSTools",
  description: "Useful tools for BRHS",
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
                console.log('Device pixel ratio:', window.devicePixelRatio);
              }
              
              // Check if browser zoom is not 100%
              if (window.outerWidth / window.innerWidth !== 1) {
                console.log('Browser zoom detected, attempting to reset...');
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
