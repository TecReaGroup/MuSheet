import { createHash, randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { rm } from 'node:fs/promises';
import { Transform, type Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { HttpError } from '../http/http-error';
import { tempFilePath } from './file-storage';

export interface UploadMeter {
  digest(): string;
  size(): number;
  head(): Buffer;
}

function createUploadMeter(maxBytes: number, headBytes: number): UploadMeter & { stream: Transform } {
  const hash = createHash('sha256');
  const headChunks: Buffer[] = [];
  let headLength = 0;
  let size = 0;
  const stream = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      size += chunk.length;
      if (size > maxBytes) {
        callback(new HttpError(413, 'too_large', `Upload exceeds ${Math.round(maxBytes / 1024 / 1024)}MB`));
        return;
      }
      if (headLength < headBytes) {
        headChunks.push(chunk);
        headLength += chunk.length;
      }
      hash.update(chunk);
      callback(null, chunk);
    },
  });
  return {
    stream,
    digest: () => hash.digest('hex'),
    size: () => size,
    head: () => Buffer.concat(headChunks).subarray(0, headBytes),
  };
}

/** Streams a raw upload into ./temp while hashing it; the caller validates, moves it into storage and removes the temp file. */
export async function writeUploadToTemp(body: Readable, maxBytes: number, headBytes: number) {
  const tempPath = tempFilePath(`upload-${randomUUID()}`);
  const meter = createUploadMeter(maxBytes, headBytes);
  try {
    await pipeline(body, meter.stream, createWriteStream(tempPath));
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }
  return { tempPath, meter: meter as UploadMeter };
}

export const JPEG_SIGNATURE_BYTES = 3;

export function startsWithJpegSignature(head: Buffer) {
  return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
}
