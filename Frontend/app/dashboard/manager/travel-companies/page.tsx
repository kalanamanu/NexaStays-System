"use client";
import { useEffect, useState } from "react";
import NavBar from "@/components/nav-bar";
import ManagerSidebar from "@/components/ui/ManagerSidebar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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
import {
  DownloadCloud,
  Calendar as CalendarIcon,
  Briefcase,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users2,
  DollarSign,
  Hotel,
} from "lucide-react";

interface Hotel {
  id: string | number;
  name: string;
}
interface BlockBooking {
  id: string | number;
  travelCompany: {
    companyName: string;
    companyRegNo: string;
    phone: string;
  };
  hotel: { name: string };
  arrivalDate: string;
  departureDate: string;
  discountRate: number;
  totalAmount: number;
  status: string;
  roomTypes: {
    id: string | number;
    roomType: string;
    rooms: number;
  }[];
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

function formatDisplayDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function exportCsv(bookings: BlockBooking[], hotelName: string) {
  if (!bookings.length) return;
  const header = [
    "ID",
    "Company Name",
    "Hotel",
    "Arrival Date",
    "Departure Date",
    "Room Types",
    "Discount Rate",
    "Total Amount (LKR)",
    "Status",
  ];
  const rows = bookings.map((b) => [
    b.id,
    b.travelCompany?.companyName || "",
    b.hotel?.name || "",
    b.arrivalDate,
    b.departureDate,
    b.roomTypes.map((rt) => `${rt.roomType} x${rt.rooms}`).join("; "),
    `${b.discountRate}%`,
    b.totalAmount,
    b.status,
  ]);
  const csvContent = [header, ...rows]
    .map((row) =>
      row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
    )
    .join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `TravelCompany_BlockBookings_${hotelName || "Hotel"}.csv`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function TravelCompanyBookingsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string | number | "">("");
  const [hotelName, setHotelName] = useState<string>("");
  const [blockBookings, setBlockBookings] = useState<BlockBooking[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Move fetchBookings to component scope
  async function fetchBookings() {
    if (!selectedHotel) {
      setBlockBookings([]);
      setHotelName("");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = `http://localhost:5000/api/manager/travel-companies/block-bookings?hotelId=${selectedHotel}&from=${from}&to=${to}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      setBlockBookings(data.blockBookings || []);
      const h = hotels.find((h) => String(h.id) === String(selectedHotel));
      setHotelName(h ? h.name : "");
    } catch (e) {
      setBlockBookings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHotel, hotels, from, to]);

  async function approveBooking(id: string | number) {
    const token = localStorage.getItem("token");
    try {
      await fetch(
        `http://localhost:5000/api/manager/travel-companies/block-bookings/${id}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      // Refresh bookings
      fetchBookings();
    } catch (e) {}
  }

  async function rejectBooking(id: string | number) {
    const token = localStorage.getItem("token");
    try {
      await fetch(
        `http://localhost:5000/api/manager/travel-companies/block-bookings/${id}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      // Refresh bookings
      fetchBookings();
    } catch (e) {}
  }

  // KPI Card calculations
  const totalBookings = blockBookings.length;
  const approvedBookings = blockBookings.filter(
    (b) => b.status === "reserved"
  ).length;
  const pendingBookings = blockBookings.filter(
    (b) => b.status !== "reserved" && b.status !== "rejected"
  ).length;
  const totalAmount = blockBookings
    .filter((b) => b.status === "reserved")
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // Status badge color
  const getStatusBadge = (status: string) => {
    if (status === "reserved") return "bg-green-100 text-green-800";
    if (status === "rejected") return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <ManagerSidebar />
      <main className="ml-60 pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto py-8 px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                  <Briefcase className="h-8 w-8 text-yellow-700" />
                  Travel Company Block Bookings
                </h1>
                <p className="text-gray-600">
                  Approve, reject, and export company block bookings for your
                  hotels.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                  disabled={!blockBookings.length}
                  onClick={() => exportCsv(blockBookings, hotelName)}
                >
                  <DownloadCloud className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <Card className="shadow-lg border-0 mb-8 bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Hotel className="h-4 w-4" />
                      Select Hotel
                    </label>
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
                    <label className="text-sm font-medium flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Date Range
                    </label>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <input
                          type="date"
                          value={from}
                          max={to}
                          onChange={(e) => setFrom(e.target.value)}
                          className="w-full border rounded px-2 py-1"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="date"
                          value={to}
                          min={from}
                          onChange={(e) => setTo(e.target.value)}
                          className="w-full border rounded px-2 py-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-yellow-50 backdrop-blur-sm border-l-4 border-l-yellow-500 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Bookings
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalBookings}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Users2 className="h-6 w-6 text-yellow-800" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 backdrop-blur-sm border-l-4 border-l-green-500 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Approved Bookings
                    </p>
                    <p className="text-2xl font-bold text-green-700">
                      {approvedBookings}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-50 backdrop-blur-sm border-l-4 border-l-red-500 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Pending Bookings
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {pendingBookings}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 backdrop-blur-sm border-l-4 border-l-blue-500 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Approved Amount (LKR)
                    </p>
                    <p className="text-2xl font-bold text-blue-700">
                      {totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table Section */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="border-b border-gray-200 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Briefcase className="h-5 w-5 text-yellow-700" />
                    Block Booking Records
                  </CardTitle>
                  <CardDescription>
                    All block bookings for{" "}
                    <span className="font-medium">
                      {hotelName || "selected hotel"}
                    </span>{" "}
                    from {from} to {to}
                  </CardDescription>
                </div>
                <Badge
                  className="bg-yellow-50 text-yellow-700 border-yellow-200"
                  variant="outline"
                >
                  {blockBookings.length} Records
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!selectedHotel && (
                <div className="py-16 text-center">
                  <Briefcase className="h-16 w-16 text-yellow-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Select a Hotel
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Choose a hotel from above to view block bookings.
                  </p>
                </div>
              )}
              {loading && (
                <div className="py-16 text-center">
                  <div className="animate-pulse">
                    <Briefcase className="h-16 w-16 text-yellow-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Loading block booking records...
                    </p>
                  </div>
                </div>
              )}
              {selectedHotel && !loading && (
                <div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm rounded-lg overflow-hidden">
                      <thead className="bg-yellow-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            ID
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Company Name
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Hotel
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Arrival
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Departure
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Room Types
                          </th>
                          <th className="px-4 py-2 text-right font-semibold text-gray-700">
                            Discount Rate
                          </th>
                          <th className="px-4 py-2 text-right font-semibold text-gray-700">
                            Amount (LKR)
                          </th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-700">
                            Status
                          </th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-700">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {blockBookings.length === 0 ? (
                          <tr>
                            <td
                              colSpan={10}
                              className="text-center text-gray-400 py-12"
                            >
                              <AlertCircle className="inline-block mr-2 h-5 w-5 text-gray-300" />
                              No block bookings found for selected criteria.
                            </td>
                          </tr>
                        ) : (
                          blockBookings.map((b) => (
                            <tr
                              key={b.id}
                              className="hover:bg-yellow-50 transition-colors"
                            >
                              <td className="px-4 py-2 font-medium text-gray-900">
                                {b.id}
                              </td>
                              <td className="px-4 py-2">
                                {b.travelCompany?.companyName}
                              </td>
                              <td className="px-4 py-2">{b.hotel?.name}</td>
                              <td className="px-4 py-2">
                                {formatDisplayDate(b.arrivalDate)}
                              </td>
                              <td className="px-4 py-2">
                                {formatDisplayDate(b.departureDate)}
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex flex-col gap-1">
                                  {b.roomTypes.map((rt) => (
                                    <span
                                      key={rt.id}
                                      className="bg-yellow-100 text-yellow-800 rounded px-2 py-0.5 text-xs font-medium inline-block"
                                    >
                                      {rt.roomType} x{rt.rooms}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right">
                                {b.discountRate}%
                              </td>
                              <td className="px-4 py-2 text-right">
                                {b.totalAmount?.toLocaleString()}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <Badge className={getStatusBadge(b.status)}>
                                  {b.status === "reserved"
                                    ? "Approved"
                                    : b.status === "rejected"
                                    ? "Rejected"
                                    : "Pending"}
                                </Badge>
                              </td>
                              <td className="px-4 py-2 text-center">
                                {b.status !== "reserved" &&
                                b.status !== "rejected" ? (
                                  <div className="flex gap-2 justify-center">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="bg-green-600 text-white"
                                      onClick={() => approveBooking(b.id)}
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="bg-red-600 text-white"
                                      onClick={() => rejectBooking(b.id)}
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-6 text-xs text-gray-500 leading-relaxed">
                    <strong>Tip:</strong> Approve or reject block bookings to
                    confirm or decline discounted company reservations. Export
                    booking data above.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
