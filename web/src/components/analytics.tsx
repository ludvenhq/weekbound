import { analytics } from '@/lib/analytics';

// The Umami tracker, once in the layout: React puts an async script in the head. It loads only
// when web/.env.production holds both values, and counts only on weekbound.ludven.com.
export function Analytics() {
  const { host, siteId, domain } = analytics;
  if (!host || !siteId) return null;
  return <script async src={`${host}/script.js`} data-website-id={siteId} data-domains={domain} />;
}
