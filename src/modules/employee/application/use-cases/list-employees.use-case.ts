import type { EmployeeRepository } from '../../domain/employee.repository.js';
import type { EmployeeResponseDto } from '../dto/employee.response.js';

export class ListEmployeesUseCase {
  constructor(private readonly employeeRepository: EmployeeRepository) {}
  async execute(companyId: string): Promise<EmployeeResponseDto[]> {
    const employees = await this.employeeRepository.listActiveByCompany(companyId);
    return employees.map((employee) => employee.toPrimitives());
  }
}
