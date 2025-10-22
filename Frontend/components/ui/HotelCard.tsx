"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star, MapPin } from "lucide-react";

export interface Hotel {
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
}

export default function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <article
      aria-labelledby={`hotel-${hotel.id}-title`}
      className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-300"
    >
      {/* Image / Badge */}
      <div className="relative">
        <img
          src={hotel.image}
          alt={hotel.name}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        {hotel.tag && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 text-sm font-medium text-gray-800 dark:bg-gray-900/80 dark:text-white shadow-sm">
            {hotel.tag}
          </div>
        )}
      </div>

      {/* Body: use flex-1 so cards line up */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between">
            <div className="pr-4">
              <h4
                id={`hotel-${hotel.id}-title`}
                className="text-lg font-bold text-gray-900 dark:text-white"
              >
                {hotel.name}
              </h4>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-300 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>
                  {hotel.city}, {hotel.country}
                </span>
              </div>
            </div>

            <div className="text-right flex-shrink-0 ml-4">
              <div className="text-sm text-gray-500 dark:text-gray-300">
                From
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                ${hotel.startingPrice ?? "N/A"}
              </div>
              {hotel.status && (
                <div className="mt-2">
                  <span
                    className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${
                      hotel.status === "Available"
                        ? "bg-emerald-100 text-emerald-800"
                        : hotel.status === "Few rooms"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {hotel.status}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description: clamp to 3 lines for consistent layout (preferred) */}
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
            {hotel.description && hotel.description.trim().length > 0
              ? hotel.description
              : "No description available."}
          </p>
        </div>

        {/* Actions always sit at the bottom due to justify-between */}
        <div className="mt-4 flex items-center gap-3">
          <Link href={`/hotels/${hotel.id}`}>
            <Button variant="outline" className="px-3 py-2">
              View
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}
