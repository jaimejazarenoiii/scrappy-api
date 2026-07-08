import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { EmployeeRepository } from '../../domain/employee.repository.js';
import type { EmployeeResponseDto } from '../dto/employee.response.js';

export class GetMyEmployeeUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly employeeRepository: EmployeeRepository,
  ) {}
  async execute(userId: string, companyId: string): Promise<EmployeeResponseDto> {
    const user = await this.userRepository.findById(userId, companyId);
    if (!user || !user.employeeId)
      throw new ResourceNotFoundError('No employee profile is linked to the current user');
    const employee = await this.employeeRepository.findById(user.employeeId, companyId);
    if (!employee) throw new ResourceNotFoundError('Employee not found');
    return employee.toPrimitives();
  }
}
