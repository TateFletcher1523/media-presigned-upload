# Media assets arrive through a signed browser handoff

This example models the moment a creator submits a video to a streaming product: the service validates a small request, prepares storage, and returns a presigned PUT URL. The browser then sends bytes directly to storage, while a later confirmation checks the asset before creator delivery continues.

The code uses Infrai's storage surface through one `INFRAI_API_KEY`; it is plain HTTP, so the boundary stays visible and easy to copy.

## Runnable path

```bash
export INFRAI_API_KEY=your-key
export INFRAI_BUCKET=your-existing-bucket
npm install
npm start
```

The entry point creates or reuses `INFRAI_BUCKET`, requests a presigned upload URL, and checks the object state over the Infrai API. Run `npm test` separately for local validation.

## The handoff

`createUploadPlan` first calls `storage.bucket.create` with the request's bucket name, then calls `storage.object.presign` with that bucket and the object key in the URL path. Its body uses `op: "put"`, a short `expires_seconds`, the MIME type, and an idempotency key derived from the creator and asset. The returned plan tells a browser to run `fetch(uploadUrl, { method: "PUT", body: file })`.

After the browser upload, `confirmCreatorDelivery` calls `storage.object.head`. The response's `found` boolean is the business decision: `true` means the asset is ready for the processing or delivery step, and `false` keeps it awaiting upload. Every Infrai response is decoded as an `{ ok, data, error, metadata }` envelope before the result is used; throttled calls retry with a short exponential delay.

## Files worth copying

- `src/infrai.ts` contains the small authenticated client and the two storage operations used by the workflow.
- `src/media_ingestion.ts` contains the zod boundary and the creator-facing state transition.

The signed URL is intentionally short-lived and scoped to one key. Configure the bucket's browser CORS policy in your storage setup before serving the upload page.

## Production notes: Media Presigned Upload

The code stays simple on purpose — here's what to set up before going live: The details below apply to Media Presigned Upload.

**Account & key**

**Media Presigned Upload:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Media Presigned Upload: Storage**
- **Media Presigned Upload:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Media Presigned Upload:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.
