import type { Request } from 'express';

const ATTACHMENT_CONTENT_PATH = /\/(transactions|expenses)\/[^/]+\/attachments\/[^/]+\/content$/;

export function isAttachmentContentRequest(req: Request): boolean {
  return req.method === 'GET' && ATTACHMENT_CONTENT_PATH.test(req.path);
}

/** @deprecated Use {@link isAttachmentContentRequest} */
export function isTransactionAttachmentContentRequest(req: Request): boolean {
  return isAttachmentContentRequest(req);
}

export function extractAccessToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length);
  }

  if (!isAttachmentContentRequest(req)) {
    return undefined;
  }

  const queryToken = req.query.access_token;
  return typeof queryToken === 'string' && queryToken.length > 0 ? queryToken : undefined;
}
