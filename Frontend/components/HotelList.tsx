"use client";

import React, { useEffect, useState } from "react";
import HotelCard from "./ui/HotelCard";

/**
 * Local Hotel type (matches your HotelCard props).
 * We map API response -> this shape.
 */
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

/**
 * Fetches hotels from backend and renders HotelCard grid
 */
export default function HotelList({
  page = 1,
  pageSize = 12,
}: {
  page?: number;
  pageSize?: number;
}) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const url = `${API_BASE}/api/hotels?page=${page}&pageSize=${pageSize}`;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status} - ${text}`);
        }
        return res.json();
      })
      .then((json) => {
        if (!mounted) return;
        // Expecting { success: true, data: [...], meta: {...} }
        const list = Array.isArray(json.data) ? json.data : [];

        const mapped: Hotel[] = list.map((h: any) => {
          // Prefer explicit startingPrice; fallback to cheapest room price if present
          const startingPrice =
            typeof h.startingPrice === "number" && h.startingPrice > 0
              ? h.startingPrice
              : h.rooms &&
                h.rooms[0] &&
                typeof h.rooms[0].pricePerNight === "number"
              ? h.rooms[0].pricePerNight
              : 0;

          // thumbnail fallback
          const image =
            h.thumbnail ??
            (Array.isArray(h.images) && h.images.length > 0
              ? h.images[0]
              : null) ??
            "/images/placeholder.jpg";

          // compute status using included rooms (list endpoint returns cheapest room as rooms[0])
          let status: Hotel["status"] = "Maintenance";
          if (h.rooms && h.rooms.length > 0) {
            const r = h.rooms[0];
            if (r.status && r.status.toLowerCase() === "available")
              status = "Available";
            else if (r.status && r.status.toLowerCase() === "occupied")
              status = "Few rooms";
            else status = "Maintenance";
          }

          return {
            id: h.id,
            name: h.name,
            city: h.city,
            country: h.country,
            rating: typeof h.starRating === "number" ? h.starRating : 0,
            startingPrice,
            image,
            tag:
              Array.isArray(h.tags) && h.tags.length > 0
                ? h.tags[0]
                : undefined,
            description: h.shortDescription ?? h.description ?? "",
            status,
          } as Hotel;
        });

        setHotels(mapped);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Failed fetching hotels:", err);
        setError(err.message || "Failed to fetch hotels");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [page, pageSize]);

  if (loading) {
    return <div className="py-8 text-center">Loading hotels…</div>;
  }

  if (error) {
    return <div className="py-8 text-center text-red-600">Error: {error}</div>;
  }

  if (hotels.length === 0) {
    return <div className="py-8 text-center">No hotels found.</div>;
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {hotels.map((hotel) => (
        <HotelCard key={hotel.id} hotel={hotel} />
      ))}
    </section>
  );
}
