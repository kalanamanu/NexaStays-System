"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/nav-bar";
import HotelSkeleton from "@/components/ui/HotelSkeleton";
import { useHotel } from "@/hooks/useHotel";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export default function HotelDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const hotelId = Number(params.id);
  const { hotel, isLoading, isError } = useHotel(hotelId);
  const router = useRouter();

  // Only allow selection of one room type and one room
  const [selectedRoomType, setSelectedRoomType] = useState<string>("");
  const [occupants, setOccupants] = useState<number>(1);

  // derive unique room types with price and availability (normalize status)
  const roomTypes = useMemo(() => {
    if (!hotel?.rooms) return [];
    const map = new Map<
      string,
      { price: number; total: number; available: number }
    >();
    for (const r of hotel.rooms) {
      const key = r.type ?? "Unknown";
      const status = String(r.status ?? "").toLowerCase();
      const entry = map.get(key) ?? {
        price: r.pricePerNight ?? 0,
        total: 0,
        available: 0,
      };
      entry.total += 1;
      if (status === "available") entry.available += 1;
      // prefer lowest price per type
      if (!entry.price || (r.pricePerNight ?? 0) < entry.price)
        entry.price = r.pricePerNight ?? 0;
      map.set(key, entry);
    }
    return Array.from(map.entries()).map(([type, info]) => ({ type, ...info }));
  }, [hotel]);

  // Set default selected type when roomTypes change
  React.useEffect(() => {
    if (roomTypes.length > 0 && !selectedRoomType) {
      // Pick first available type
      const firstAvailable = roomTypes.find((rt) => rt.available > 0);
      if (firstAvailable) setSelectedRoomType(firstAvailable.type);
    }
    // If selected type is no longer available, reset
    else if (selectedRoomType) {
      const found = roomTypes.find((rt) => rt.type === selectedRoomType);
      if (!found || found.available < 1) setSelectedRoomType("");
    }
  }, [roomTypes, selectedRoomType]);

  // Estimate price for selected room type
  const estimatedPrice = useMemo(() => {
    const t = roomTypes.find((rt) => rt.type === selectedRoomType);
    return t ? t.price.toFixed(2) : "0.00";
  }, [roomTypes, selectedRoomType]);

  // Can book if a type is selected and available
  const canBook = useMemo(() => {
    const t = roomTypes.find((rt) => rt.type === selectedRoomType);
    return t && t.available > 0;
  }, [roomTypes, selectedRoomType]);

  const handleBook = () => {
    if (!selectedRoomType) {
      alert("Please select a room type.");
      return;
    }
    const t = roomTypes.find((rt) => rt.type === selectedRoomType);
    if (!t || t.available < 1) {
      alert("No available rooms for selected type.");
      return;
    }
    // Only booking 1 room
    const roomsParam = `${encodeURIComponent(selectedRoomType)}:1`;
    const url = `/reservation?hotelId=${hotelId}&rooms=${roomsParam}&occupants=${occupants}`;
    router.push(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 dark:from-gray-900 dark:to-gray-950">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <HotelSkeleton />
        </main>
      </div>
    );
  }

  if (isError || !hotel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 dark:from-gray-900 dark:to-gray-950">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="rounded-lg bg-white/80 dark:bg-gray-800/70 p-8 text-center shadow-lg">
            <h2 className="text-2xl font-semibold">Hotel not found</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Unable to load hotel details.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 dark:from-gray-900 dark:to-gray-950">
      <NavBar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <div className="rounded-lg overflow-hidden shadow-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <div className="relative">
            <img
              src={hotel.images?.[0] ?? "/images/hotel-1.jpg"}
              alt={hotel.name}
              className="w-full h-64 object-cover"
              loading="lazy"
              style={{ objectPosition: "center" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-6 text-white drop-shadow-lg">
              <h1 className="text-4xl font-extrabold">{hotel.name}</h1>
              <div className="mt-1 flex items-center gap-2 text-gray-200">
                <MapPin className="h-4 w-4" />
                <span>
                  {hotel.city ?? ""}
                  {hotel.city && hotel.country ? ", " : ""}
                  {hotel.country ?? ""}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: main info */}
            <div className="lg:col-span-2 pr-0 lg:pr-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  About this hotel
                </h2>
                <p className="mt-3 text-gray-700 dark:text-gray-300 max-w-3xl text-lg">
                  {hotel.description}
                </p>
              </div>
              {/* Room preview */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                  Room Types Overview
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {roomTypes.map((t) => (
                    <div
                      key={t.type}
                      className="rounded-md p-4 bg-slate-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 flex flex-col gap-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.type}</span>
                        <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 rounded-full px-2 py-0.5">
                          ${t.price.toFixed(2)} per night
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {t.available} available out of {t.total}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Booking panel */}
            <aside
              className="rounded-md p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg flex flex-col justify-between"
              aria-labelledby="booking-panel-title"
            >
              <div>
                <h3
                  id="booking-panel-title"
                  className="text-xl font-semibold mb-4 text-gray-900 dark:text-white"
                >
                  Book Your Room
                </h3>
                {/* Room type selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Room Type
                  </label>
                  <select
                    aria-label="Room Type"
                    value={selectedRoomType}
                    onChange={(e) => setSelectedRoomType(e.target.value)}
                    className="rounded-md px-4 py-2 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/70 text-base w-full"
                  >
                    <option value="">Select room type</option>
                    {roomTypes.map((t) => (
                      <option
                        key={t.type}
                        value={t.type}
                        disabled={t.available < 1}
                      >
                        {t.type} (${t.price.toFixed(2)}, {t.available}{" "}
                        available)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Occupants selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Occupants
                  </label>
                  <div className="flex items-center gap-3">
                    <select
                      aria-label="Number of occupants"
                      value={occupants}
                      onChange={(e) => setOccupants(Number(e.target.value))}
                      className="rounded-md px-4 py-2 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/70 text-base"
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "person" : "people"}
                        </option>
                      ))}
                    </select>
                    <div className="text-xs text-gray-500 dark:text-gray-300">
                      Guests / rooms and availability may vary
                    </div>
                  </div>
                </div>

                {/* Price estimate */}
                <div className="mb-8">
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Estimated from
                  </div>
                  <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-300">
                    ${estimatedPrice}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    * Final price may vary based on selection and availability.
                  </div>
                </div>
              </div>

              {/* Book button */}
              <div>
                <Button
                  onClick={handleBook}
                  className="w-full text-lg font-semibold py-3"
                  disabled={!canBook}
                  aria-disabled={!canBook}
                  title={
                    !canBook
                      ? "Please select a room type to book"
                      : "Book selected room"
                  }
                >
                  {canBook ? "Book Now" : "Unavailable"}
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
