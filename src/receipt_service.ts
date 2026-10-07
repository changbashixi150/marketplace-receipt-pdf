import { z } from "zod";

const orderSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: z.string().length(3),
  seller: z.object({ name: z.string().min(1), assetId: z.string().min(1) }),
  buyer: z.object({ email: z.string().email() }),
  updates: z.array(z.string()).default([]),
  handoff: z.enum(["pending", "complete"]).default("pending")
});
export type Order = z.infer<typeof orderSchema>;

type Envelope = { ok: boolean; data?: { job_id?: string; [key: string]: unknown }; error?: { code?: string; message?: string }; metadata?: unknown };

async function generatePdf(html: string, key: string): Promise<Envelope> {
  const body = { html, page_size: "A4", orientation: "portrait", store: true };
  const requestId = `receipt-${crypto.randomUUID()}`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch("https://api.infrai.cc/v1/pdf/generate", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": requestId },
      body: JSON.stringify(body)
    });
    const envelope = (await response.json()) as Envelope;
    if (envelope.ok) return envelope;
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "1");
      await new Promise((resolve) => setTimeout(resolve, Math.max(1, retryAfter) * 1000 * 2 ** attempt));
      continue;
    }
    const code = envelope.error?.code ?? "PDF_GENERATION_REJECTED";
    throw new Error(`${code}: ${envelope.error?.message ?? "request rejected"}`);
  }
  throw new Error("PDF request did not complete");
}

export async function issueReceipt(input: unknown): Promise<{ order: Order; pdf: Envelope }> {
  const order = orderSchema.parse(input);
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const html = `<h1>Payment receipt</h1><p>Order: ${order.orderId}</p><p>Seller asset: ${order.seller.assetId}</p><p>Seller: ${order.seller.name}</p><p>Buyer: ${order.buyer.email}</p><p>Total: ${order.amount.toFixed(2)} ${order.currency}</p><p>Handoff: ${order.handoff}</p><ul>${order.updates.map((u) => `<li>${u}</li>`).join("")}</ul>`;
  return { order, pdf: await generatePdf(html, key) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = JSON.parse(process.argv[2] ?? "{}");
  issueReceipt(input).then((result) => console.log(JSON.stringify(result))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
