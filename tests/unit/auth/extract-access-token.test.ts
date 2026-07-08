import type { Request } from 'express';
import { describe, expect, it } from 'vitest';
import {
  extractAccessToken,
  isTransactionAttachmentContentRequest,
} from '../../../src/shared/auth/extract-access-token.js';

describe('extractAccessToken', () => {
  it('reads bearer tokens from the authorization header', () => {
    const token = extractAccessToken({
      method: 'GET',
      path: '/users/me',
      headers: { authorization: 'Bearer header-token' },
      query: {},
    } as Request);

    expect(token).toBe('header-token');
  });

  it('reads access tokens from the query string for attachment content requests', () => {
    const token = extractAccessToken({
      method: 'GET',
      path: '/transactions/t1/attachments/a1/content',
      headers: {},
      query: { access_token: 'query-token' },
    } as Request);

    expect(token).toBe('query-token');
  });

  it('ignores query tokens for non-attachment routes', () => {
    const token = extractAccessToken({
      method: 'GET',
      path: '/users/me',
      headers: {},
      query: { access_token: 'query-token' },
    } as Request);

    expect(token).toBeUndefined();
  });

  it('detects attachment content paths', () => {
    expect(
      isTransactionAttachmentContentRequest({
        method: 'GET',
        path: '/transactions/t1/attachments/a1/content',
      } as Request),
    ).toBe(true);
    expect(
      isTransactionAttachmentContentRequest({
        method: 'GET',
        path: '/transactions/t1/attachments',
      } as Request),
    ).toBe(false);
  });
});
