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
      passwordChangeRequired: { type: 'boolean' },
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
      passwordChangeRequired: { type: 'boolean' },
    },
  },

  ChangePasswordRequest: {
    type: 'object',
    required: ['currentPassword', 'newPassword', 'confirmPassword'],
    properties: {
      currentPassword: { type: 'string', minLength: 1 },
      newPassword: { type: 'string', minLength: 8 },
      confirmPassword: { type: 'string', minLength: 8 },
    },
  },

  ChangePasswordResult: {
    type: 'object',
    required: ['passwordChangeRequired', 'passwordChangedAt'],
    properties: {
      passwordChangeRequired: { type: 'boolean', enum: [false] },
      passwordChangedAt: dateTime,
    },
  },

  PasswordStatus: {
    type: 'object',
    required: ['passwordChangeRequired'],
    properties: {
      passwordChangeRequired: { type: 'boolean' },
      passwordChangedAt: { ...dateTime, nullable: true },
    },
  },

  EmptyObject: {
    type: 'object',
    additionalProperties: false,
  },

  ResetEmployeePasswordResult: {
    type: 'object',
    required: ['employeeId', 'userId', 'passwordChangeRequired', 'temporaryPassword'],
    properties: {
      employeeId: uuid,
      userId: uuid,
      passwordChangeRequired: { type: 'boolean', enum: [true] },
      temporaryPassword: {
        type: 'string',
        description:
          'System-generated temporary password returned only once. Not recoverable afterward.',
      },
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
      linkedUser: {
        nullable: true,
        allOf: [{ $ref: '#/components/schemas/LinkedUserSummary' }],
      },
    },
  },

  LinkedUserSummary: {
    type: 'object',
    required: ['id', 'email', 'role', 'status'],
    properties: {
      id: uuid,
      email: { type: 'string', format: 'email' },
      role: { type: 'string', enum: ['OWNER', 'MANAGER', 'EMPLOYEE'] },
      status: locationStatus,
    },
  },

  EmployeeAccountCredentials: {
    type: 'object',
    required: ['email', 'password', 'confirmPassword', 'role'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
      confirmPassword: { type: 'string', minLength: 8 },
      role: { type: 'string', enum: ['OWNER', 'MANAGER', 'EMPLOYEE'] },
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
      createAccount: { type: 'boolean', default: false },
      account: { $ref: '#/components/schemas/EmployeeAccountCredentials' },
    },
  },

  GrantSystemAccessRequest: {
    $ref: '#/components/schemas/EmployeeAccountCredentials',
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

  CashAdvance: {
    type: 'object',
    required: [
      'id',
      'companyId',
      'employeeId',
      'amount',
      'deductedAmount',
      'remainingAmount',
      'status',
      'issuedAt',
      'createdAt',
      'updatedAt',
    ],
    properties: {
      id: uuid,
      companyId: uuid,
      employeeId: uuid,
      amount: { type: 'number', format: 'decimal' },
      deductedAmount: { type: 'number', format: 'decimal' },
      remainingAmount: { type: 'number', format: 'decimal' },
      status: { type: 'string', enum: ['OUTSTANDING', 'SETTLED'] },
      reason: { type: 'string', nullable: true },
      issuedAt: {
        ...dateTime,
        description: 'Business issue date chosen by the issuer (defaults to create time)',
      },
      createdAt: dateTime,
      updatedAt: dateTime,
    },
  },

  CreateCashAdvanceRequest: {
    type: 'object',
    required: ['employeeId', 'amount'],
    properties: {
      employeeId: uuid,
      amount: { type: 'number', format: 'decimal', minimum: 0.01 },
      reason: { type: 'string', maxLength: 500 },
      issuedAt: {
        ...dateTime,
        description: 'Optional issue date; defaults to server time when omitted',
      },
    },
  },

  LeaveRecord: {
    type: 'object',
    required: ['id', 'companyId', 'employeeId', 'leaveType', 'leaveDate', 'status'],
    properties: {
      id: uuid,
      companyId: uuid,
      employeeId: uuid,
      leaveType: { type: 'string', enum: ['HALF_DAY', 'FULL_DAY'] },
      leaveDate: { type: 'string', format: 'date' },
      status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] },
      reason: { type: 'string', nullable: true },
      managerNote: { type: 'string', nullable: true },
      createdAt: dateTime,
      updatedAt: dateTime,
    },
  },

  CompanyLeaveRecord: {
    allOf: [
      { $ref: '#/components/schemas/LeaveRecord' },
      {
        type: 'object',
        required: ['firstName', 'lastName', 'employeeNumber'],
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          employeeNumber: { type: 'string', nullable: true },
        },
      },
    ],
  },

  RequestLeaveBody: {
    type: 'object',
    required: ['leaveType', 'leaveDate'],
    properties: {
      leaveType: { type: 'string', enum: ['HALF_DAY', 'FULL_DAY'] },
      leaveDate: { type: 'string', format: 'date' },
      reason: { type: 'string', maxLength: 500 },
      employeeId: {
        type: 'string',
        format: 'uuid',
        description:
          'Target employee. Required for owners; optional for managers creating on behalf.',
      },
    },
  },

  ManageLeaveRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] },
      managerNote: { type: 'string', maxLength: 1000 },
      leaveType: { type: 'string', enum: ['HALF_DAY', 'FULL_DAY'] },
      leaveDate: { type: 'string', format: 'date' },
      reason: { type: 'string', maxLength: 500, nullable: true },
    },
  },

  PayrollRecord: {
    type: 'object',
    required: [
      'id',
      'companyId',
      'employeeId',
      'payPeriodStart',
      'payPeriodEnd',
      'grossSalary',
      'cashAdvanceDeductions',
      'netPay',
      'status',
      'createdAt',
      'updatedAt',
    ],
    properties: {
      id: uuid,
      companyId: uuid,
      employeeId: uuid,
      payPeriodStart: { type: 'string', format: 'date' },
      payPeriodEnd: { type: 'string', format: 'date' },
      grossSalary: { type: 'number', format: 'decimal' },
      cashAdvanceDeductions: { type: 'number', format: 'decimal' },
      netPay: { type: 'number', format: 'decimal' },
      status: { type: 'string', enum: ['PAYABLE', 'PAID'] },
      paidAt: { ...dateTime, nullable: true },
      paymentReference: { type: 'string', nullable: true },
      createdAt: dateTime,
      updatedAt: dateTime,
    },
  },

  GeneratePayrollRequest: {
    type: 'object',
    required: ['payPeriodStart', 'payPeriodEnd'],
    properties: {
      payPeriodStart: { type: 'string', format: 'date' },
      payPeriodEnd: { type: 'string', format: 'date' },
      employeeIds: { type: 'array', items: uuid },
    },
  },

  GeneratePayrollResponse: {
    type: 'object',
    required: ['payPeriodStart', 'payPeriodEnd', 'items'],
    properties: {
      payPeriodStart: { type: 'string', format: 'date' },
      payPeriodEnd: { type: 'string', format: 'date' },
      items: { type: 'array', items: { $ref: '#/components/schemas/PayrollRecord' } },
    },
  },

  MarkPayrollPaidRequest: {
    type: 'object',
    properties: {
      paymentReference: { type: 'string', maxLength: 200 },
    },
  },

  AttendanceSession: {
    type: 'object',
    required: ['id', 'companyId', 'employeeId', 'status', 'timeInAt'],
    properties: {
      id: uuid,
      companyId: uuid,
      employeeId: uuid,
      status: { type: 'string', enum: ['OPEN', 'CLOSED'] },
      timeInAt: dateTime,
      timeOutAt: { ...dateTime, nullable: true },
      note: { type: 'string', nullable: true },
      correctionNote: { type: 'string', nullable: true },
      adjustedTimeInAt: { ...dateTime, nullable: true },
      adjustedTimeOutAt: { ...dateTime, nullable: true },
      createdAt: dateTime,
      updatedAt: dateTime,
    },
  },

  CompanyAttendanceSession: {
    allOf: [
      { $ref: '#/components/schemas/AttendanceSession' },
      {
        type: 'object',
        required: ['firstName', 'lastName', 'employeeNumber'],
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          employeeNumber: { type: 'string', nullable: true },
        },
      },
    ],
  },

  AttendanceStatus: {
    type: 'object',
    required: ['isTimedIn'],
    properties: {
      isTimedIn: { type: 'boolean' },
      openSession: { ...{ $ref: '#/components/schemas/AttendanceSession' }, nullable: true },
    },
  },

  TimeInRequest: {
    type: 'object',
    properties: {
      note: { type: 'string', maxLength: 500 },
    },
  },

  TimeOutRequest: {
    type: 'object',
    properties: {
      note: { type: 'string', maxLength: 500 },
    },
  },

  AttendanceDashboard: {
    type: 'object',
    required: ['date', 'summary', 'employees'],
    properties: {
      date: { type: 'string', format: 'date' },
      summary: {
        type: 'object',
        properties: {
          totalEmployees: { type: 'integer' },
          present: { type: 'integer' },
          late: { type: 'integer' },
          absent: { type: 'integer' },
          onLeave: { type: 'integer' },
          timedIn: { type: 'integer' },
        },
      },
      employees: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            employeeId: uuid,
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            employeeNumber: { type: 'string', nullable: true },
            status: {
              type: 'string',
              enum: ['ABSENT', 'ON_TIME', 'LATE', 'TIMED_OUT', 'ON_LEAVE'],
            },
            isTimedIn: { type: 'boolean' },
            isLate: { type: 'boolean' },
            isAbsent: { type: 'boolean' },
            onLeave: { type: 'boolean' },
            timeInToday: { ...dateTime, nullable: true },
            timeOutToday: { ...dateTime, nullable: true },
            openSession: { ...{ $ref: '#/components/schemas/AttendanceSession' }, nullable: true },
            leaveToday: { ...{ $ref: '#/components/schemas/LeaveRecord' }, nullable: true },
          },
        },
      },
    },
  },

  LeaveDashboard: {
    type: 'object',
    required: ['date', 'summary', 'employees'],
    properties: {
      date: { type: 'string', format: 'date' },
      summary: {
        type: 'object',
        properties: {
          totalEmployees: { type: 'integer' },
          pendingRequests: { type: 'integer' },
          onLeaveToday: { type: 'integer' },
          approvedThisWeek: { type: 'integer' },
        },
      },
      employees: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            employeeId: uuid,
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            employeeNumber: { type: 'string', nullable: true },
            pendingRequests: { type: 'integer' },
            onLeaveToday: { type: 'boolean' },
            todayLeave: { ...{ $ref: '#/components/schemas/LeaveRecord' }, nullable: true },
            pendingLeave: {
              type: 'array',
              items: { $ref: '#/components/schemas/LeaveRecord' },
            },
          },
        },
      },
    },
  },

  WorkforceDashboard: {
    type: 'object',
    required: ['attendanceStatus', 'visibility'],
    properties: {
      attendanceStatus: { $ref: '#/components/schemas/AttendanceStatus' },
      attendanceSummary: {
        type: 'array',
        items: { $ref: '#/components/schemas/AttendanceSession' },
      },
      leaveSummary: { type: 'array', items: { $ref: '#/components/schemas/LeaveRecord' } },
      cashAdvanceSummary: { type: 'object' },
      payrollSummary: { type: 'array', items: { $ref: '#/components/schemas/PayrollRecord' } },
      tripsSummary: { type: 'array', items: { type: 'object' } },
      transactionsSummary: { type: 'array', items: { type: 'object' } },
      visibility: {
        type: 'object',
        properties: {
          canTimeIn: { type: 'boolean' },
          canTimeOut: { type: 'boolean' },
          canCreateTransaction: { type: 'boolean' },
          canCreateExpense: { type: 'boolean' },
        },
      },
    },
  },

  TransactionItem: {
    type: 'object',
    required: ['id', 'transactionId', 'materialName', 'weight', 'unit', 'price', 'total'],
    properties: {
      id: uuid,
      transactionId: uuid,
      materialName: { type: 'string' },
      weight: { type: 'number' },
      unit: { type: 'string', enum: ['KG', 'G', 'TON', 'LB', 'PIECE', 'BUNDLE', 'SACK'] },
      price: { type: 'number' },
      total: { type: 'number' },
      notes: { type: 'string', nullable: true },
      createdAt: dateTime,
      updatedAt: dateTime,
    },
  },

  TransactionAttachment: {
    type: 'object',
    required: [
      'id',
      'transactionId',
      'attachmentType',
      'fileName',
      'filePath',
      'mimeType',
      'fileSize',
      'uploadedByUserId',
      'downloadUrl',
    ],
    properties: {
      id: uuid,
      transactionId: uuid,
      attachmentType: { type: 'string', enum: ['PHOTO'] },
      fileName: { type: 'string' },
      filePath: { type: 'string' },
      mimeType: { type: 'string' },
      fileSize: { type: 'integer' },
      uploadedByUserId: uuid,
      downloadUrl: {
        type: 'string',
        description: 'Authenticated API path to download the attachment content',
      },
      createdAt: dateTime,
    },
  },

  TransactionSummary: {
    type: 'object',
    required: ['id', 'companyId', 'direction', 'status', 'partyName', 'transactionDate'],
    properties: {
      id: uuid,
      companyId: uuid,
      createdByUserId: uuid,
      updatedByUserId: { ...uuid, nullable: true },
      transactionNumber: { type: 'string' },
      direction: { type: 'string', enum: ['INBOUND', 'OUTBOUND'] },
      directionLabel: { type: 'string', enum: ['BUY', 'SELL'] },
      status: { type: 'string', enum: ['DRAFT', 'READY_FOR_PAYMENT', 'PAID', 'CANCELLED'] },
      partyName: { type: 'string' },
      partyContactNumber: { type: 'string', nullable: true },
      transactionDate: dateTime,
      locationType: { type: 'string', enum: ['BRANCH', 'WAREHOUSE', 'OUTSIDE', 'TRIP'] },
      branchId: { ...uuid, nullable: true },
      warehouseId: { ...uuid, nullable: true },
      outsideLocationName: { type: 'string', nullable: true },
      outsideAddress: { type: 'string', nullable: true },
      tripId: { ...uuid, nullable: true },
      notes: { type: 'string', nullable: true },
      itemCount: { type: 'integer' },
      totalAmount: { type: 'number' },
      assignedEmployeeIds: { type: 'array', items: uuid },
      submittedAt: { ...dateTime, nullable: true },
      submittedByUserId: { ...uuid, nullable: true },
      paidAt: { ...dateTime, nullable: true },
      paidByUserId: { ...uuid, nullable: true },
      cancellationReason: { type: 'string', nullable: true },
      cancelledAt: { ...dateTime, nullable: true },
      cancelledByUserId: { ...uuid, nullable: true },
      reopenedAt: { ...dateTime, nullable: true },
      reopenedByUserId: { ...uuid, nullable: true },
      reopenReason: { type: 'string', nullable: true },
      createdAt: dateTime,
      updatedAt: dateTime,
      deletedAt: { ...dateTime, nullable: true },
    },
  },

  TransactionDetail: {
    allOf: [
      { $ref: '#/components/schemas/TransactionSummary' },
      {
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/TransactionItem' } },
          attachments: {
            type: 'array',
            items: { $ref: '#/components/schemas/TransactionAttachment' },
          },
          assignments: {
            type: 'array',
            items: {
              type: 'object',
              properties: { employeeId: uuid, assignedAt: dateTime },
            },
          },
        },
      },
    ],
  },

  CreateTransactionRequest: {
    type: 'object',
    required: ['direction', 'partyName', 'locationType', 'assignedEmployeeIds'],
    properties: {
      direction: { type: 'string', enum: ['INBOUND', 'OUTBOUND', 'BUY', 'SELL'] },
      partyName: { type: 'string', minLength: 1 },
      partyContactNumber: { type: 'string' },
      transactionDate: dateTime,
      locationType: { type: 'string', enum: ['BRANCH', 'WAREHOUSE', 'OUTSIDE', 'TRIP'] },
      branchId: uuid,
      warehouseId: uuid,
      outsideLocationName: { type: 'string' },
      outsideAddress: { type: 'string' },
      tripId: uuid,
      notes: { type: 'string' },
      assignedEmployeeIds: { type: 'array', items: uuid, minItems: 1 },
      items: {
        type: 'array',
        description:
          'Optional on draft create; may be empty. At least one item is required before finish.',
        default: [],
        items: { $ref: '#/components/schemas/CreateTransactionItemRequest' },
      },
    },
  },

  UpdateTransactionRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      direction: { type: 'string', enum: ['INBOUND', 'OUTBOUND', 'BUY', 'SELL'] },
      partyName: { type: 'string', minLength: 1 },
      partyContactNumber: { type: 'string', nullable: true },
      transactionDate: dateTime,
      locationType: { type: 'string', enum: ['BRANCH', 'WAREHOUSE', 'OUTSIDE', 'TRIP'] },
      branchId: { ...uuid, nullable: true },
      warehouseId: { ...uuid, nullable: true },
      outsideLocationName: { type: 'string', nullable: true },
      outsideAddress: { type: 'string', nullable: true },
      tripId: { ...uuid, nullable: true },
      notes: { type: 'string', nullable: true },
      assignedEmployeeIds: { type: 'array', items: uuid, minItems: 1 },
    },
  },

  CreateTransactionItemRequest: {
    type: 'object',
    required: ['materialName', 'weight', 'unit', 'price'],
    properties: {
      materialName: { type: 'string', minLength: 1 },
      weight: { type: 'number', exclusiveMinimum: 0 },
      unit: { type: 'string', enum: ['KG', 'G', 'TON', 'LB', 'PIECE', 'BUNDLE', 'SACK'] },
      price: { type: 'number', minimum: 0 },
      total: { type: 'number', minimum: 0 },
      notes: { type: 'string' },
    },
  },

  UpdateTransactionItemRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      materialName: { type: 'string', minLength: 1 },
      weight: { type: 'number', exclusiveMinimum: 0 },
      unit: { type: 'string', enum: ['KG', 'G', 'TON', 'LB', 'PIECE', 'BUNDLE', 'SACK'] },
      price: { type: 'number', minimum: 0 },
      total: { type: 'number', minimum: 0 },
      notes: { type: 'string', nullable: true },
    },
  },

  CancelTransactionRequest: {
    type: 'object',
    properties: {
      cancellationReason: { type: 'string', maxLength: 500 },
    },
  },

  ReturnToDraftRequest: {
    type: 'object',
    properties: {
      reason: { type: 'string', maxLength: 500 },
    },
  },

  SettleTransactionRequest: {
    type: 'object',
    properties: {
      settlementNote: { type: 'string', maxLength: 500 },
    },
  },

  ReopenTransactionRequest: {
    type: 'object',
    required: ['reason'],
    properties: {
      reason: { type: 'string', minLength: 1, maxLength: 1000 },
    },
  },

  MaterialSuggestion: {
    type: 'object',
    required: ['materialName', 'lastUsedAt', 'usageCount'],
    properties: {
      materialName: { type: 'string' },
      lastUsedAt: dateTime,
      usageCount: { type: 'integer' },
    },
  },

  PriceSuggestion: {
    type: 'object',
    required: ['price', 'lastUsedAt'],
    properties: {
      price: { type: 'number' },
      lastUsedAt: dateTime,
    },
  },

  DeletionResult: {
    type: 'object',
    required: ['deleted'],
    properties: {
      deleted: { type: 'boolean', enum: [true] },
    },
  },

  ReceiptCompany: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' },
      contactNumber: { type: 'string', nullable: true },
      email: { type: 'string', nullable: true },
      address: { type: 'string', nullable: true },
    },
  },

  ReceiptItem: {
    type: 'object',
    required: ['id', 'transactionId', 'materialName', 'weight', 'unit', 'price', 'total'],
    properties: {
      id: uuid,
      transactionId: uuid,
      materialName: { type: 'string' },
      weight: { type: 'number' },
      unit: { type: 'string', enum: ['KG', 'G', 'TON', 'LB', 'PIECE', 'BUNDLE', 'SACK'] },
      price: { type: 'number' },
      total: { type: 'number' },
      notes: { type: 'string', nullable: true },
      createdAt: dateTime,
      updatedAt: dateTime,
    },
  },

  Receipt: {
    type: 'object',
    required: [
      'transactionNumber',
      'company',
      'direction',
      'directionLabel',
      'partyName',
      'transactionDate',
      'items',
      'grandTotal',
      'paidByDisplayName',
      'paidAt',
    ],
    properties: {
      transactionNumber: { type: 'string' },
      company: { $ref: '#/components/schemas/ReceiptCompany' },
      direction: { type: 'string', enum: ['INBOUND', 'OUTBOUND'] },
      directionLabel: { type: 'string', enum: ['BUY', 'SELL'] },
      partyName: { type: 'string' },
      transactionDate: dateTime,
      items: { type: 'array', items: { $ref: '#/components/schemas/ReceiptItem' } },
      grandTotal: { type: 'number' },
      paidByDisplayName: { type: 'string' },
      paidAt: dateTime,
    },
  },
  TripStatus: {
    type: 'string',
    enum: ['DRAFT', 'STARTED', 'COMPLETED', 'CANCELLED'],
  },
  TripMemberRole: {
    type: 'string',
    enum: ['DRIVER', 'HELPER', 'BUYER', 'SUPERVISOR'],
  },
  TripNumber: {
    type: 'string',
    pattern: '^TRIP-\\d{8}-\\d{6}$',
    example: 'TRIP-20260708-000001',
  },
  VehicleSummary: {
    type: 'object',
    required: ['id', 'plateNumber', 'status'],
    properties: {
      id: uuid,
      plateNumber: { type: 'string' },
      description: { type: 'string', nullable: true },
      status: { type: 'string', enum: ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'INACTIVE'] },
    },
  },
  TripMember: {
    type: 'object',
    required: ['id', 'tripId', 'employeeId', 'role'],
    properties: {
      id: uuid,
      tripId: uuid,
      employeeId: uuid,
      role: { $ref: '#/components/schemas/TripMemberRole' },
      createdAt: dateTime,
      updatedAt: dateTime,
    },
  },
  TripDashboard: {
    type: 'object',
    required: ['draftCount', 'scheduledCount', 'startedCount', 'completedCount', 'cancelledCount'],
    properties: {
      draftCount: { type: 'integer', example: 3 },
      scheduledCount: { type: 'integer', example: 2 },
      startedCount: { type: 'integer', example: 1 },
      completedCount: { type: 'integer', example: 10 },
      cancelledCount: { type: 'integer', example: 0 },
    },
  },
  TripSummary: {
    type: 'object',
    required: [
      'id',
      'companyId',
      'tripNumber',
      'status',
      'scheduledStart',
      'vehicle',
      'origin',
      'destination',
    ],
    properties: {
      id: uuid,
      companyId: uuid,
      tripNumber: { $ref: '#/components/schemas/TripNumber' },
      vehicle: { $ref: '#/components/schemas/VehicleSummary' },
      status: { $ref: '#/components/schemas/TripStatus' },
      scheduledStart: { type: 'string', format: 'date-time' },
      actualStart: { ...dateTime, nullable: true },
      actualEnd: { ...dateTime, nullable: true },
      origin: { type: 'string' },
      destination: { type: 'string' },
      notes: { type: 'string', nullable: true },
    },
  },
  TripDetail: {
    allOf: [{ $ref: '#/components/schemas/TripSummary' }],
    type: 'object',
    required: ['members'],
    properties: {
      members: { type: 'array', items: { $ref: '#/components/schemas/TripMember' } },
    },
  },
  TripHistoryEvent: {
    type: 'object',
    required: ['action', 'occurredAt', 'actorUserId', 'note'],
    properties: {
      action: {
        type: 'string',
        enum: ['CREATED', 'STARTED', 'COMPLETED', 'CANCELLED', 'ARCHIVED'],
      },
      occurredAt: { type: 'string', format: 'date-time' },
      actorUserId: { ...uuid, nullable: true },
      note: { type: 'string', nullable: true },
    },
  },
  TripHistory: {
    type: 'object',
    required: ['tripId', 'events'],
    properties: {
      tripId: uuid,
      events: { type: 'array', items: { $ref: '#/components/schemas/TripHistoryEvent' } },
    },
  },
  CreateTripRequest: {
    type: 'object',
    required: ['vehicleId', 'scheduledStart', 'origin', 'destination'],
    properties: {
      vehicleId: uuid,
      scheduledStart: { type: 'string', format: 'date-time' },
      origin: { type: 'string', minLength: 1, maxLength: 500 },
      destination: { type: 'string', minLength: 1, maxLength: 500 },
      notes: { type: 'string', maxLength: 2000, nullable: true },
      members: {
        type: 'array',
        items: { $ref: '#/components/schemas/TripMemberCreate' },
      },
    },
  },
  TripMemberCreate: {
    type: 'object',
    required: ['employeeId', 'role'],
    properties: {
      employeeId: uuid,
      role: { $ref: '#/components/schemas/TripMemberRole' },
    },
  },
  UpdateTripRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      vehicleId: uuid,
      scheduledStart: { type: 'string', format: 'date-time' },
      origin: { type: 'string', minLength: 1, maxLength: 500 },
      destination: { type: 'string', minLength: 1, maxLength: 500 },
      notes: { type: 'string', maxLength: 2000, nullable: true },
    },
  },
  ArchiveTripRequest: {
    type: 'object',
    properties: {
      reason: { type: 'string', maxLength: 500, nullable: true },
    },
  },
  StartTripRequest: {
    type: 'object',
    properties: {
      note: { type: 'string', maxLength: 500 },
    },
  },
  CompleteTripRequest: {
    type: 'object',
    properties: {
      note: { type: 'string', maxLength: 500 },
    },
  },
  CancelTripRequest: {
    type: 'object',
    required: ['reason'],
    properties: {
      reason: { type: 'string', minLength: 1, maxLength: 1000 },
    },
  },
  AddTripMemberRequest: {
    type: 'object',
    required: ['employeeId', 'role'],
    properties: {
      employeeId: uuid,
      role: { $ref: '#/components/schemas/TripMemberRole' },
    },
  },
  UpdateTripMemberRequest: {
    type: 'object',
    required: ['role'],
    properties: {
      role: { $ref: '#/components/schemas/TripMemberRole' },
    },
  },

  ExpenseStatus: {
    type: 'string',
    enum: ['DRAFT', 'RECORDED', 'CANCELLED'],
  },
  ExpenseContextType: {
    type: 'string',
    enum: ['COMPANY', 'BRANCH', 'WAREHOUSE', 'VEHICLE', 'TRIP'],
  },
  ExpenseAttachmentType: {
    type: 'string',
    enum: ['PHOTO'],
  },
  ExpenseNumber: {
    type: 'string',
    pattern: '^EXP-\\d{8}-\\d{6}$',
    example: 'EXP-20260709-000001',
  },
  ExpenseCategoryList: {
    type: 'array',
    description:
      'Ordered expense category names for the company catalog plus any additional values used on expenses',
    items: { type: 'string' },
    example: [
      'Fuel',
      'Maintenance',
      'Supplies',
      'Travel',
      'Meals',
      'Utilities',
      'Rent',
      'Salaries',
      'Other',
    ],
  },
  ExpenseAttachment: {
    type: 'object',
    required: [
      'id',
      'expenseId',
      'attachmentType',
      'fileName',
      'mimeType',
      'fileSize',
      'downloadUrl',
      'createdAt',
    ],
    properties: {
      id: uuid,
      expenseId: uuid,
      attachmentType: { $ref: '#/components/schemas/ExpenseAttachmentType' },
      fileName: { type: 'string' },
      mimeType: { type: 'string' },
      fileSize: { type: 'integer' },
      uploadedByUserId: uuid,
      downloadUrl: {
        type: 'string',
        description: 'Authenticated API path to download the attachment content',
      },
      createdAt: dateTime,
    },
  },
  ExpenseSummary: {
    type: 'object',
    required: [
      'id',
      'companyId',
      'expenseNumber',
      'expenseDate',
      'category',
      'amount',
      'description',
      'status',
      'contextType',
    ],
    properties: {
      id: uuid,
      companyId: uuid,
      expenseNumber: { $ref: '#/components/schemas/ExpenseNumber' },
      expenseDate: dateTime,
      category: { type: 'string' },
      amount: { type: 'number' },
      description: { type: 'string' },
      status: { $ref: '#/components/schemas/ExpenseStatus' },
      contextType: { $ref: '#/components/schemas/ExpenseContextType' },
      branchId: { ...uuid, nullable: true },
      warehouseId: { ...uuid, nullable: true },
      vehicleId: { ...uuid, nullable: true },
      tripId: { ...uuid, nullable: true },
      attachmentCount: { type: 'integer' },
      createdByEmployeeId: { ...uuid, nullable: true },
      createdAt: dateTime,
    },
  },
  ExpenseDetail: {
    allOf: [{ $ref: '#/components/schemas/ExpenseSummary' }],
    type: 'object',
    properties: {
      recordedAt: { ...dateTime, nullable: true },
      cancelledAt: { ...dateTime, nullable: true },
      cancellationReason: { type: 'string', nullable: true },
      attachments: {
        type: 'array',
        items: { $ref: '#/components/schemas/ExpenseAttachment' },
      },
      updatedAt: dateTime,
    },
  },
  CreateExpenseRequest: {
    type: 'object',
    required: ['expenseDate', 'category', 'amount', 'description', 'contextType'],
    properties: {
      expenseDate: dateTime,
      category: { type: 'string', maxLength: 200 },
      amount: { type: 'number', exclusiveMinimum: 0 },
      description: { type: 'string', maxLength: 2000 },
      contextType: { $ref: '#/components/schemas/ExpenseContextType' },
      branchId: uuid,
      warehouseId: uuid,
      vehicleId: uuid,
      tripId: uuid,
      recordImmediately: { type: 'boolean' },
    },
  },
  UpdateExpenseRequest: {
    type: 'object',
    properties: {
      expenseDate: dateTime,
      category: { type: 'string', maxLength: 200 },
      amount: { type: 'number', exclusiveMinimum: 0 },
      description: { type: 'string', maxLength: 2000 },
      contextType: { $ref: '#/components/schemas/ExpenseContextType' },
      branchId: { ...uuid, nullable: true },
      warehouseId: { ...uuid, nullable: true },
      vehicleId: { ...uuid, nullable: true },
      tripId: { ...uuid, nullable: true },
    },
  },
  RecordExpenseRequest: {
    type: 'object',
    properties: {
      note: { type: 'string', maxLength: 500 },
    },
  },
  CancelExpenseRequest: {
    type: 'object',
    required: ['reason'],
    properties: {
      reason: { type: 'string', maxLength: 500 },
    },
  },
  ArchiveExpenseRequest: {
    type: 'object',
    properties: {
      reason: { type: 'string', maxLength: 500 },
    },
  },

  AppliedAnalyticsFilters: {
    type: 'object',
    required: ['period', 'from', 'to', 'includeArchived'],
    properties: {
      period: {
        type: 'string',
        enum: ['TODAY', 'YESTERDAY', 'THIS_WEEK', 'THIS_MONTH', 'THIS_YEAR', 'CUSTOM'],
      },
      from: dateTime,
      to: dateTime,
      branchId: { ...uuid, nullable: true },
      warehouseId: { ...uuid, nullable: true },
      vehicleId: { ...uuid, nullable: true },
      employeeId: { ...uuid, nullable: true },
      includeArchived: { type: 'boolean' },
    },
  },
  RankedMetricItem: {
    type: 'object',
    required: ['label', 'value', 'rank'],
    properties: {
      id: { ...uuid, nullable: true },
      label: { type: 'string' },
      value: { type: 'number' },
      unit: { type: 'string', nullable: true },
      rank: { type: 'integer' },
    },
  },
  CompanyAnalytics: {
    type: 'object',
    required: [
      'totalInboundTransactions',
      'totalOutboundTransactions',
      'totalTransactionAmount',
      'totalExpenses',
      'totalPayroll',
      'netOperationalAmount',
      'activeEmployees',
      'activeTrips',
      'activeVehicles',
      'appliedFilters',
      'generatedAt',
    ],
    properties: {
      totalInboundTransactions: { type: 'integer' },
      totalOutboundTransactions: { type: 'integer' },
      totalTransactionAmount: { type: 'number' },
      totalExpenses: { type: 'number' },
      totalPayroll: { type: 'number' },
      netOperationalAmount: { type: 'number' },
      activeEmployees: { type: 'integer' },
      activeTrips: { type: 'integer' },
      activeVehicles: { type: 'integer' },
      appliedFilters: { $ref: '#/components/schemas/AppliedAnalyticsFilters' },
      generatedAt: dateTime,
    },
  },
  TransactionAnalytics: {
    type: 'object',
    required: [
      'totalInbound',
      'totalOutbound',
      'totalTransactionAmount',
      'transactionCount',
      'averageTransactionValue',
      'topMaterials',
      'mostActiveEmployees',
      'mostActiveBranches',
      'mostActiveWarehouses',
      'appliedFilters',
      'generatedAt',
    ],
    properties: {
      totalInbound: { type: 'integer' },
      totalOutbound: { type: 'integer' },
      totalTransactionAmount: { type: 'number' },
      transactionCount: { type: 'integer' },
      averageTransactionValue: { type: 'number' },
      topMaterials: { type: 'array', items: { $ref: '#/components/schemas/RankedMetricItem' } },
      mostActiveEmployees: {
        type: 'array',
        items: { $ref: '#/components/schemas/RankedMetricItem' },
      },
      mostActiveBranches: {
        type: 'array',
        items: { $ref: '#/components/schemas/RankedMetricItem' },
      },
      mostActiveWarehouses: {
        type: 'array',
        items: { $ref: '#/components/schemas/RankedMetricItem' },
      },
      appliedFilters: { $ref: '#/components/schemas/AppliedAnalyticsFilters' },
      generatedAt: dateTime,
    },
  },
  TripAnalytics: {
    type: 'object',
    required: [
      'totalTrips',
      'activeTrips',
      'completedTrips',
      'cancelledTrips',
      'averageTripDurationMinutes',
      'vehicleUtilization',
      'mostActiveVehicles',
      'mostActiveDrivers',
      'appliedFilters',
      'generatedAt',
    ],
    properties: {
      totalTrips: { type: 'integer' },
      activeTrips: { type: 'integer' },
      completedTrips: { type: 'integer' },
      cancelledTrips: { type: 'integer' },
      averageTripDurationMinutes: { type: 'number' },
      vehicleUtilization: { type: 'array', items: { type: 'object' } },
      mostActiveVehicles: {
        type: 'array',
        items: { $ref: '#/components/schemas/RankedMetricItem' },
      },
      mostActiveDrivers: {
        type: 'array',
        items: { $ref: '#/components/schemas/RankedMetricItem' },
      },
      appliedFilters: { $ref: '#/components/schemas/AppliedAnalyticsFilters' },
      generatedAt: dateTime,
    },
  },
  ExpenseAnalytics: {
    type: 'object',
    required: [
      'totalExpenses',
      'expensesByCategory',
      'expensesByBranch',
      'expensesByWarehouse',
      'expensesByVehicle',
      'expensesByTrip',
      'monthlyExpenseTrend',
      'appliedFilters',
      'generatedAt',
    ],
    properties: {
      totalExpenses: { type: 'number' },
      expensesByCategory: {
        type: 'array',
        items: { $ref: '#/components/schemas/RankedMetricItem' },
      },
      expensesByBranch: { type: 'array', items: { $ref: '#/components/schemas/RankedMetricItem' } },
      expensesByWarehouse: {
        type: 'array',
        items: { $ref: '#/components/schemas/RankedMetricItem' },
      },
      expensesByVehicle: {
        type: 'array',
        items: { $ref: '#/components/schemas/RankedMetricItem' },
      },
      expensesByTrip: { type: 'array', items: { $ref: '#/components/schemas/RankedMetricItem' } },
      monthlyExpenseTrend: { type: 'array', items: { type: 'object' } },
      appliedFilters: { $ref: '#/components/schemas/AppliedAnalyticsFilters' },
      generatedAt: dateTime,
    },
  },
  WorkforceAnalytics: {
    type: 'object',
    required: [
      'attendanceSummary',
      'payrollSummary',
      'leaveSummary',
      'cashAdvanceSummary',
      'employeeActivity',
      'mostActiveEmployees',
      'appliedFilters',
      'generatedAt',
    ],
    properties: {
      attendanceSummary: { type: 'object' },
      payrollSummary: { type: 'object' },
      leaveSummary: { type: 'object' },
      cashAdvanceSummary: { type: 'object' },
      employeeActivity: { type: 'array', items: { type: 'object' } },
      mostActiveEmployees: {
        type: 'array',
        items: { $ref: '#/components/schemas/RankedMetricItem' },
      },
      appliedFilters: { $ref: '#/components/schemas/AppliedAnalyticsFilters' },
      generatedAt: dateTime,
    },
  },
  OrganizationAnalytics: {
    type: 'object',
    required: [
      'branchPerformance',
      'warehousePerformance',
      'vehicleUtilization',
      'appliedFilters',
      'generatedAt',
    ],
    properties: {
      branchPerformance: { type: 'array', items: { type: 'object' } },
      warehousePerformance: { type: 'array', items: { type: 'object' } },
      vehicleUtilization: { type: 'array', items: { type: 'object' } },
      appliedFilters: { $ref: '#/components/schemas/AppliedAnalyticsFilters' },
      generatedAt: dateTime,
    },
  },

  AppliedReportCriteria: {
    type: 'object',
    required: ['includeArchived', 'sortBy', 'sortOrder'],
    properties: {
      from: { ...dateTime, nullable: true },
      to: { ...dateTime, nullable: true },
      branchId: { ...uuid, nullable: true },
      warehouseId: { ...uuid, nullable: true },
      vehicleId: { ...uuid, nullable: true },
      employeeId: { ...uuid, nullable: true },
      tripId: { ...uuid, nullable: true },
      transactionNumber: { type: 'string', nullable: true },
      direction: { type: 'string', nullable: true },
      status: { type: 'string', nullable: true },
      category: { type: 'string', nullable: true },
      referenceType: { type: 'string', nullable: true },
      search: { type: 'string', nullable: true },
      sortBy: { type: 'string' },
      sortOrder: { type: 'string', enum: ['asc', 'desc'] },
      includeArchived: { type: 'boolean' },
    },
  },

  ReportListEnvelope: {
    type: 'object',
    required: ['items', 'appliedCriteria', 'generatedAt'],
    properties: {
      items: { type: 'array', items: { type: 'object' } },
      appliedCriteria: { $ref: '#/components/schemas/AppliedReportCriteria' },
      generatedAt: dateTime,
    },
  },

  TransactionReportList: { $ref: '#/components/schemas/ReportListEnvelope' },
  TripReportList: { $ref: '#/components/schemas/ReportListEnvelope' },
  ExpenseReportList: { $ref: '#/components/schemas/ReportListEnvelope' },
  AttendanceReportList: { $ref: '#/components/schemas/ReportListEnvelope' },
  LeaveReportList: { $ref: '#/components/schemas/ReportListEnvelope' },
  CashAdvanceReportList: { $ref: '#/components/schemas/ReportListEnvelope' },
  PayrollReportList: { $ref: '#/components/schemas/ReportListEnvelope' },
  EmployeeReportList: { $ref: '#/components/schemas/ReportListEnvelope' },
  BranchReportList: { $ref: '#/components/schemas/ReportListEnvelope' },
  WarehouseReportList: { $ref: '#/components/schemas/ReportListEnvelope' },
  VehicleReportList: { $ref: '#/components/schemas/ReportListEnvelope' },

  ActivityEventType: {
    type: 'string',
    enum: [
      'AUTHENTICATION',
      'COMPANY',
      'EMPLOYEE',
      'ORGANIZATION',
      'TRANSACTION',
      'TRIP',
      'EXPENSE',
      'WORKFORCE',
    ],
  },
  ActivityModule: {
    type: 'string',
    enum: [
      'auth',
      'company',
      'employee',
      'branch',
      'warehouse',
      'vehicle',
      'transaction',
      'trip',
      'expense',
      'attendance',
      'leave',
      'cash-advance',
      'payroll',
      'user',
    ],
  },
  ActivityLog: {
    type: 'object',
    required: [
      'id',
      'companyId',
      'eventType',
      'module',
      'action',
      'description',
      'userId',
      'createdAt',
    ],
    properties: {
      id: uuid,
      companyId: uuid,
      eventType: { $ref: '#/components/schemas/ActivityEventType' },
      module: { $ref: '#/components/schemas/ActivityModule' },
      action: { type: 'string', example: 'transaction.settled' },
      description: { type: 'string', example: 'Transaction paid' },
      userId: uuid,
      employeeId: { ...uuid, nullable: true },
      resourceType: { type: 'string', nullable: true },
      resourceId: { ...uuid, nullable: true },
      resourceNumber: { type: 'string', nullable: true },
      ipAddress: { type: 'string', nullable: true },
      userAgent: { type: 'string', nullable: true },
      metadata: { type: 'object', additionalProperties: true, nullable: true },
      createdAt: dateTime,
      performedBy: {
        type: 'object',
        nullable: false,
        properties: {
          id: uuid,
          employeeId: { ...uuid, nullable: true },
          email: { type: 'string', format: 'email', nullable: true },
          role: {
            type: 'string',
            enum: ['OWNER', 'MANAGER', 'EMPLOYEE', 'SUPER_ADMIN'],
            nullable: true,
          },
        },
        required: ['id', 'employeeId', 'email', 'role'],
      },
    },
  },

  CompanySubscriptionStatus: {
    type: 'string',
    enum: ['TRIAL', 'ACTIVE', 'GRACE_PERIOD', 'EXPIRED', 'SUSPENDED'],
  },

  SubscriptionPeriodStatus: {
    type: 'string',
    enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED'],
  },

  CompanySubscription: {
    type: 'object',
    required: [
      'id',
      'companyId',
      'planName',
      'startsAt',
      'endsAt',
      'status',
      'createdBy',
      'createdAt',
      'updatedAt',
    ],
    properties: {
      id: uuid,
      companyId: uuid,
      planName: { type: 'string' },
      startsAt: dateTime,
      endsAt: dateTime,
      status: { $ref: '#/components/schemas/SubscriptionPeriodStatus' },
      notes: { type: 'string', nullable: true },
      createdBy: uuid,
      createdAt: dateTime,
      updatedAt: dateTime,
    },
  },

  CreateSubscriptionRequest: {
    type: 'object',
    required: ['planName', 'startsAt', 'endsAt', 'status'],
    properties: {
      planName: { type: 'string', minLength: 1, maxLength: 120 },
      startsAt: dateTime,
      endsAt: dateTime,
      status: { type: 'string', enum: ['PENDING', 'ACTIVE'] },
      companyStatus: { $ref: '#/components/schemas/CompanySubscriptionStatus' },
      notes: { type: 'string', maxLength: 2000 },
    },
  },

  RenewSubscriptionRequest: {
    type: 'object',
    required: ['planName', 'startsAt', 'endsAt'],
    properties: {
      planName: { type: 'string', minLength: 1, maxLength: 120 },
      startsAt: dateTime,
      endsAt: dateTime,
      status: { type: 'string', enum: ['PENDING', 'ACTIVE'], default: 'ACTIVE' },
      companyStatus: { $ref: '#/components/schemas/CompanySubscriptionStatus' },
      notes: { type: 'string', maxLength: 2000 },
    },
  },

  SubscriptionStatusResponse: {
    type: 'object',
    required: ['companyId', 'subscriptionStatus'],
    properties: {
      companyId: uuid,
      subscriptionStatus: { $ref: '#/components/schemas/CompanySubscriptionStatus' },
    },
  },
};
