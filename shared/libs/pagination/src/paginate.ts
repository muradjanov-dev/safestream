import { SelectQueryBuilder } from 'typeorm';

export async function paginateWithCursor<T extends { id: string; createdAt: Date }>(
  qb: SelectQueryBuilder<T>,
  limit: number,
  cursor?: string,
): Promise<{ items: T[]; nextCursor?: string; total: number }> {
  const total = await qb.getCount();

  if (cursor) {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const { id, createdAt } = JSON.parse(decoded) as { id: string; createdAt: string };
    qb.andWhere(
      `(entity.createdAt < :createdAt OR (entity.createdAt = :createdAt AND entity.id < :id))`,
      { createdAt, id },
    );
  }

  const items = await qb
    .orderBy('entity.createdAt', 'DESC')
    .addOrderBy('entity.id', 'DESC')
    .take(limit + 1)
    .getMany();

  let nextCursor: string | undefined;
  if (items.length > limit) {
    items.pop();
    const last = items[items.length - 1];
    nextCursor = Buffer.from(
      JSON.stringify({ id: last.id, createdAt: last.createdAt }),
    ).toString('base64');
  }

  return { items, nextCursor, total };
}
