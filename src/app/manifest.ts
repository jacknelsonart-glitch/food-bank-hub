import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Food Bank Hub",
    short_name: "Food Bank Hub",
    description: "Find food banks, see opening times, and sort donations.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f4",
    theme_color: "#1f7a4d",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
