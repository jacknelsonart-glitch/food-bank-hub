import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: { default: "Food Bank Hub", template: "%s · Food Bank Hub" },
  description: "Find food banks near you, see when they're open, and help sort and share donated food.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#1f7a4d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Nav />
        <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6">{children}</main>
      </body>
    </html>
  );
}
