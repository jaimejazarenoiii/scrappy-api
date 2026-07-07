export const commonSchemas = {
  ApiErrorEnvelope: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      data: { nullable: true, type: 'null' },
      meta: { type: 'object' },
      error: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'array', items: { type: 'object' } },
        },
      },
    },
  },
};
