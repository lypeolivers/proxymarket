import type { TCardEntity } from '../../card/entities/card.entity';
import { formatCardSummaryLabel } from '../../stock/services/format-card-summary-label';

export function formatProductionShipmentClipboardLine(input: {
  quantity: number;
  card: TCardEntity;
  file_name: string;
  model_name: string;
}): string {
  const cardLabel = formatCardSummaryLabel(input.card);
  return `• ${input.quantity} × ${input.file_name.trim()} — ${cardLabel} (${input.model_name.trim()})`;
}

export function formatProductionShipmentClipboardDocument(input: {
  lines: Array<{ quantity: number; card: TCardEntity; file_name: string; model_name: string }>;
  shipmentDisplayNumber: number;
  generatedAt: Date;
}): string {
  const header = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(input.generatedAt);

  const parts: string[] = [
    `Resumo para gráfica — Remessa #${input.shipmentDisplayNumber} — ${header}`,
    '',
  ];

  if (input.lines.length === 0) {
    parts.push('(Nenhuma linha nesta remessa.)');
  } else {
    parts.push(
      input.lines
        .map((line) => formatProductionShipmentClipboardLine(line))
        .sort((a, b) => a.localeCompare(b, 'pt-BR'))
        .join('\n')
    );
  }

  const total = input.lines.reduce((sum, line) => sum + line.quantity, 0);
  parts.push('', `Total de unidades: ${total}`);
  return parts.join('\n');
}
