const uuid = { type: 'string', format: 'uuid' };
const dateTime = { type: 'string', format: 'date-time' };
const locationStatus = { type: 'string', enum: ['ACTIVE', 'INACTIVE'] };

export const commonSchemas = {
  ApiErrorEnvelope: {
    type: 'object',
    required: ['success', 'data', 'meta', 'error'],
    properties: {
      success: { type: 'boolean', enum: [false] },
      data: { nullable: true, type: 'null' },
      meta: { type: 'object', additionalProperties: true },
      error: {
        type: 'object',
        required: ['code', 'message', 'details'],
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'array', items: { type: 'object', additionalProperties: true } },
        },
      },
    },
  },

  PaginationMeta: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 20 },
      total: { type: 'integer', example: 42 },
      totalPages: { type: 'integer', example: 3 },
    },
  },

  Company: {
    type: 'object',
    required: ['id', 'name', 'status'],
    properties: {
      id: uuid,
      name: { type: 'string' },
      logoUrl: { type: 'string', nullable: true },
      contactNumber: { type: 'string', nullable: true },
      email: { type: 'string', format: 'email', nullable: true },
      address: { type: 'string', nullable: true },
      status: locationStatus,
    },
  },

  CreateCompanyRequest: {
    type: 'object',
    required: ['name', 'ownerFullName', 'ownerEmail', 'ownerPassword'],
    properties: {
      name: { type: 'string', minLength: 1 },
      logoUrl: { type: 'string', format: 'uri' },
      contactNumber: { type: 'string', minLength: 1 },
      email: { type: 'string', format: 'email' },
      address: { type: 'string', minLength: 1 },
      ownerFullName: { type: 'string', minLength: 1 },
      ownerEmail: { type: 'string', format: 'email' },
      ownerPassword: { type: 'string', minLength: 8 },
    },
  },

  UpdateCompanyRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      name: { type: 'string', minLength: 1 },
      logoUrl: { type: 'string', format: 'uri', nullable: true },
      contactNumber: { type: 'string', minLength: 1, nullable: true },
      email: { type: 'string', format: 'email', nullable: true },
      address: { type: 'string', minLength: 1, nullable: true },
      status: locationStatus,
    },
  },

  LoginRequest: {
    type: 'object',
    required: ['identifier', 'password'],
    properties: {
      identifier: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
    },
  },

  RefreshRequest: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { type: 'string', minLength: 1 },
    },
  },

  ForgotPasswordRequest: {
    type: 'object',
    required: ['identifier'],
    properties: {
      identifier: { type: 'string', format: 'email' },
    },
  },

  AuthUser: {
    type: 'object',
    properties: {
      id: uuid,
      email: { type: 'string', format: 'email' },
      role: { type: 'string', enum: ['OWNER', 'MANAGER', 'EMPLOYEE'] },
    },
  },

  AuthResponse: {
    type: 'object',
    properties: {
      accessToken: { type: 'string' },
      refreshToken: { type: 'string' },
      expiresIn: { type: 'integer' },
      company: { $ref: '#/components/schemas/Company' },
      user: { $ref: '#/components/schemas/AuthUser' },
    },
  },

  CurrentUser: {
    type: 'object',
    properties: {
      id: uuid,
      companyId: uuid,
      employeeId: { ...uuid, nullable: true },
      email: { type: 'string', format: 'email' },
      role: { type: 'string', enum: ['OWNER', 'MANAGER', 'EMPLOYEE'] },
      status: locationStatus,
      lastLoginAt: { ...dateTime, nullable: true },
    },
  },

  Employee: {
    type: 'object',
    required: ['id', 'companyId', 'firstName', 'lastName', 'weeklySalary', 'status'],
    properties: {
      id: uuid,
      companyId: uuid,
      userId: { ...uuid, nullable: true },
      employeeNumber: { type: 'string', nullable: true },
      firstName: { type: 'string' },
      middleName: { type: 'string', nullable: true },
      lastName: { type: 'string' },
      suffix: { type: 'string', nullable: true },
      contactNumber: { type: 'string', nullable: true },
      weeklySalary: { type: 'number', minimum: 0 },
      status: locationStatus,
      createdAt: dateTime,
      updatedAt: dateTime,
      deletedAt: { ...dateTime, nullable: true },
    },
  },

  CreateEmployeeRequest: {
    type: 'object',
    required: ['firstName', 'lastName', 'weeklySalary'],
    properties: {
      userId: uuid,
      employeeNumber: { type: 'string' },
      firstName: { type: 'string', minLength: 1 },
      middleName: { type: 'string' },
      lastName: { type: 'string', minLength: 1 },
      suffix: { type: 'string' },
      contactNumber: { type: 'string' },
      weeklySalary: { type: 'number', minimum: 0 },
      status: locationStatus,
    },
  },

  UpdateEmployeeRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      userId: { ...uuid, nullable: true },
      employeeNumber: { type: 'string', nullable: true },
      firstName: { type: 'string', minLength: 1 },
      middleName: { type: 'string', nullable: true },
      lastName: { type: 'string', minLength: 1 },
      suffix: { type: 'string', nullable: true },
      contactNumber: { type: 'string', nullable: true },
      weeklySalary: { type: 'number', minimum: 0 },
      status: locationStatus,
    },
  },

  LinkEmployeeUserRequest: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: uuid,
    },
  },

  Branch: {
    type: 'object',
    required: ['id', 'companyId', 'name', 'address', 'contactNumber', 'status'],
    properties: {
      id: uuid,
      companyId: uuid,
      name: { type: 'string' },
      address: { type: 'string' },
      contactNumber: { type: 'string' },
      status: locationStatus,
      createdAt: dateTime,
      updatedAt: dateTime,
      deletedAt: { ...dateTime, nullable: true },
      createdByUserId: { ...uuid, nullable: true },
      updatedByUserId: { ...uuid, nullable: true },
    },
  },

  CreateBranchRequest: {
    type: 'object',
    required: ['name', 'address', 'contactNumber'],
    properties: {
      name: { type: 'string', minLength: 1 },
      address: { type: 'string', minLength: 1 },
      contactNumber: { type: 'string', minLength: 1 },
      status: { ...locationStatus, default: 'ACTIVE' },
    },
  },

  UpdateBranchRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      name: { type: 'string', minLength: 1 },
      address: { type: 'string', minLength: 1 },
      contactNumber: { type: 'string', minLength: 1 },
      status: locationStatus,
    },
  },

  Warehouse: {
    type: 'object',
    required: ['id', 'companyId', 'name', 'address', 'contactNumber', 'status'],
    properties: {
      id: uuid,
      companyId: uuid,
      name: { type: 'string' },
      address: { type: 'string' },
      contactNumber: { type: 'string' },
      status: locationStatus,
      createdAt: dateTime,
      updatedAt: dateTime,
      deletedAt: { ...dateTime, nullable: true },
      createdByUserId: { ...uuid, nullable: true },
      updatedByUserId: { ...uuid, nullable: true },
    },
  },

  CreateWarehouseRequest: {
    type: 'object',
    required: ['name', 'address', 'contactNumber'],
    properties: {
      name: { type: 'string', minLength: 1 },
      address: { type: 'string', minLength: 1 },
      contactNumber: { type: 'string', minLength: 1 },
      status: { ...locationStatus, default: 'ACTIVE' },
    },
  },

  UpdateWarehouseRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      name: { type: 'string', minLength: 1 },
      address: { type: 'string', minLength: 1 },
      contactNumber: { type: 'string', minLength: 1 },
      status: locationStatus,
    },
  },

  Vehicle: {
    type: 'object',
    required: ['id', 'companyId', 'plateNumber', 'description', 'status'],
    properties: {
      id: uuid,
      companyId: uuid,
      plateNumber: { type: 'string' },
      description: { type: 'string' },
      status: {
        type: 'string',
        enum: ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'INACTIVE'],
      },
      createdAt: dateTime,
      updatedAt: dateTime,
      deletedAt: { ...dateTime, nullable: true },
      createdByUserId: { ...uuid, nullable: true },
      updatedByUserId: { ...uuid, nullable: true },
    },
  },

  CreateVehicleRequest: {
    type: 'object',
    required: ['plateNumber', 'description'],
    properties: {
      plateNumber: { type: 'string', minLength: 1 },
      description: { type: 'string', minLength: 1 },
      status: {
        type: 'string',
        enum: ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'INACTIVE'],
        default: 'AVAILABLE',
      },
    },
  },

  UpdateVehicleRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      plateNumber: { type: 'string', minLength: 1 },
      description: { type: 'string', minLength: 1 },
      status: {
        type: 'string',
        enum: ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'INACTIVE'],
      },
    },
  },
};
