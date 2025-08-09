import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalNavigation from "./components/ConditionalNavigation";
import PrivyProvider from "./components/PrivyProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AquaNode - Web3 Workflow Builder",
  description: "Simplify your DeFi journey with the power of data and AI agents across chains",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PrivyProvider>
          <div className="min-h-screen bg-background text-foreground">
            <ConditionalNavigation />
            {children}
          </div>
        </PrivyProvider>
      </body>
    </html>
  );
}
