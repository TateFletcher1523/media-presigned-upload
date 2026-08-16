import { confirmCreatorDelivery, createUploadPlan } from "./media_ingestion.js";

const bucket = process.env.INFRAI_BUCKET;
if (!bucket) throw new Error("INFRAI_BUCKET is required");

const request = {
  creatorId: "codecheck",
  bucket,
  assetKey: `codecheck/${Date.now()}.txt`,
  contentType: "text/plain",
};

const plan = await createUploadPlan(request);
const delivery = await confirmCreatorDelivery(request);
console.log(JSON.stringify({ plan: { ...plan, uploadUrl: "[redacted]" }, delivery }, null, 2));
