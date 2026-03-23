import type { NextConfig } from "next";

// Patch for Node.js 22+ experimental localStorage issue where it exists but lacks methods
if (typeof localStorage !== 'undefined' && typeof localStorage.getItem !== 'function') {
  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    writable: true,
    enumerable: true,
    configurable: true
  });
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
