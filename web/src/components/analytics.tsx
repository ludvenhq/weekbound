import { analytics } from '@/lib/analytics';

// The Umami tracker, once in the layout: React puts an async script in the head. It loads from
// this site's own path and sends to the same path, only when web/.env.production holds both
// values, and counts only on weekbound.ludven.com.
export function Analytics() {
  const { path, siteId, domain } = analytics;
  if (!path || !siteId) return null;
  return <script async src={`${path}/script.js`} data-website-id={siteId} data-domains={domain} />;
}
