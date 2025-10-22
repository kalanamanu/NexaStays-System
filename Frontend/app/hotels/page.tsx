"use client";

import React, { useState, useMemo, useEffect } from "react";
import NavBar from "@/components/nav-bar";
import HotelCard from "@/components/ui/HotelCard";
import HotelSkeleton from "@/components/ui/HotelSkeleton";
import { Button } from "@/components/ui/button";
import { useHotels } from "@/hooks/useHotels";
import { motion } from "framer-motion";

/**
 * Improved Hotels page
 *
 * Changes made:
 * - Added client-side pagination (prev / next).
 * - Debounced search input so we don't re-filter on every keystroke.
 * - Kept the "Only available" filter and applied it to the client-side filtered list.
 * - Uses useHotels() hook to fetch hotel data (preserves existing hook usage).
 * - Shows skeletons while loading, error message on failure.
 * - Renders accessible headings and buttons and keeps the same visual layout.
 *
 * Save as: app/hotels/page.tsx
 */

const PAGE_SIZE_DEFAULT = 12;
const SEARCH_DEBOUNCE_MS = 250;

export default function HotelsPage() {
  const { hotels, isLoading, isError } = useHotels();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // pagination (client-side)
  const [page, setPage] = useState(1);
  const pageSize = PAGE_SIZE_DEFAULT;

  // debounce the query so filtering is not too aggressive while typing
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedQuery(query.trim()),
      SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(t);
  }, [query]);

  // derive filtered list
  const filtered = useMemo(() => {
    if (!Array.isArray(hotels)) return [];
    const q = debouncedQuery.toLowerCase();

    const list = hotels.filter((h: any) => {
      const matchesQuery =
        !q ||
        (h.name && h.name.toLowerCase().includes(q)) ||
        (h.city && h.city.toLowerCase().includes(q)) ||
        (h.country && h.country.toLowerCase().includes(q)) ||
        (h.description && h.description.toLowerCase().includes(q));

      // Normalise status to match "Available" used in UI
      const status =
        h.status && typeof h.status === "string"
          ? h.status.toLowerCase()
          : h.rooms && h.rooms.length > 0 && h.rooms[0].status
          ? h.rooms[0].status.toLowerCase()
          : "";

      const matchesAvailable = !onlyAvailable || status === "available";

      return matchesQuery && matchesAvailable;
    });

    return list;
  }, [hotels, debouncedQuery, onlyAvailable]);

  // reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, onlyAvailable]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pageItems = filtered.slice(pageStart, pageStart + pageSize);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
            Our Hotels
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Browse hotels across our network. Use search and filters to narrow
            results.
          </p>
        </motion.header>

        <section className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 flex items-center gap-3">
            <input
              aria-label="Search hotels"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, city or country"
              className="w-full max-w-lg rounded-md px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/60 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="form-checkbox h-4 w-4 text-indigo-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Only available
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setQuery("");
                setOnlyAvailable(false);
              }}
            >
              Reset
            </Button>
            <Button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Back to top
            </Button>
          </div>
        </section>

        <section>
          {isError && (
            <div className="text-red-500 mb-4">
              Failed to load hotels. Try reloading the page.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
            {isLoading ? (
              // show skeletons while loading
              Array.from({ length: 6 }).map((_, i) => <HotelSkeleton key={i} />)
            ) : pageItems.length > 0 ? (
              pageItems.map((hotel: any) => (
                <motion.div
                  key={hotel.id}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="h-full"
                >
                  <HotelCard hotel={hotel} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-16 text-gray-600 dark:text-gray-300">
                No hotels found for your search.
              </div>
            )}
          </div>

          {/* Pagination controls */}
          {!isLoading && total > 0 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Showing <span className="font-medium">{pageStart + 1}</span> -
                <span className="font-medium">
                  {" "}
                  {Math.min(pageStart + pageSize, total)}
                </span>{" "}
                of <span className="font-medium">{total}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </Button>
                <div className="text-sm text-gray-700 dark:text-gray-300 px-3">
                  Page {page} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
