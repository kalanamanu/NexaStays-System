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
      className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-300"
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

        {/* Rating pill */}
        <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 text-white rounded-full px-3 py-1 text-sm">
          <Star className="h-4 w-4 text-amber-400" />
          <span className="font-medium">{hotel.rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
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

          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-300">From</div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
              ${hotel.startingPrice}
            </div>
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
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300">
          {hotel.description}
        </p>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-3">
            {/* Placeholder actions/icons can be swapped for real handlers */}
            <Link href={`/hotels/${hotel.id}`}>
              <Button variant="outline" className="px-3 py-2">
                View
              </Button>
            </Link>

            <Link href={`/reservation?hotelId=${hotel.id}`}>
              <Button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                Book
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
