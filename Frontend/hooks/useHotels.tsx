"use client";

import { useState, useMemo } from "react";
import useSWR, { SWRConfiguration } from "swr";

/**
 * Read API base from NEXT_PUBLIC_API_BASE (set in .env.local) or fall back to same-origin.
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");

/**
 * Lightweight fetcher that throws on non-OK responses and returns parsed JSON.
 */
const fetcher = async (url: string) => {
  const finalUrl =
    url.startsWith("http://") || url.startsWith("https://")
      ? url
      : API_BASE
      ? `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`
      : url;
  const res = await fetch(finalUrl, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const message = body || `Network error (status ${res.status})`;
    const err: any = new Error(message);
    err.status = res.status;
    throw err;
  }
  return res.json();
};

export type UseHotelsParams = {
  q?: string;
  city?: string;
  country?: string;
  onlyAvailable?: boolean;
  page?: number;
  pageSize?: number;
  sort?: string;
  [key: string]: string | number | boolean | undefined;
};

export type Hotel = {
  id: number;
  name: string;
  city: string;
  country: string;
  rating: number;
  startingPrice: number;
  image: string;
  tag?: string;
  description?: string;
  status?: "Available" | "Few rooms" | "Maintenance" | string;
};

export type UseHotelsResult<T = Hotel> = {
  hotels: T[];
  meta: any | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isValidating: boolean;
  mutate: () => Promise<any>;
  refresh: () => Promise<any>;
  params: UseHotelsParams;
  setParams: (
    p: UseHotelsParams | ((prev: UseHotelsParams) => UseHotelsParams)
  ) => void;
};

export function useHotels(
  initialParams: UseHotelsParams = {},
  swrOptions: Partial<SWRConfiguration> = {}
): UseHotelsResult {
  const [params, setParamsState] = useState<UseHotelsParams>(initialParams);

  const key = useMemo(() => {
    const search = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      if (typeof v === "boolean") {
        search.append(k, v ? "1" : "0");
      } else {
        search.append(k, String(v));
      }
    });
    const qs = search.toString();
    return qs ? `/api/hotels?${qs}` : "/api/hotels";
  }, [params]);

  const defaultOptions: Partial<SWRConfiguration> = {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 60_000,
    refreshInterval: 0,
    shouldRetryOnError: false,
  };

  const { data, error, mutate, isValidating } = useSWR(key, fetcher, {
    ...defaultOptions,
    ...swrOptions,
  });

  // <-- THE FIX: map API data to always provide description -->
  const hotels: Hotel[] = Array.isArray(data?.data)
    ? data.data.map((h: any) => ({
        ...h,
        image: h.thumbnail ?? "/images/placeholder.jpg",
        rating: typeof h.starRating === "number" ? h.starRating : 0,
        description: h.shortDescription ?? h.description ?? "",
      }))
    : [];

  const setParams = (
    p: UseHotelsParams | ((prev: UseHotelsParams) => UseHotelsParams)
  ) => {
    if (typeof p === "function") {
      setParamsState((prev) => {
        const next = p(prev);
        return { ...(prev || {}), ...(next || {}) };
      });
    } else {
      setParamsState((prev) => ({ ...(prev || {}), ...(p || {}) }));
    }
  };

  return {
    hotels,
    meta: data?.meta ?? null,
    isLoading: !error && !data,
    isError: !!error,
    error: (error as Error) ?? null,
    isValidating: !!isValidating,
    mutate: async () => mutate?.(),
    refresh: async () => mutate?.(),
    params,
    setParams,
  };
}
