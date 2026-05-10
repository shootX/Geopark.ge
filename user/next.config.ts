import type { NextConfig } from "next";

/** Avoid year-long CDN/browser cache on HTML/RSC — pick up fresh chunk filenames after deploy */
const nextConfig: NextConfig = {
  headers: async () => [
    {
      source:
        "/:path((?!_next/static|_next/image|icons/|manifest.json|.*\\.[a-z]{2,4}$).*)",
      headers: [
        {
          key: "Cache-Control",
          value: "private, max-age=0, no-cache, no-store, must-revalidate",
        },
      ],
    },
  ],
};

export default nextConfig;
