import assert from "node:assert/strict";
import { assetRequest } from "../src/media_ingestion.js";

const parsed = assetRequest.parse({ creatorId: "creator-7", bucket: "media-assets", assetKey: "creator-7/clip.mp4", contentType: "video/mp4" });
assert.equal(parsed.assetKey, "creator-7/clip.mp4");
assert.throws(() => assetRequest.parse({ creatorId: "", bucket: "media-assets", assetKey: "clip.mp4", contentType: "video/mp4" }));
console.log("asset request validation: passed");
