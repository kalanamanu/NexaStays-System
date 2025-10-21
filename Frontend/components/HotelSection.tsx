"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MapPin } from "lucide-react";

/**
 * Sample hotels data. Replace with dynamic data fetched from your API.
 * Make sure to add images to /public/images/ (hotel-1.jpg, hotel-2.jpg, ...)
 */
const HOTELS = [
  {
    id: 1,
    name: "Oceanview Resort",
    city: "Maldives",
    country: "Maldives",
    rating: 4.8,
    startingPrice: "$199",
    image: "/images/hotel-1.jpg",
  },
  {
    id: 2,
    name: "Skyline Grand",
    city: "New York",
    country: "USA",
    rating: 4.6,
    startingPrice: "$249",
    image: "/images/hotel-2.jpg",
  },
  {
    id: 3,
    name: "Serene Bay Hotel",
    city: "Santorini",
    country: "Greece",
    rating: 4.9,
    startingPrice: "$289",
    image: "/images/hotel-3.jpg",
  },
  {
    id: 4,
    name: "Cityscape Suites",
    city: "London",
    country: "UK",
    rating: 4.5,
    startingPrice: "$179",
    image: "/images/hotel-4.jpg",
  },
  {
    id: 5,
    name: "Tropical Retreat",
    city: "Phuket",
    country: "Thailand",
    rating: 4.7,
    startingPrice: "$159",
    image: "/images/hotel-5.jpg",
  },
  {
    id: 6,
    name: "Azure Heights",
    city: "Dubai",
    country: "UAE",
    rating: 4.6,
    startingPrice: "$219",
    image: "/images/hotel-6.jpg",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" as const },
  }),
};

export default function HotelsSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Our Hotels
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Explore our curated hotel collection - handpicked locations,
              consistent quality.
            </p>
          </div>

          <div className="hidden sm:flex items-center space-x-3">
            <Link href="/hotels">
              <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                See all hotels
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {HOTELS.map((hotel, i) => (
            <motion.div
              key={hotel.id}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={cardVariants}
            >
              <Card className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="p-0">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      className="w-full h-full object-cover transform transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute left-4 top-4 bg-white/10 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-300" />
                      <span className="font-medium">{hotel.rating}</span>
                    </div>
                    <div className="absolute left-4 bottom-4 bg-gradient-to-r from-black/60 to-transparent text-white p-3 rounded-md">
                      <div className="text-lg font-bold">{hotel.name}</div>
                      <div className="text-sm text-white/80 flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {hotel.city}, {hotel.country}
                      </div>
                    </div>
                    <div className="absolute right-4 bottom-4 text-right">
                      <div className="text-sm text-white/80">From</div>
                      <div className="text-lg font-bold text-white">
                        {hotel.startingPrice}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Comfortable stays · Great locations · Trusted service
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <Link href={`/hotels/${hotel.id}`}>
                      <Button
                        variant="ghost"
                        className="text-indigo-600 border border-white/10"
                      >
                        View
                      </Button>
                    </Link>
                    <Link href={`/reservation?hotelId=${hotel.id}`}>
                      <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                        Book
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="sm:hidden mt-6 flex justify-center">
          <Link href="/hotels">
            <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
              Explore Hotels
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
