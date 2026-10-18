import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

// The repository root: the studio roads live in roads/ next to web/, shared with the addon, and
// Turbopack resolves no file outside its root.
const root = fileURLToPath(new URL('..', import.meta.url));

const config: NextConfig = {
  reactStrictMode: true,
  // `next dev` would otherwise write its own agent rules file into web/.
  agentRules: false,
  turbopack: { root },
  outputFileTracingRoot: root,
};

export default config;
