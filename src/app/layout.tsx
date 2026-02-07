import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthContextProvider } from "@/components/AuthContextProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "@/lib/error-logger";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kanban App",
  description: "A simple and efficient kanban board application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AuthContextProvider> 
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </AuthContextProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
