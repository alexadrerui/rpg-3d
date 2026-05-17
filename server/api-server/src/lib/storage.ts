import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl }                from "@aws-sdk/s3-request-presigner"

const s3 = new S3Client({
  endpoint:    process.env.STORAGE_ENDPOINT   ?? "http://localhost:9000",
  region:      process.env.STORAGE_REGION     ?? "auto",
  credentials: {
    accessKeyId:     process.env.STORAGE_ACCESS_KEY ?? "minioadmin",
    secretAccessKey: process.env.STORAGE_SECRET_KEY ?? "minioadmin",
  },
  forcePathStyle: true, // required for MinIO / path-style S3 endpoints
})

const BUCKET     = process.env.STORAGE_BUCKET      ?? "rpg3d-assets"
const PUBLIC_URL = (process.env.STORAGE_PUBLIC_URL ?? "http://localhost:9000/rpg3d-assets").replace(/\/$/, "")

export function assetPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`
}

export async function presignPut(
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType })
  return getSignedUrl(s3, cmd, { expiresIn })
}
