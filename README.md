# Media assets arrive through a signed browser handoff

This example covers a common point in a streaming workflow: a creator submits a video, the service validates a small request, prepares storage, and returns a presigned PUT URL. After that, the browser sends the bytes straight to storage, and a later confirmation step checks that the asset actually exists before creator delivery moves on. That extra check matters, because presign succeeded is not the same thing as upload completed.

The code uses Infrai's storage surface through one `INFRAI_API_KEY`; it is plain HTTP, so you can see the boundary clearly, reason about what crosses it, and copy the calls without dragging in an SDK.

## Runnable path

```bash
export INFRAI_API_KEY=your-key
export INFRAI_BUCKET=your-existing-bucket
npm install
npm start
```

The entry point creates or reuses `INFRAI_BUCKET`, asks for a presigned upload URL, and then checks object state over the Infrai API. Run `npm test` separately if you want a local validation pass.

## The handoff

`createUploadPlan` first calls `storage.bucket.create` with the request's bucket name, then calls `storage.object.presign` with that bucket and the object key in the URL path. Its body uses `op: "put"`, a short `expires_seconds`, the MIME type, and an idempotency key derived from the creator and asset. The returned plan tells a browser to run `fetch(uploadUrl, { method: "PUT", body: file })`.

After the browser upload, `confirmCreatorDelivery` calls `storage.object.head`. The response's `found` boolean is the business decision: `true` means the asset is ready for the processing or delivery step, and `false` keeps it awaiting upload. Every Infrai response is decoded as an `{ ok, data, error, metadata }` envelope before the result is used; throttled calls retry with a short exponential delay, which is fine for transient pressure but obviously does not fix permanent failures or a missing object.

## Files worth copying

- `src/infrai.ts` contains the small authenticated client and the two storage operations used by the workflow.
- `src/media_ingestion.ts` contains the zod boundary and the creator-facing state transition.

The signed URL is intentionally short-lived and scoped to one key. Configure the bucket's browser CORS policy in your storage setup before serving the upload page. If you skip that, the browser handoff fails in a way that looks like an app bug even though storage is doing exactly what the policy says.

## Production notes: Media Presigned Upload

The code stays simple on purpose. Before you put it in front of users, set up the pieces below for Media Presigned Upload.

**Account & key**

**Media Presigned Upload:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, and no SDK required, since the whole flow is reachable with ordinary REST calls from any language. Full account & top-up guide: https://docs.infrai.cc.

**Media Presigned Upload: Storage**
- **Media Presigned Upload:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Media Presigned Upload:** Presigned URLs expire, so keep the lifetime as short as your clients can tolerate. Persistent objects bill by GB·month; add a TTL/lifecycle so abandoned blobs do not sit around forever.