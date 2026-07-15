import { describe, expect, it } from 'vitest';
import {
  toActivityActionLabel,
  toActivityEventTypeLabel,
  toActivityModuleLabel,
  toActivityResourceTypeLabel,
  toUserRoleLabel,
} from '../../../src/modules/activity-log/application/activity-log-display-labels.js';

describe('activity log display labels', () => {
  it('maps stored codes to English labels', () => {
    expect(toActivityEventTypeLabel('TRANSACTION')).toBe('Transaction');
    expect(toActivityModuleLabel('transaction')).toBe('Transaction');
    expect(toActivityModuleLabel('cash-advance')).toBe('Cash advance');
    expect(toActivityResourceTypeLabel('trip')).toBe('Trip');
    expect(toActivityResourceTypeLabel('expense_attachment')).toBe('Expense attachment');
    expect(toActivityResourceTypeLabel(null)).toBeNull();
  });

  it('uses description for action label', () => {
    expect(toActivityActionLabel('transaction.settled', 'Transaction paid')).toBe(
      'Transaction paid',
    );
  });

  it('humanizes unknown codes', () => {
    expect(toActivityEventTypeLabel('CUSTOM_EVENT')).toBe('Custom Event');
    expect(toActivityModuleLabel('custom-module')).toBe('Custom Module');
    expect(toActivityResourceTypeLabel('custom_resource')).toBe('Custom Resource');
    expect(toActivityActionLabel('custom.action', '')).toBe('Custom Action');
  });

  it('maps user roles to English labels', () => {
    expect(toUserRoleLabel('OWNER')).toBe('Owner');
    expect(toUserRoleLabel('MANAGER')).toBe('Manager');
    expect(toUserRoleLabel('EMPLOYEE')).toBe('Employee');
    expect(toUserRoleLabel('SUPER_ADMIN')).toBe('Super admin');
    expect(toUserRoleLabel(null)).toBeNull();
  });
});
