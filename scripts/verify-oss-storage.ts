import { randomUUID } from "node:crypto";
import {
  deleteAliyunOssObjectByUrl,
  getAliyunOssConfig,
  uploadBufferToAliyunOss,
} from "@/server/oss-storage";

async function main() {
  const config = getAliyunOssConfig();
  const fileName = `oss-probe-${randomUUID()}.txt`;
  const uploaded = await uploadBufferToAliyunOss({
    buffer: Buffer.from("xenia oss preflight", "utf8"),
    contentType: "text/plain; charset=utf-8",
    fileName,
    folder: "_probe",
    config,
  });

  const deleted = await deleteAliyunOssObjectByUrl(uploaded.imageUrl, config);
  if (!deleted) throw new Error("OSS 预检对象删除失败");
  console.log(`OSS 预检成功：${config.bucket} / ${config.endpoint}`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
