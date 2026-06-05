import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit = 20;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    total: number;
    limit: number;
    cursor?: string;
    hasMore: boolean;
    page?: number;
    totalPages?: number;
  };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  limit: number,
  cursor?: string,
  page?: number,
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    meta: {
      total,
      limit,
      cursor,
      hasMore: data.length === limit,
      page,
      totalPages: page ? Math.ceil(total / limit) : undefined,
    },
  };
}
