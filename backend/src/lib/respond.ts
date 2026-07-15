import type { Response } from "express";

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Section 6.1 success envelope. Errors go through ApiError + errorHandler.
export function ok<T>(res: Response, data: T, pagination?: Pagination, status = 200) {
  const body: { success: true; data: T; pagination?: Pagination } = { success: true, data };
  if (pagination) body.pagination = pagination;
  return res.status(status).json(body);
}

export function paginate(page: number, limit: number, total: number): Pagination {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
