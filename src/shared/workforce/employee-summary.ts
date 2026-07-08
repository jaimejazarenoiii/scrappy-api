export interface EmployeeSummary {
  firstName: string;
  lastName: string;
  employeeNumber: string | null;
}

export interface WithEmployeeSummary {
  employeeId: string;
  firstName: string;
  lastName: string;
  employeeNumber: string | null;
}

export function buildEmployeeSummaryLookup(
  employees: Array<{ id: string; toPrimitives(): EmployeeSummary }>,
): Map<string, EmployeeSummary> {
  return new Map(
    employees.map((employee) => {
      const summary = employee.toPrimitives();
      return [
        employee.id,
        {
          firstName: summary.firstName,
          lastName: summary.lastName,
          employeeNumber: summary.employeeNumber,
        },
      ];
    }),
  );
}

export function withEmployeeSummary<T extends { employeeId: string }>(
  item: T,
  lookup: Map<string, EmployeeSummary>,
): T & EmployeeSummary {
  const summary = lookup.get(item.employeeId);
  return {
    ...item,
    firstName: summary?.firstName ?? '',
    lastName: summary?.lastName ?? '',
    employeeNumber: summary?.employeeNumber ?? null,
  };
}
