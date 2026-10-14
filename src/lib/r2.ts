import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { r2Endpoint, type R2Config } from "@/lib/image-objects";

let cached: { fingerprint: string; client: S3Client } | null = null;

export function createR2Client(config: R2Config) {
  const fingerprint = `${config.accountId}:${config.accessKeyId}`;
  if (cached?.fingerprint === fingerprint) return cached.client;

  const client = new S3Client({
    region: "auto",
    endpoint: r2Endpoint(config.accountId),
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  cached = { fingerprint, client };
  return client;
}

export async function putR2Object(
  config: R2Config,
  objectKey: string,
  bytes: Buffer,
  contentType: string
) {
  await createR2Client(config).send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
      Body: bytes,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

export async function deleteR2Object(config: R2Config, objectKey: string) {
  await createR2Client(config).send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
    })
  );
}
