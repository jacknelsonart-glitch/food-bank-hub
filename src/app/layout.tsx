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
        {process.env.TEST_SITE === "true" && (
          <p className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
            This is a test version. Please don&apos;t enter real details: everything here is wiped from time to time.
          </p>
        )}
        <Nav />
        <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-8 text-sm text-muted">
          Food Bank Hub is free and open source.{" "}
          <a className="underline" href="https://github.com/jacknelsonart-glitch/food-bank-hub">
            Source code
          </a>
        </footer>
      </body>
    </html>
  );
}
