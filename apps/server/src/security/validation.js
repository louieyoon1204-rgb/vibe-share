export function validateFileMetadata({ fileName, mimeType, size }, config) {
  const errors = [];

  if (!fileName || String(fileName).length > 255) {
    errors.push("Invalid file name.");
  }

  if (!Number.isFinite(size) || size <= 0) {
    errors.push("Invalid file size.");
  }

  if (size > config.maxFileSizeBytes) {
    errors.push(`File is larger than the configured ${config.maxFileSizeBytes} byte limit.`);
  }

  if (config.allowedMimeTypes.length > 0 && !config.allowedMimeTypes.includes(mimeType || "application/octet-stream")) {
    errors.push("File type is not allowed.");
  }

  return errors;
}

export async function runMalwareScanHook({ transfer, config }) {
  if (!config.malwareScanWebhookUrl) {
    return { status: "released", skipped: true };
  }

  const response = await fetch(config.malwareScanWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transferId: transfer.id,
      storageKey: transfer.storageKey,
      fileName: transfer.fileName,
      mimeType: transfer.mimeType,
      size: transfer.size
    })
  });

  if (!response.ok) {
    throw new Error(`Malware scan hook failed with HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await response.json();
    if (["released", "quarantined", "failed_scan"].includes(body.status)) {
      return body;
    }
  }

  return { status: "released" };
}
