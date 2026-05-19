import { prisma } from '../../../infra/database/prisma';
import { CardEntity, type TCardEntity } from '../../card/entities/card.entity';
import { formatCardSummaryLabel } from './format-card-summary-label';
import { sumDemandPendingPrintGlobal } from './sum-demand-pending-print';
import {
  GraphicSummaryResponse,
  type TGraphicSummaryResponse,
} from '../schemas/graphic-summary.schema';

function sumGraphicLineQuantities(lines: Array<{ quantity: number }>): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

function formatGraphicSummaryClipboardText(
  lines: Array<{ card: TCardEntity; quantity: number }>,
  generatedAt: Date
): string {
  const header = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(generatedAt);

  const total = sumGraphicLineQuantities(lines);
  const parts: string[] = [`Resumo para gráfica — gerado em ${header}`, ''];

  if (lines.length === 0) {
    parts.push(
      '(Nenhuma unidade pendente de impressão para enviar — considerando estoque atual e linhas que já estão em impressão ou impressas.)'
    );
  } else {
    parts.push(
      lines.map((line) => `• ${line.quantity} × ${formatCardSummaryLabel(line.card)}`).join('\n')
    );
  }

  parts.push('', `Total de unidades: ${total}`);
  return parts.join('\n');
}

export class GetGraphicSummaryService {
  async execute(): Promise<TGraphicSummaryResponse> {
    const generatedAt = new Date();
    const demandMap = await sumDemandPendingPrintGlobal();
    const cardIds = [...demandMap.keys()].filter((id) => (demandMap.get(id) ?? 0) > 0);

    if (cardIds.length === 0) {
      const empty = GraphicSummaryResponse.parse({
        lines: [],
        total_units: 0,
        clipboard_text: formatGraphicSummaryClipboardText([], generatedAt),
        generated_at: generatedAt,
      });
      return empty;
    }

    const [cards, stockRows] = await Promise.all([
      prisma.card.findMany({
        where: { id: { in: cardIds }, is_deleted: false },
      }),
      prisma.cardStock.findMany({
        where: { card_id: { in: cardIds }, is_deleted: false },
      }),
    ]);

    const stockQtyMap = new Map(stockRows.map((s) => [s.card_id, s.quantity]));

    const parsedCards = cards.map((c) => ({
      raw: c,
      entity: CardEntity.parse(c),
    }));

    const lines: Array<{ card: TCardEntity; quantity: number }> = [];

    for (const { raw, entity } of parsedCards) {
      const demand = demandMap.get(raw.id) ?? 0;
      const on_hand = stockQtyMap.get(raw.id) ?? 0;
      const qty = Math.max(0, demand - on_hand);
      if (qty > 0) {
        lines.push({ card: entity, quantity: qty });
      }
    }

    lines.sort((a, b) =>
      formatCardSummaryLabel(a.card).localeCompare(formatCardSummaryLabel(b.card), 'pt-BR')
    );

    const total_units = sumGraphicLineQuantities(lines);

    return GraphicSummaryResponse.parse({
      lines,
      total_units,
      clipboard_text: formatGraphicSummaryClipboardText(lines, generatedAt),
      generated_at: generatedAt,
    });
  }
}

export const getGraphicSummaryService = new GetGraphicSummaryService();
