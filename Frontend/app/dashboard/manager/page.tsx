"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/nav-bar";
import ManagerSidebar from "@/components/ui/ManagerSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarCheck2,
  CalendarX2,
  ClipboardList,
  Users,
  TrendingUp,
  BarChart2,
  BedDouble,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Data interfaces
interface Hotel {
  id: number;
  name: string;
}
interface Reservation {
  id: number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  hotelId?: number;
  roomType?: string;
  roomNumber?: string;
  arrivalDate?: string;
  departureDate?: string;
  status?: string;
  guests?: number;
  totalAmount?: number;
  createdAt?: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  room?: {
    number?: string;
    type?: string;
  };
  hotel?: {
    id: number;
    name: string;
  };
  hotelName?: string;
}

export default function ManagerDashboard() {
  const [stats, setStats] = useState({
    todayCheckIns: 0,
    todayCheckOuts: 0,
    totalReservations: 0,
    totalRevenue: 0,
    currentlyCheckedIn: 0,
    suiteRevenue: 0,
  });
  const [travelCompanyRevenue, setTravelCompanyRevenue] = useState(0);
  const [recentReservations, setRecentReservations] = useState<Reservation[]>(
    []
  );
  const [hotels, setHotels] = useState<Hotel[]>([]);

  // Fetch hotels for name mapping (pass token!)
  useEffect(() => {
    async function fetchHotels() {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/hotels", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      setHotels(Array.isArray(data) ? data : data.data || []);
    }
    fetchHotels();
  }, []);

  // Fetch reservations and aggregate stats (pass token!)
  useEffect(() => {
    async function fetchStatsAndRecents() {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "http://localhost:5000/api/manager/get-all-reservations",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);

      let todayCheckIns = 0;
      let todayCheckOuts = 0;
      let currentlyCheckedIn = 0;
      let totalReservations = 0;
      let totalRevenue = 0;
      let suiteRevenue = 0;

      // Lookup hotel names
      const hotelsById = Object.fromEntries(
        hotels.map((h) => [String(h.id), h.name])
      );

      // Sort reservations (latest first)
      const sorted = Array.isArray(data)
        ? data
        : Array.isArray(data.reservations)
        ? data.reservations
        : [];

      // Stats calculation
      sorted.forEach((r: Reservation) => {
        const arrivalDate = r.arrivalDate?.slice(0, 10);
        const departureDate = r.departureDate?.slice(0, 10);
        if (arrivalDate === todayStr) todayCheckIns++;
        if (departureDate === todayStr) todayCheckOuts++;
        if (r.status === "checked-in") currentlyCheckedIn++;
        totalReservations++;
        totalRevenue += r.totalAmount || 0;
        // Prefer roomType from room relation if available
        const roomType = r.roomType || r.room?.type || "";
        if (roomType.toLowerCase().includes("suite"))
          suiteRevenue += r.totalAmount || 0;
      });

      // Attach hotel name for display (via relation if present, else lookup)
      const reservationsWithHotelName = sorted.map((r: Reservation) => ({
        ...r,
        hotelName: r.hotel?.name
          ? r.hotel.name
          : hotelsById[String(r.hotelId)] || "",
        roomNumber: r.room?.number || r.roomNumber,
        roomType: r.room?.type || r.roomType,
      }));

      setStats({
        todayCheckIns,
        todayCheckOuts,
        totalReservations,
        totalRevenue,
        currentlyCheckedIn,
        suiteRevenue,
      });

      setRecentReservations(reservationsWithHotelName.slice(0, 6));
    }
    fetchStatsAndRecents();
  }, [hotels]);

  // Fetch travel company block booking revenue
  useEffect(() => {
    async function fetchTravelCompanyRevenue() {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "http://localhost:5000/api/manager/reports/travel-company-revenue",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setTravelCompanyRevenue(data.totalRevenue || 0);
    }
    fetchTravelCompanyRevenue();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <NavBar />
      <ManagerSidebar />
      <main className="flex-1 ml-60 pt-16">
        <div className="py-8 px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Manager Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              View high-level hotel performance, occupancy, and revenue metrics.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 border-l-4 border-blue-500 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Today's Check-Ins
                </CardTitle>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CalendarCheck2 className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.todayCheckIns}
                </div>
                <p className="text-xs text-gray-500 mt-1">Arrivals today</p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 border-l-4 border-green-500 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Today's Check-Outs
                </CardTitle>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CalendarX2 className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.todayCheckOuts}
                </div>
                <p className="text-xs text-gray-500 mt-1">Departures today</p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 border-l-4 border-purple-500 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Reservations
                </CardTitle>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ClipboardList className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.totalReservations}
                </div>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 border-l-4 border-amber-500 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Currently Checked-In
                </CardTitle>
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Users className="h-5 w-5 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.currentlyCheckedIn}
                </div>
                <p className="text-xs text-gray-500 mt-1">Active guests</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue/Advanced Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white/80 border-l-4 border-blue-800 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Revenue (LKR)
                </CardTitle>
                <div className="p-2 bg-blue-200 rounded-lg">
                  <BarChart2 className="h-5 w-5 text-blue-800" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 border-l-4 border-green-800 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Suite Revenue (LKR)
                </CardTitle>
                <div className="p-2 bg-green-200 rounded-lg">
                  <BedDouble className="h-5 w-5 text-green-800" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.suiteRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">Residential suites</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reservations */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-lg text-gray-700 dark:text-gray-100 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Recent Reservations
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  (window.location.href = "/dashboard/manager/reservations")
                }
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="overflow-x-auto bg-white rounded-xl shadow">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Hotel</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReservations.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-gray-500"
                      >
                        No recent reservations
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentReservations.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {r.guestName ||
                              (r.customer &&
                                `${r.customer.firstName} ${r.customer.lastName}`)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {r.guestEmail || (r.customer && r.customer.email)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {r.hotelName}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold">{r.roomType}</span>
                            {r.roomNumber ? (
                              <span className="text-sm text-gray-600">
                                Room {r.roomNumber}
                              </span>
                            ) : (
                              <span className="text-sm text-amber-600">
                                Unassigned
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {r.arrivalDate?.slice(0, 10)}
                            </div>
                            <div className="text-gray-500">
                              to {r.departureDate?.slice(0, 10)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              r.status === "checked-in"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : r.status === "checked-out"
                                ? "bg-gray-100 text-gray-800 border-gray-200"
                                : r.status === "confirmed"
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : r.status === "reserved"
                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                : "font-medium px-2 py-1"
                            }
                          >
                            {r.status &&
                              r.status.charAt(0).toUpperCase() +
                                r.status.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
