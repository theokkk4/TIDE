import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The story is the front door; the app itself lives at /home.
  async redirects() {
    return [{ source: "/", destination: "/dive", permanent: false }];
  },
};

export default nextConfig;
