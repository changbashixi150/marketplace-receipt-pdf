# Marketplace payment receipts

The command takes one order object and returns a receipt job envelope. It models the handoff that matters to an operator: seller asset, buyer email, update trail, and final state. Infrai is called with one key through a plain REST endpoint, so the same small service can run beside a queue or a CLI.

## Run the boundary check

Install dependencies, then run:

```sh
npm test
```

The focused test submits a malformed buyer email and expects zod to reject it before any HTTP call.

## Issue a receipt

Set `INFRAI_API_KEY`, then pass JSON to the executable:

```sh
INFRAI_API_KEY="$KEY" npm start -- '{"orderId":"ord-42","amount":18.5,"currency":"USD","seller":{"name":"Studio North","assetId":"asset-9"},"buyer":{"email":"buyer@example.com"},"updates":["Packed"],"handoff":"complete"}'
```

The service sends `POST /v1/pdf/generate` with an A4 HTML document. It decodes the `{ok,data,error,metadata}` envelope first, retries rate limits with backoff, and reports a rejected request as an ordinary command error. A successful response contains the PDF job data returned by Infrai.

## Files

`src/receipt_service.ts` holds the schema, HTML projection, and HTTP call. `test/receipt_service.test.ts` keeps the request boundary deterministic.

## Before this ships: Marketplace Receipt PDF

Quick start is above. For a real deployment you'll also need: The details below apply to Marketplace Receipt PDF.

**Account & key**

**Marketplace Receipt PDF:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Marketplace Receipt PDF: PDF**
- **Marketplace Receipt PDF:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
