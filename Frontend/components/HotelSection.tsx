"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import HotelCard, { Hotel } from "@/components/ui/HotelCard";
import { Button } from "@/components/ui/button";

/**
 * HotelsSection: maps hotels -> individual HotelCard components.
 * Motion wrapper is applied here so the card component stays focused on markup/styling.
 */

const HOTELS: Hotel[] = [
  {
    id: 1,
    name: "Oceanview Resort",
    city: "Maldives",
    country: "Maldives",
    rating: 4.8,
    startingPrice: 199,
    image: "/images/hotel-1.jpg",
    tag: "Resort",
    description:
      "Beachfront resort with stunning sea views and premium facilities.",
    status: "Available",
  },
  {
    id: 2,
    name: "Skyline Grand",
    city: "New York",
    country: "USA",
    rating: 4.6,
    startingPrice: 249,
    image: "/images/hotel-2.jpg",
    tag: "City Hotel",
    description: "Central hotel with rooftop bar and business facilities.",
    status: "Few rooms",
  },
  {
    id: 3,
    name: "Serene Bay Hotel",
    city: "Santorini",
    country: "Greece",
    rating: 4.9,
    startingPrice: 289,
    image: "/images/hotel-3.jpg",
    tag: "Boutique",
    description:
      "Clifftop views and boutique service in a picturesque island setting.",
    status: "Available",
  },
  {
    id: 4,
    name: "Cityscape Suites",
    city: "London",
    country: "UK",
    rating: 4.5,
    startingPrice: 179,
    image: "/images/hotel-4.jpg",
    tag: "Suites",
    description: "Comfortable stays with easy access to major attractions.",
    status: "Maintenance",
  },
  {
    id: 5,
    name: "Tropical Retreat",
    city: "Phuket",
    country: "Thailand",
    rating: 4.7,
    startingPrice: 159,
    image: "/images/hotel-5.jpg",
    tag: "Resort",
    description: "Lush tropical grounds and relaxing amenities.",
    status: "Available",
  },
  {
    id: 6,
    name: "Azure Heights",
    city: "Dubai",
    country: "UAE",
    rating: 4.6,
    startingPrice: 219,
    image: "/images/hotel-6.jpg",
    tag: "Luxury",
    description: "Modern skyscraper hotel with panoramic city views.",
    status: "Available",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: "easeOut" as const },
  }),
};

export default function HotelsSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Our Hotels
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-xl">
              Explore our curated hotel collection — handpicked locations and
              consistent quality.
            </p>
          </div>

          <div className="hidden sm:flex items-center space-x-3">
            <Link href="/hotels">
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                See all hotels
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {HOTELS.map((hotel, i) => (
            <motion.div
              key={hotel.id}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={cardVariants}
            >
              <HotelCard hotel={hotel} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
