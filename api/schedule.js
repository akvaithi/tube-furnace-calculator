import { Client } from "@upstash/qstash";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, totalMinutes, maxTemp, holdTime } = req.body || {};

  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Valid email required" });
  }
  const isTest = req.body && req.body.test === true;
  if (!isTest) {
    if (!Number.isFinite(totalMinutes) || totalMinutes <= 0 || totalMinutes > 60 * 24 * 7) {
      return res.status(400).json({ error: "Invalid total duration" });
    }
  }

  const delaySeconds = isTest ? 0 : Math.round(totalMinutes * 60);

  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const notifyUrl = `${proto}://${host}/api/notify`;

  try {
    const client = new Client({ token: process.env.QSTASH_TOKEN });
    const result = await client.publishJSON({
      url: notifyUrl,
      body: { email, maxTemp, holdTime, totalMinutes, test: isTest },
      delay: delaySeconds,
    });
    return res.status(200).json({ ok: true, messageId: result.messageId });
  } catch (err) {
    console.error("schedule error", err);
    return res.status(500).json({ error: "Failed to schedule notification" });
  }
}
