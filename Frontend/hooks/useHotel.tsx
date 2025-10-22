"use client";

import useSWR from "swr";

// Get backend API base, default to localhost:5000
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:5000";

const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      throw new Error(text || "Network error");
    }
    return r.json();
  });

/**
 * useHotel hook
 * - Fetches /api/hotels/:id from backend API_BASE and returns the hotel object and status flags
 * - Expects backend to return JSON: { success: true, data: hotel }
 */
export function useHotel(id?: number | string) {
  const key = id ? `${API_BASE}/api/hotels/${id}` : null;
  const { data, error } = useSWR(key, fetcher);
  return {
    hotel: data?.data ?? null,
    isLoading: !error && !data,
    isError: !!error,
    error,
  };
}
