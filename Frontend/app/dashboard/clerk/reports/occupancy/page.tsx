"use client";
import { useEffect, useState } from "react";
import NavBar from "@/components/nav-bar";
import ClerkSidebar from "@/components/ui/ClerkSidebar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DownloadCloud,
  BarChart3,
  Calendar as CalendarIcon,
  Building,
  Bed,
  Users,
  Target,
  TrendingUp,
  PieChart,
  Eye,
  Filter,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Hotel {
  id: string | number;
  name: string;
}
interface Room {
  id: string | number;
  type: string;
  status: string;
}
interface Reservation {
  id: string | number;
  roomType: string;
  roomId: string | number;
  status: string;
  arrivalDate: string;
  departureDate: string;
}
interface OccupancyDay {
  date: string;
  roomsOccupied: number;
  roomsAvailable: number;
  occupancyRate: number;
}

function getDefaultDates() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return {
    from: firstDay.toISOString().slice(0, 10),
    to: lastDay.toISOString().slice(0, 10),
  };
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function exportToCsv(data: any[], filename: string) {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => `"${String(row[header] || "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
}

export default function ClerkOccupancyReportPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string | number | "">("");
  const [hotelName, setHotelName] = useState<string>("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState<OccupancyDay[]>([]);

  // Date filter states
  const defaultDates = getDefaultDates();
  const [from, setFrom] = useState<string>(defaultDates.from);
  const [to, setTo] = useState<string>(defaultDates.to);

  useEffect(() => {
    async function fetchHotels() {
      const res = await fetch("http://localhost:5000/api/hotels");
      const data = await res.json();
      setHotels(data.data || []);
    }
    fetchHotels();
  }, []);

  useEffect(() => {
    async function fetchHotelData() {
      if (!selectedHotel) {
        setRooms([]);
        setHotelName("");
        setDays([]);
        setReservations([]);
        return;
      }
      setLoading(true);
      try {
        const hotelRes = await fetch(
          `http://localhost:5000/api/hotels/${selectedHotel}`
        );
        const hotelData = await hotelRes.json();
        setRooms(hotelData.data?.rooms || []);
        setHotelName(hotelData.data?.name || "");

        // Fetch reservations for the hotel and date range
        const token = localStorage.getItem("token");
        const reservationsRes = await fetch(
          `http://localhost:5000/api/reservations/all?hotelId=${selectedHotel}&from=${from}&to=${to}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const reservationsData = await reservationsRes.json();
        setReservations(reservationsData.reservations || []);

        // Fetch daily occupancy breakdown from your API
        const occupancyRes = await fetch(
          `http://localhost:5000/api/reports/occupancy?hotelId=${selectedHotel}&from=${from}&to=${to}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const occupancyData = await occupancyRes.json();
        setDays(occupancyData.daily || occupancyData.report || []);
      } catch (e) {
        setRooms([]);
        setReservations([]);
        setHotelName("");
        setDays([]);
      } finally {
        setLoading(false);
      }
    }
    fetchHotelData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHotel, from, to]);

  // Derived stats
  const totalRooms = rooms.length;
  const roomTypesMap: {
    [type: string]: { total: number; occupied: number; reserved: number };
  } = {};
  rooms.forEach((room) => {
    const type = room.type;
    if (!roomTypesMap[type]) {
      roomTypesMap[type] = { total: 0, occupied: 0, reserved: 0 };
    }
    roomTypesMap[type].total += 1;
    if (room.status === "occupied") roomTypesMap[type].occupied += 1;
    if (room.status === "reserved") roomTypesMap[type].reserved += 1;
  });

  // Also count reserved/occupied by reservations (not just room status)
  reservations.forEach((res) => {
    const type = res.roomType;
    if (!roomTypesMap[type]) return;
    if (res.status === "checked-in") roomTypesMap[type].occupied += 1;
    if (res.status === "reserved") roomTypesMap[type].reserved += 1;
  });

  // Total occupied and reserved
  const totalOccupied = Object.values(roomTypesMap).reduce(
    (sum, v) => sum + v.occupied,
    0
  );
  const totalReserved = Object.values(roomTypesMap).reduce(
    (sum, v) => sum + v.reserved,
    0
  );

  // Total room nights
  const totalRoomNights = reservations.reduce((sum, res) => {
    const arrival = new Date(res.arrivalDate);
    const departure = new Date(res.departureDate);
    const nights =
      (departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24);
    return sum + Math.max(1, nights);
  }, 0);

  // Occupancy metrics
  const currentOccupancyRate =
    totalRooms > 0 ? (totalOccupied / totalRooms) * 100 : 0;
  const totalAvailable = totalRooms - totalOccupied - totalReserved;

  // Daily occupancy stats
  const avgDailyOccupancy =
    days.length > 0
      ? days.reduce((sum, day) => sum + day.occupancyRate, 0) / days.length
      : 0;
  const peakOccupancy = Math.max(...days.map((day) => day.occupancyRate), 0);
  const lowOccupancy = Math.min(...days.map((day) => day.occupancyRate), 100);

  const getOccupancyLevel = (rate: number) => {
    if (rate >= 90)
      return {
        color: "text-green-700",
        bg: "bg-green-50",
        badge: "bg-green-100 text-green-800",
      };
    if (rate >= 70)
      return {
        color: "text-blue-700",
        bg: "bg-blue-50",
        badge: "bg-blue-100 text-blue-800",
      };
    if (rate >= 50)
      return {
        color: "text-yellow-700",
        bg: "bg-yellow-50",
        badge: "bg-yellow-100 text-yellow-800",
      };
    if (rate >= 30)
      return {
        color: "text-orange-700",
        bg: "bg-orange-50",
        badge: "bg-orange-100 text-orange-800",
      };
    return {
      color: "text-red-700",
      bg: "bg-red-50",
      badge: "bg-red-100 text-red-800",
    };
  };

  const handleExportData = () => {
    const exportData = days.map((day) => ({
      Date: day.date,
      RoomsOccupied: day.roomsOccupied,
      RoomsAvailable: day.roomsAvailable,
      OccupancyRate: `${day.occupancyRate.toFixed(1)}%`,
      Status:
        day.occupancyRate >= 90
          ? "High"
          : day.occupancyRate >= 70
          ? "Good"
          : day.occupancyRate >= 50
          ? "Moderate"
          : day.occupancyRate >= 30
          ? "Low"
          : "Very Low",
    }));
    exportToCsv(exportData, `Occupancy_Report_${hotelName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      <ClerkSidebar />

      <main className="ml-60 pt-16 min-h-screen">
        <div className="py-8 px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Occupancy Analytics
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Track room utilization, occupancy rates, and performance
                  metrics
                </p>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <Card className="shadow-lg border-0 mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Select Hotel
                    </Label>
                    <Select
                      value={String(selectedHotel)}
                      onValueChange={setSelectedHotel}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a hotel..." />
                      </SelectTrigger>
                      <SelectContent>
                        {hotels.map((h) => (
                          <SelectItem key={h.id} value={String(h.id)}>
                            {h.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Date Range
                    </Label>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          type="date"
                          value={from}
                          max={to}
                          onChange={(e) => setFrom(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="date"
                          value={to}
                          min={from}
                          onChange={(e) => setTo(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    disabled={!days.length}
                    onClick={handleExportData}
                  >
                    <DownloadCloud className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {!selectedHotel && (
            <Card className="shadow-lg border-0">
              <CardContent className="py-16 text-center">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a Hotel
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Choose a hotel from the dropdown above to view detailed
                  occupancy analytics and performance reports.
                </p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="shadow-lg border-0">
              <CardContent className="py-16 text-center">
                <div className="animate-pulse">
                  <BarChart3 className="h-16 w-16 text-blue-300 mx-auto mb-4" />
                  <p className="text-gray-600">Loading occupancy data...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedHotel && !loading && (
            <>
              {/* Key Performance Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-blue-500 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Rooms
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {totalRooms}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Property capacity
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Bed className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-green-500 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Current Occupancy
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {currentOccupancyRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {totalOccupied} rooms occupied
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-purple-500 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Reserved
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {totalReserved}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Upcoming bookings
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Target className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-amber-500 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Available
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {totalAvailable}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Ready for booking
                        </p>
                      </div>
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Room Category Breakdown */}
              <Card className="shadow-lg border-0 mb-8">
                <CardHeader className="border-b border-gray-200 pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <PieChart className="h-5 w-5 text-blue-600" />
                    Room Category Analysis
                  </CardTitle>
                  <CardDescription>
                    Detailed breakdown of room types and their current status
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-semibold">
                            Room Type
                          </TableHead>
                          <TableHead className="font-semibold text-right">
                            Total Rooms
                          </TableHead>
                          <TableHead className="font-semibold text-right">
                            Occupied
                          </TableHead>
                          <TableHead className="font-semibold text-right">
                            Reserved
                          </TableHead>
                          <TableHead className="font-semibold text-right">
                            Available
                          </TableHead>
                          <TableHead className="font-semibold text-center">
                            Utilization
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(roomTypesMap).map(([type, stats]) => {
                          const available =
                            stats.total - stats.occupied - stats.reserved;
                          const utilization =
                            (stats.occupied / stats.total) * 100;
                          const level = getOccupancyLevel(utilization);

                          return (
                            <TableRow
                              key={type}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <TableCell className="font-medium">
                                {type}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {stats.total}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-green-600 font-semibold">
                                  {stats.occupied}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-blue-600 font-semibold">
                                  {stats.reserved}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-gray-600">
                                  {available}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={level.badge}>
                                  {utilization.toFixed(1)}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Occupancy Breakdown */}
              <Card className="shadow-lg border-0">
                <CardHeader className="border-b border-gray-200 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        Daily Occupancy Timeline
                      </CardTitle>
                      <CardDescription>
                        {hotelName} • {formatDate(from)} to {formatDate(to)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4 mt-2 sm:mt-0">
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">
                          {avgDailyOccupancy.toFixed(1)}%
                        </span>{" "}
                        avg occupancy
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {days.length} Days
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold text-right">
                            Occupied
                          </TableHead>
                          <TableHead className="font-semibold text-right">
                            Available
                          </TableHead>
                          <TableHead className="font-semibold text-right">
                            Occupancy Rate
                          </TableHead>
                          <TableHead className="font-semibold text-center">
                            Performance
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {days.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center py-12"
                            >
                              <div className="flex flex-col items-center justify-center text-gray-500">
                                <Eye className="h-12 w-12 mb-4 text-gray-300" />
                                <p className="text-lg font-medium mb-2">
                                  No occupancy data
                                </p>
                                <p className="text-sm">
                                  No daily occupancy records found for the
                                  selected period
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          days.map((day) => {
                            const level = getOccupancyLevel(day.occupancyRate);
                            return (
                              <TableRow
                                key={day.date}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <TableCell className="font-medium">
                                  <div className="flex flex-col">
                                    <span>{formatDate(day.date)}</span>
                                    <span className="text-xs text-gray-500">
                                      {day.date}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {day.roomsOccupied}
                                </TableCell>
                                <TableCell className="text-right text-gray-600">
                                  {day.roomsAvailable}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className={`font-bold ${level.color}`}>
                                    {day.occupancyRate.toFixed(1)}%
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className={level.badge}>
                                    {day.occupancyRate >= 90
                                      ? "High"
                                      : day.occupancyRate >= 70
                                      ? "Good"
                                      : day.occupancyRate >= 50
                                      ? "Moderate"
                                      : day.occupancyRate >= 30
                                      ? "Low"
                                      : "Very Low"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Insights */}
              {days.length > 0 && (
                <Card className="shadow-lg border-0 mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5 text-blue-600" />
                      Performance Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg">
                        <div className="text-2xl font-bold text-green-700">
                          {peakOccupancy.toFixed(1)}%
                        </div>
                        <div className="text-sm font-medium text-green-800">
                          Peak Occupancy
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Best performing day
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700">
                          {avgDailyOccupancy.toFixed(1)}%
                        </div>
                        <div className="text-sm font-medium text-blue-800">
                          Average Occupancy
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Period average
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg">
                        <div className="text-2xl font-bold text-red-700">
                          {lowOccupancy.toFixed(1)}%
                        </div>
                        <div className="text-sm font-medium text-red-800">
                          Lowest Occupancy
                        </div>
                        <div className="text-xs text-red-600 mt-1">
                          Needs improvement
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 text-sm text-gray-600">
                      <p>
                        <strong>Performance Guidelines:</strong> Aim for
                        consistent occupancy above 70% for optimal revenue. Days
                        below 30% indicate need for promotional strategies or
                        rate adjustments.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
