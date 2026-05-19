import type { TCardEntity } from '../../card/entities/card.entity';

const TCG_LABELS: Record<TCardEntity['tcg'], string> = {
  one_piece: 'One Piece',
  magic: 'Magic: The Gathering',
  pokemon: 'Pokémon',
};

const CARD_TYPE_LABELS: Record<TCardEntity['card_type'], string> = {
  leader: 'Líder',
  don: 'DON',
  token: 'Ficha',
  commander: 'Comandante',
  pokemon: 'Pokémon',
  supporter: 'Apoiador',
  item: 'Item',
  stadium: 'Estádio',
  tool: 'Ferramenta',
};

/** Mesma convenção visual que o resumo de pedido no frontend (clipboard). */
export function formatCardSummaryLabel(card: TCardEntity): string {
  const tcg = TCG_LABELS[card.tcg];
  const type = CARD_TYPE_LABELS[card.card_type];
  const name = card.name?.trim();
  const edition = card.edition?.trim();
  const parts = [tcg, type];
  if (name) parts.push(name);
  if (edition) parts.push(`(${edition})`);
  return parts.join(' · ');
}
