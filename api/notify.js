import { Receiver } from "@upstash/qstash";
import { Resend } from "resend";

export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers["upstash-signature"];

  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
  });

  try {
    const valid = await receiver.verify({ signature, body: rawBody });
    if (!valid) return res.status(401).json({ error: "Invalid signature" });
  } catch (err) {
    console.error("verify error", err);
    return res.status(401).json({ error: "Signature verification failed" });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const { email, maxTemp, holdTime, totalMinutes } = payload;

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: "Tube furnace run complete",
      text: `Your tube furnace run is complete.

Max temp: ${maxTemp} °C
Hold time at max: ${holdTime} min
Total programmed duration: ${totalMinutes} min

The programmed cycle has finished. Natural cooling is in progress if the furnace was above 500 °C at the end of the program.`,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("resend error", err);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
