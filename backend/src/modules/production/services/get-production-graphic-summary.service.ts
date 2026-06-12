import { ApiError } from '../../../common/errors/api-error';
import { prisma } from '../../../infra/database/prisma';
import { CardEntity } from '../../card/entities/card.entity';
import {
  ProductionGraphicSummaryResponse,
  type TProductionGraphicSummaryResponse,
} from '../schemas/production-graphic-summary.schema';
import { formatCardSummaryLabel } from '../../stock/services/format-card-summary-label';
import { formatProductionShipmentClipboardDocument } from './format-production-shipment-clipboard';

export class GetProductionGraphicSummaryService {
  async execute(shipmentId: number): Promise<TProductionGraphicSummaryResponse> {
    const generatedAt = new Date();

    const shipment = await prisma.productionShipment.findFirst({
      where: { id: shipmentId, is_deleted: false },
    });

    if (!shipment) {
      throw ApiError('not-found', 'Remessa não encontrada.', undefined, 404);
    }

    const rows = await prisma.orderItem.findMany({
      where: { production_shipment_id: shipmentId, is_deleted: false },
      include: {
        card: true,
        card_print_model: {
          select: { id: true, name: true, file_name: true },
        },
      },
    });

    const merged = new Map<
      number,
      {
        quantity: number;
        card: (typeof rows)[number]['card'];
        model_name: string;
        file_name: string;
      }
    >();

    for (const row of rows) {
      if (row.card_print_model_id == null || row.card_print_model == null) {
        continue;
      }
      const modelId = row.card_print_model_id;
      const prev = merged.get(modelId);
      if (prev) {
        prev.quantity += row.quantity;
      } else {
        merged.set(modelId, {
          quantity: row.quantity,
          card: row.card,
          model_name: row.card_print_model.name,
          file_name: row.card_print_model.file_name,
        });
      }
    }

    const clipboardLines = [...merged.values()].map((entry) => ({
      quantity: entry.quantity,
      card: CardEntity.parse(entry.card),
      file_name: entry.file_name,
      model_name: entry.model_name,
    }));

    const graphicLines = [...merged.values()].map((entry) => ({
      card: CardEntity.parse(entry.card),
      quantity: entry.quantity,
    }));

    graphicLines.sort((a, b) =>
      formatCardSummaryLabel(a.card).localeCompare(formatCardSummaryLabel(b.card), 'pt-BR')
    );

    const clipboardText = formatProductionShipmentClipboardDocument({
      lines: clipboardLines,
      shipmentDisplayNumber: shipment.display_number,
      generatedAt,
    });

    const totalUnits = graphicLines.reduce((sum, line) => sum + line.quantity, 0);

    return ProductionGraphicSummaryResponse.parse({
      lines: graphicLines,
      total_units: totalUnits,
      clipboard_text: clipboardText,
      generated_at: generatedAt,
    });
  }
}

export const getProductionGraphicSummaryService = new GetProductionGraphicSummaryService();
