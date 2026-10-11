import { getStore } from "@netlify/blobs";
import { timingSafeEqual } from "node:crypto";

export const config = {
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ["ip", "domain"] },
};

const same = (a, b) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export default async (req) => {
  // The secret lives ONLY in Netlify's environment variables, never in front-end code
  const key = process.env.ADMIN_KEY || "";
  if (!key || !same(req.headers.get("x-admin-key") || "", key)) {
    return Response.json({ error: "Nope" }, { status: 401 });
  }
  const store = getStore({ name: "quiz", consistency: "strong" });
  const { blobs } = await store.list({ prefix: "s:" });
  const rows = (await Promise.all(blobs.slice(0, 500).map((b) => store.get(b.key, { type: "json" })))).filter(Boolean);
  rows.sort((a, b) => b.last - a.last);
  return Response.json({ now: Date.now(), rows: rows.slice(0, 300) });
};

