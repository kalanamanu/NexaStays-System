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

  // State: roomSelections is an object { [roomType]: count }
  const [roomSelections, setRoomSelections] = useState<{
    [type: string]: number;
  }>({});
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

  // Reset roomSelections if roomTypes change (e.g., after hotel loads)
  React.useEffect(() => {
    if (roomTypes.length > 0 && Object.keys(roomSelections).length === 0) {
      // Initialize all room types to 0
      const initial: { [type: string]: number } = {};
      for (const t of roomTypes) initial[t.type] = 0;
      setRoomSelections(initial);
    }
    // Remove types that are no longer present
    else if (roomTypes.length > 0) {
      setRoomSelections((prev) => {
        const updated: { [type: string]: number } = {};
        for (const t of roomTypes) {
          updated[t.type] = prev[t.type] ?? 0;
        }
        return updated;
      });
    }
  }, [roomTypes]);

  // Estimate price for all rooms
  const estimatedPrice = useMemo(() => {
    return roomTypes
      .reduce((sum, t) => {
        const count = roomSelections[t.type] || 0;
        return sum + count * t.price;
      }, 0)
      .toFixed(2);
  }, [roomTypes, roomSelections]);

  // Can book if at least one room is selected and all selections are valid
  const canBook = useMemo(() => {
    return (
      Object.values(roomSelections).some((count) => count > 0) &&
      roomTypes.every((t) => (roomSelections[t.type] ?? 0) <= t.available)
    );
  }, [roomSelections, roomTypes]);

  const handleRoomSelectionChange = (type: string, value: number) => {
    setRoomSelections((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleBook = () => {
    // At least one room type must be selected
    const selected = Object.entries(roomSelections).filter(
      ([_, count]) => count > 0
    );
    if (selected.length === 0) {
      alert("Please select at least one room.");
      return;
    }
    // Check for overbooking
    for (const [type, count] of selected) {
      const room = roomTypes.find((t) => t.type === type);
      if (!room || count > room.available) {
        alert(
          `Cannot book ${count} rooms for type "${type}": only ${
            room?.available ?? 0
          } available.`
        );
        return;
      }
    }
    // Build room selections for query string
    // Format: "Deluxe:2,Standard:1"
    const roomsParam = selected
      .map(([type, count]) => `${encodeURIComponent(type)}:${count}`)
      .join(",");

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
                  Book Your Rooms
                </h3>
                {/* Room type selections */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Select rooms{" "}
                    <span className="text-xs text-gray-500">(per type)</span>
                  </label>
                  <div className="space-y-3">
                    {roomTypes.map((t) => (
                      <div
                        key={t.type}
                        className="flex items-center gap-4 justify-between"
                      >
                        <span className="font-medium text-gray-800 dark:text-gray-100">
                          {t.type}{" "}
                          <span className="text-xs text-gray-500">
                            (${t.price.toFixed(2)}, {t.available} available)
                          </span>
                        </span>
                        <select
                          aria-label={`Number of ${t.type} rooms`}
                          value={roomSelections[t.type] ?? 0}
                          onChange={(e) =>
                            handleRoomSelectionChange(
                              t.type,
                              Number(e.target.value)
                            )
                          }
                          className="rounded-md px-4 py-2 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/70 text-base"
                        >
                          {Array.from(
                            { length: t.available + 1 },
                            (_, i) => i
                          ).map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Occupants selection */}
                <div className="mt-6">
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
                <div className="mt-8">
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
              <div className="pt-6">
                <Button
                  onClick={handleBook}
                  className="w-full text-lg font-semibold py-3"
                  disabled={!canBook}
                  aria-disabled={!canBook}
                  title={
                    !canBook
                      ? "Please select at least one room to book"
                      : "Book selected rooms"
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
