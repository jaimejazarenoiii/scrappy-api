import type { Request } from 'express';

export function isTransactionAttachmentContentRequest(req: Request): boolean {
  return (
    req.method === 'GET' && /\/transactions\/[^/]+\/attachments\/[^/]+\/content$/.test(req.path)
  );
}

export function extractAccessToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length);
  }

  if (!isTransactionAttachmentContentRequest(req)) {
    return undefined;
  }

  const queryToken = req.query.access_token;
  return typeof queryToken === 'string' && queryToken.length > 0 ? queryToken : undefined;
}
