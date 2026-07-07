import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import { assertSameCompany } from '../../domain/employee-rules.js';
import type { EmployeeRepository } from '../../domain/employee.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { EmployeeResponseDto } from '../dto/employee.response.js';

function toResponse(employee: { toPrimitives(): EmployeeResponseDto }): EmployeeResponseDto {
  return employee.toPrimitives();
}

export class LinkEmployeeToUserUseCase {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly userRepository: UserRepository,
  ) {}
  async execute(
    employeeId: string,
    companyId: string,
    userId: string,
  ): Promise<EmployeeResponseDto> {
    const employee = await this.employeeRepository.findById(employeeId, companyId);
    if (!employee) throw new ResourceNotFoundError('Employee not found');
    const user = await this.userRepository.findById(userId, companyId);
    if (!user) throw new ResourceNotFoundError('User not found');
    assertSameCompany(employee.companyId, user.companyId);
    await this.userRepository.linkEmployee(user.id, employee.id);
    return toResponse(await this.employeeRepository.linkUser(employeeId, companyId, userId));
  }
}
