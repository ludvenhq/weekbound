import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

// The repository root: the studio roads live in roads/ next to web/, shared with the addon, and
// Turbopack resolves no file outside its root.
const root = fileURLToPath(new URL('..', import.meta.url));

const config: NextConfig = {
  reactStrictMode: true,
  // One small server for the container (the repo-root Dockerfile).
  output: 'standalone',
  // `next dev` would otherwise write its own agent rules file into web/.
  agentRules: false,
  turbopack: { root },
  outputFileTracingRoot: root,
  // The analytics host and site id from .env.production (public values), written into the build
  // so the server and the browser read the same; empty, no page loads a tracker.
  env: {
    UMAMI_HOST: process.env.UMAMI_HOST ?? '',
    UMAMI_SITE_ID: process.env.UMAMI_SITE_ID ?? '',
  },
};

export default config;
