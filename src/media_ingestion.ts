import { z } from "zod";
import { infrai } from "./infrai.js";

export const assetRequest = z.object({
  creatorId: z.string().min(1),
  bucket: z.string().min(1),
  assetKey: z.string().min(1),
  contentType: z.string().min(1),
});

export type AssetRequest = z.infer<typeof assetRequest>;
export type UploadPlan = AssetRequest & { uploadUrl: string; method: "PUT"; status: "awaiting_upload" };

export async function createUploadPlan(input: unknown): Promise<UploadPlan> {
  const request = assetRequest.parse(input);
  await infrai.storage.bucket.create({ name: request.bucket });
  const signed = await infrai.storage.object.presign(request.bucket, request.assetKey, {
    op: "put",
    expires_seconds: 900,
    content_type: request.contentType,
    idempotency_key: `${request.creatorId}:${request.assetKey}`,
  });
  return { ...request, uploadUrl: signed.url, method: "PUT", status: "awaiting_upload" };
}

export async function confirmCreatorDelivery(input: AssetRequest): Promise<{ delivered: boolean; key: string }> {
  const state = await infrai.storage.object.head(input.bucket, input.assetKey);
  return { delivered: state.found, key: input.assetKey };
}
