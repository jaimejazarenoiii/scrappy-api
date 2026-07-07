export const authOpenApiPaths = {
  '/api/v1/auth/login': { post: { tags: ['Authentication'], summary: 'Login' } },
  '/api/v1/auth/logout': { post: { tags: ['Authentication'], summary: 'Logout' } },
  '/api/v1/auth/refresh': { post: { tags: ['Authentication'], summary: 'Refresh session' } },
  '/api/v1/auth/forgot-password': {
    post: { tags: ['Authentication'], summary: 'Forgot password placeholder' },
  },
};
