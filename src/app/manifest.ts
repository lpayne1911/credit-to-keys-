import type { MetadataRoute } from "next";

// Web App Manifest — makes the site installable to the home screen with a
// brand icon, full-screen (standalone) launch, and brand colors.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Driveway Advocate",
    short_name: "Advocate",
    description:
      "Is your car deal fair? Tap through a few questions and get a clear, buyer-side verdict before you sign.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FCFBF8",
    theme_color: "#14253D",
    categories: ["finance", "shopping", "utilities"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
