import { describe, expect, it } from 'vitest';
import { formatProductionShipmentClipboardLine } from './format-production-shipment-clipboard';

const SAMPLE_CARD = {
  id: 1,
  tcg: 'one_piece' as const,
  card_type: 'leader' as const,
  name: 'Luffy',
  edition: 'OP01',
  colors: ['red' as const],
  status: 'active' as const,
  created_at: new Date(),
  updated_at: null as Date | null,
};

describe('formatProductionShipmentClipboardLine', () => {
  it('includes quantity, file name, card label and model name', () => {
    expect(
      formatProductionShipmentClipboardLine({
        quantity: 3,
        card: SAMPLE_CARD,
        file_name: 'luffy-op01.pdf',
        model_name: 'Frente OP01',
      })
    ).toBe(
      '• 3 × luffy-op01.pdf — One Piece · Líder · Luffy · (OP01) (Frente OP01)'
    );
  });

  it('appends varnish suffix when has_varnish is true', () => {
    expect(
      formatProductionShipmentClipboardLine({
        quantity: 2,
        card: SAMPLE_CARD,
        file_name: 'luffy-op01.pdf',
        model_name: 'Frente OP01',
        has_varnish: true,
      })
    ).toBe(
      '• 2 × luffy-op01.pdf [COM VERNIZ] — One Piece · Líder · Luffy · (OP01) (Frente OP01)'
    );
  });
});
