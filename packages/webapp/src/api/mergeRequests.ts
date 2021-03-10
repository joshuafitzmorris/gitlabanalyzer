import {
  SearchResults,
  useApiInfiniteQuery,
  useApiQuery,
  usePaginatedQuery,
} from './base';
import { MergeRequest } from '@ceres/types';

export function useMergeRequest(id: string) {
  return useApiQuery<SearchResults<MergeRequest>>(
    `/merge_request?repository=${id}&pageSize=50000`,
  );
}

interface MergeRequestSearchParams {
  repository: string;
}

export function useGetMergeRequests(
  params: MergeRequestSearchParams,
  page?: number,
  pageSize?: number,
) {
  return usePaginatedQuery<MergeRequest>(
    '/merge_request',
    params,
    page,
    pageSize,
  );
}

export function useInfiniteMergeRequest(
  params: MergeRequestSearchParams,
  pageSize = 15,
) {
  return useApiInfiniteQuery<MergeRequest>('/merge_request', params, pageSize);
}