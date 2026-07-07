type OpenApiParameter = {
  name: string;
  in: 'path' | 'query' | 'header';
  required?: boolean;
  description?: string;
  schema: Record<string, unknown>;
};

type OpenApiOperation = {
  tags?: string[];
  summary?: string;
  description?: string;
  parameters?: OpenApiParameter[];
  requestBody?: Record<string, unknown>;
  responses?: Record<string, unknown>;
  security?: Array<Record<string, string[]>>;
};

export const bearerSecurity = [{ bearerAuth: [] }];

export function uuidPathParam(name: string, description: string): OpenApiParameter {
  return {
    name,
    in: 'path',
    required: true,
    description,
    schema: { type: 'string', format: 'uuid' },
  };
}

export function queryParam(
  name: string,
  schema: Record<string, unknown>,
  description?: string,
  required = false,
): OpenApiParameter {
  return { name, in: 'query', required, description, schema };
}

export function jsonRequestBody(schemaRef: string, required = true) {
  return {
    required,
    content: {
      'application/json': {
        schema: { $ref: `#/components/schemas/${schemaRef}` },
      },
    },
  };
}

export function refSchema(schemaRef: string) {
  return { $ref: `#/components/schemas/${schemaRef}` };
}

export function successResponse(
  dataSchemaRef: string | { type: 'array'; items: string },
  description: string,
  statusCode: '200' | '201' = '200',
) {
  const dataSchema =
    typeof dataSchemaRef === 'string'
      ? refSchema(dataSchemaRef)
      : { type: 'array', items: refSchema(dataSchemaRef.items) };

  return {
    [statusCode]: {
      description,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['success', 'data', 'meta', 'error'],
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: dataSchema,
              meta: { type: 'object', additionalProperties: true },
              error: { nullable: true, type: 'null' },
            },
          },
        },
      },
    },
  };
}

export function paginatedListResponse(itemSchemaRef: string, description: string) {
  return {
    '200': {
      description,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['success', 'data', 'meta', 'error'],
            properties: {
              success: { type: 'boolean', enum: [true] },
              data: { type: 'array', items: refSchema(itemSchemaRef) },
              meta: refSchema('PaginationMeta'),
              error: { nullable: true, type: 'null' },
            },
          },
        },
      },
    },
  };
}

export const standardErrorResponses = {
  '400': { $ref: '#/components/responses/ValidationError' },
  '401': { $ref: '#/components/responses/Unauthenticated' },
  '403': { $ref: '#/components/responses/Forbidden' },
  '404': { $ref: '#/components/responses/NotFound' },
  '409': { $ref: '#/components/responses/Conflict' },
};

export function protectedOperation(
  operation: OpenApiOperation,
  options: { requireAuth?: boolean } = {},
): OpenApiOperation {
  const { requireAuth = true } = options;
  return {
    ...operation,
    ...(requireAuth ? { security: bearerSecurity } : {}),
    responses: {
      ...(operation.responses ?? {}),
      ...standardErrorResponses,
    },
  };
}

export const paginationQueryParams: OpenApiParameter[] = [
  queryParam('page', { type: 'integer', minimum: 1, default: 1 }, 'Page number'),
  queryParam('limit', { type: 'integer', minimum: 1, maximum: 100, default: 20 }, 'Items per page'),
  queryParam(
    'sortOrder',
    { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
    'Sort direction',
  ),
  queryParam('search', { type: 'string' }, 'Free-text search'),
];
