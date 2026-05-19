import { describe, expect, it } from 'vitest';
import { formatCardSummaryLabel } from './format-card-summary-label';

describe('formatCardSummaryLabel', () => {
  it('formats leader with name and edition', () => {
    expect(
      formatCardSummaryLabel({
        id: 1,
        tcg: 'one_piece',
        card_type: 'leader',
        name: 'Luffy',
        edition: 'OP01',
        colors: ['red'],
        status: 'active',
        created_at: new Date(),
        updated_at: null,
      }),
    ).toBe('One Piece · Líder · Luffy · (OP01)');
  });
});
