"use client";

import React from "react";

/**
 * Lightweight skeleton card shown while hotels load.
 * Save as: components/home/HotelSkeleton.tsx
 */
export default function HotelSkeleton() {
  return (
    <div className="h-full animate-pulse bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700" />
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="h-6 w-3/5 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
          <div className="h-4 w-2/5 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
}
