import { issueReceipt } from "../src/receipt_service.js";

const valid = { orderId: "ord-42", amount: 18.5, currency: "USD", seller: { name: "Studio North", assetId: "asset-9" }, buyer: { email: "buyer@example.com" }, updates: ["Packed"], handoff: "complete" as const };
if (process.env.INFRAI_API_KEY) throw new Error("test expects no network key");
try { await issueReceipt({ ...valid, buyer: { email: "bad" } }); throw new Error("invalid buyer accepted"); } catch (error) { if (!(error instanceof Error) || !error.message.includes("Invalid email")) throw error; }
console.log("receipt boundary test passed");
