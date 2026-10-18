import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // `next dev` would otherwise write its own agent rules file into web/.
  agentRules: false,
};

export default config;
