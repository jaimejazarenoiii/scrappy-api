import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';

type S3Body = {
  transformToByteArray?: () => Promise<Uint8Array>;
};

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (typeof body === 'string') return Buffer.from(body);

  const sdkBody = body as S3Body;
  if (typeof sdkBody.transformToByteArray === 'function') {
    return Buffer.from(await sdkBody.transformToByteArray());
  }

  throw new Error('Unsupported S3 object body type');
}

/**
 * Thin S3 object helper used by transaction/expense file storage adapters.
 * Persisted `filePath` values remain relative object keys (same shape as local relative paths).
 */
export class S3ObjectStore {
  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
  ) {}

  async put(key: string, content: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: content,
        ContentType: contentType,
      }),
    );
  }

  async get(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    return streamToBuffer(response.Body);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
