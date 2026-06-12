import type { PrismaTransactionalClient } from '../../../infra/database/prisma';
import { prisma } from '../../../infra/database/prisma';
import { toUnitPrice } from './order-helpers';

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function isOrderFullyPaid(totalAmount: number, amountPaid: number): boolean {
  return roundMoney(amountPaid) >= roundMoney(totalAmount) && totalAmount > 0;
}

export async function sumOrderPayments(
  orderId: number,
  transaction: PrismaTransactionalClient = prisma
): Promise<number> {
  const aggregate = await transaction.orderPayment.aggregate({
    where: { order_id: orderId, is_deleted: false },
    _sum: { amount: true },
  });
  return roundMoney(toUnitPrice(aggregate._sum.amount ?? 0));
}

export function computePaymentSummary(totalAmount: number, amountPaid: number) {
  const paid = roundMoney(amountPaid);
  const total = roundMoney(totalAmount);
  const due = roundMoney(Math.max(0, total - paid));
  return {
    amount_paid: paid,
    amount_due: due,
    is_fully_paid: isOrderFullyPaid(total, paid),
  };
}
