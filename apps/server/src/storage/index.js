import { createLocalStorageAdapter } from "./local-storage-adapter.js";
import { createS3StorageAdapter } from "./s3-storage-adapter.js";

export async function createStorageAdapter(config) {
  if (config.storageDriver === "s3") {
    return createS3StorageAdapter({ config });
  }

  return createLocalStorageAdapter({
    uploadDir: config.uploadDir
  });
}
