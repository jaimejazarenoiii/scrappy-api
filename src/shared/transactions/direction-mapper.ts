import type { TransactionDirection } from '../../modules/transaction/domain/transaction-direction.js';

export type TransactionDirectionLabel = 'BUY' | 'SELL';

const LABEL_TO_CANONICAL: Record<TransactionDirectionLabel, TransactionDirection> = {
  BUY: 'INBOUND',
  SELL: 'OUTBOUND',
};

const CANONICAL_TO_LABEL: Record<TransactionDirection, TransactionDirectionLabel> = {
  INBOUND: 'BUY',
  OUTBOUND: 'SELL',
};

/**
 * Accepts either a canonical direction (`INBOUND`/`OUTBOUND`) or a UI label (`BUY`/`SELL`)
 * and returns the canonical internal direction.
 */
export function toCanonicalDirection(
  value: TransactionDirection | TransactionDirectionLabel,
): TransactionDirection {
  if (value === 'INBOUND' || value === 'OUTBOUND') return value;
  return LABEL_TO_CANONICAL[value];
}

/**
 * Maps a canonical internal direction to its user-facing label.
 */
export function toDirectionLabel(direction: TransactionDirection): TransactionDirectionLabel {
  return CANONICAL_TO_LABEL[direction];
}
