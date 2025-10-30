export interface ApiResponse<T = unknown> {
    data: T;
    message?: string;
}
export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
export interface ApiError {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
}
export interface RequestConfig {
    headers?: Record<string, string>;
    signal?: AbortSignal;
}
export type SortDirection = 'asc' | 'desc';
export interface PaginationParams {
    page?: number;
    pageSize?: number;
}
export interface SortParams {
    sortBy?: string;
    sortDirection?: SortDirection;
}
export interface SearchParams extends PaginationParams, SortParams {
    query?: string;
}
//# sourceMappingURL=api.d.ts.map