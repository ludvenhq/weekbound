// For the container's health check and the deploy's smoke test: the server answers.
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ ok: true });
}
