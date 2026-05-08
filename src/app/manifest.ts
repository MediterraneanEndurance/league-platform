import type { MetadataRoute } from "next";

const themeColor = "#050608";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mediterranean Endurance League",
    short_name: "MEL",
    description: "Competitive Le Mans Ultimate endurance racing platform",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: themeColor,
    theme_color: themeColor,
    categories: ["sports", "racing", "entertainment"],
    icons: [
      {
        src: "/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app-icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
