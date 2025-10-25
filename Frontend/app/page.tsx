"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Hotel,
  Wifi,
  Car,
  Star,
  MapPin,
  Users,
  Shield,
  Award,
  Sparkles,
} from "lucide-react";
import NavBar from "@/components/nav-bar";
import HotelsSection from "@/components/HotelSection";
import { motion, easeInOut } from "framer-motion";
import Footer from "@/components/Footer";

// Updated taglines for Nexa Stays
const taglines = [
  "Seamless bookings, hassle-free check-ins.",
  "World-class hospitality at your fingertips.",
  "Book Today. Relax Tomorrow.",
];
function Typewriter() {
  const [current, setCurrent] = useState(0);
  const [sub, setSub] = useState("");
  useEffect(() => {
    let i = 0;
    setSub("");
    const interval = setInterval(() => {
      setSub(taglines[current].slice(0, i + 1));
      i++;
      if (i === taglines[current].length) {
        clearInterval(interval);
        setTimeout(() => {
          setCurrent((c) => (c + 1) % taglines.length);
        }, 1500);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [current]);
  return (
    <span className="inline-block text-xl md:text-2xl font-semibold bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-400 bg-clip-text text-transparent h-8 min-w-[250px]">
      {sub}
    </span>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

const floatingVariants = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 3,
      repeat: Number.POSITIVE_INFINITY,
      ease: easeInOut,
    },
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <NavBar />

      {/* Hero Section */}
      <section className="relative min-h-screen w-full flex items-center overflow-hidden">
        {/* BG image */}
        <div className="absolute inset-0 w-full h-full -z-20">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/image.jpg')",
              filter: "brightness(0.93)",
            }}
          />
        </div>
        {/* Gradient overlay */}
        <div
          className="
          absolute inset-0 w-full h-full
          bg-gradient-to-r
          from-black/90 via-black/70 to-transparent
          dark:from-black/95 dark:via-black/80 dark:to-transparent
          pointer-events-none
          z-10
        "
        />
        {/* CSS Grid Overlay */}
        <div
          className="absolute inset-0 w-full h-full pointer-events-none z-30 animate-grid-move"
          style={{
            backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.13) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.13) 1px, transparent 1px)
          `,
            backgroundSize: "40px 40px",
            mixBlendMode: "overlay",
          }}
        ></div>
        {/* Content */}
        <div
          className="
          flex flex-col
          justify-center
          items-start
          max-w-4xl w-full
          px-8 md:px-16 lg:px-0
          mx-auto
          py-0
          space-y-6
          z-40
        "
          style={{
            marginLeft: "clamp(32px, 14vw, 196px)",
          }}
        >
          <h1
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-2
          bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent"
          >
            Welcome to <br /> Nexa Stays
          </h1>
          <Typewriter />
          <p className="mt-2 text-l md:text-xl text-white/90 font-medium mb-3 max-w-2xl">
            Experience seamless bookings, hassle free check-ins, and world class
            hospitality at your fingertips.
          </p>
          <div className="flex gap-4 mt-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link href="/reservation">
                <Button
                  className="px-7 py-3 text-base font-bold rounded-xl
                  bg-gradient-to-r from-purple-500 to-indigo-500
                  shadow-md border-0 transition-all duration-200
                  hover:from-indigo-500 hover:to-purple-500
                  hover:ring-2 hover:ring-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-400
                "
                  style={{ minWidth: "150px" }}
                >
                  Book Your Stay
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link href="/register">
                <Button
                  variant="outline"
                  className="px-7 py-3 text-base font-bold rounded-xl
                  border-2 border-indigo-300 text-white
                  bg-white/10
                  hover:bg-indigo-400 hover:text-black
                  transition-all duration-200 shadow-md
                  focus-visible:ring-2 focus-visible:ring-indigo-400
                "
                  style={{ minWidth: "150px" }}
                >
                  Register
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Gradient Background for Rest of Page */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                Why Choose Nexa Stays?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Discover the perfect blend of convenience, comfort, and
                exceptional service
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[
                {
                  icon: Hotel,
                  title: "Premium Locations",
                  description:
                    "Prime locations in major cities islandwide with breathtaking views and easy access to attractions",
                  gradient: "from-purple-500 to-pink-500",
                },
                {
                  icon: Wifi,
                  title: "Modern Amenities",
                  description:
                    "High-speed WiFi, state-of-the-art fitness centers, and world-class business facilities",
                  gradient: "from-indigo-500 to-purple-500",
                },
                {
                  icon: Car,
                  title: "Luxury Services",
                  description:
                    "Complimentary valet parking, airport shuttle, and 24/7 premium concierge service",
                  gradient: "from-pink-500 to-rose-500",
                },
                {
                  icon: Shield,
                  title: "Safety First",
                  description:
                    "Advanced security systems and health protocols ensuring your peace of mind",
                  gradient: "from-emerald-500 to-teal-500",
                },
                {
                  icon: Award,
                  title: "Award Winning",
                  description:
                    "Recognized globally for excellence in hospitality and customer satisfaction",
                  gradient: "from-amber-500 to-orange-500",
                },
                {
                  icon: Users,
                  title: "Personalized Experience",
                  description:
                    "Tailored services and personalized attention to make your stay truly memorable",
                  gradient: "from-cyan-500 to-blue-500",
                },
              ].map((feature, index) => (
                <motion.div key={feature.title} variants={itemVariants}>
                  <motion.div
                    whileHover={{
                      scale: 1.05,
                      rotateY: 5,
                      boxShadow: "0 25px 50px rgba(0, 0, 0, 0.1)",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Card className="h-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                      <CardHeader className="text-center pb-4">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                          className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center shadow-lg`}
                        >
                          <feature.icon className="h-8 w-8 text-white" />
                        </motion.div>
                        <CardTitle className="text-xl font-bold text-gray-800 dark:text-white">
                          {feature.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Room Types Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                Premium Accommodations
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Choose from our carefully curated selection of premium
                accommodations
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {[
                {
                  name: "Standard",

                  image: "/images/room-standard.jpg",
                  features: ["Queen Bed", "City View", "WiFi", "Mini Bar"],
                  gradient: "from-blue-400 to-purple-500",
                  popular: false,
                },
                {
                  name: "Deluxe",

                  image: "/images/room-deluxe.jpg",
                  features: [
                    "King Bed",
                    "Ocean View",
                    "Balcony",
                    "Room Service",
                  ],
                  gradient: "from-purple-500 to-pink-500",
                  popular: true,
                },
                {
                  name: "Suite",

                  image: "/images/room-suite.jpg",
                  features: [
                    "Separate Living",
                    "Premium View",
                    "Kitchenette",
                    "Concierge",
                  ],
                  gradient: "from-pink-500 to-rose-500",
                  popular: false,
                },
                {
                  name: "Residential Suite",

                  image: "/images/room-residential.jpg",
                  features: [
                    "Full Kitchen",
                    "Washer/Dryer",
                    "Multiple Rooms",
                    "Butler Service",
                  ],
                  gradient: "from-indigo-500 to-purple-600",
                  popular: false,
                },
              ].map((room, index) => (
                <motion.div key={room.name} variants={itemVariants}>
                  <motion.div
                    whileHover={{
                      scale: 1.05,
                      rotateY: 5,
                      boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="relative"
                  >
                    {room.popular && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          delay: 0.5,
                          type: "spring",
                          stiffness: 500,
                        }}
                        className="absolute -top-3 -right-3 z-10"
                      >
                        <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                          <Star className="h-4 w-4 inline mr-1" />
                          Popular
                        </div>
                      </motion.div>
                    )}

                    <Card className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                      <CardHeader className="p-0">
                        {/* Room image */}
                        <div className="relative aspect-video overflow-hidden">
                          <img
                            src={room.image}
                            alt={room.name}
                            className="w-full h-full object-cover"
                          />
                          {/* Optional gradient overlay for style */}
                          <div
                            className={`absolute inset-0 bg-gradient-to-r ${room.gradient} opacity-40`}
                          />
                          {/* Room name and price overlay */}
                          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 flex justify-between items-end z-10">
                            <h3 className="text-2xl font-bold text-white drop-shadow">
                              {room.name}
                            </h3>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 pt-8">
                        <ul className="space-y-3">
                          {room.features.map((feature, featureIndex) => (
                            <motion.li
                              key={feature}
                              initial={{ opacity: 0, x: -20 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              transition={{ delay: featureIndex * 0.1 }}
                              className="flex items-center text-gray-600 dark:text-gray-300"
                            >
                              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-3 flex-shrink-0"></div>
                              {feature}
                            </motion.li>
                          ))}
                        </ul>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="mt-6"
                        >
                          <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg shadow-lg">
                            Book Now
                          </Button>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
