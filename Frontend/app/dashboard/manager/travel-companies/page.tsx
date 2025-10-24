"use client";
import { useEffect, useState } from "react";
import NavBar from "@/components/nav-bar";
import ManagerSidebar from "@/components/ui/ManagerSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DownloadCloud,
  Calendar as CalendarIcon,
  Briefcase,
  CheckCircle2,
  XCircle,
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

  useEffect(() => {
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
  const hotelsWithBookings = Array.from(
    new Set(blockBookings.map((b) => b.hotel?.name))
  ).length;

  function fetchBookings() {
    setLoading(true);
    const token = localStorage.getItem("token");
    const url = `http://localhost:5000/api/manager/travel-companies/block-bookings?hotelId=${selectedHotel}&from=${from}&to=${to}`;
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setBlockBookings(data.blockBookings || []);
        setLoading(false);
      });
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      <ManagerSidebar />
      <main className="ml-60 pt-16 min-h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto py-8 px-4">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-6 w-6 text-yellow-700" />
                    Travel Company Block Bookings
                  </CardTitle>
                  <div className="text-gray-500 text-sm mt-1">
                    Approve or reject company block bookings and view reports.
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
                  <Select
                    value={String(selectedHotel)}
                    onValueChange={setSelectedHotel}
                  >
                    <SelectTrigger className="min-w-[220px] border-yellow-400">
                      <SelectValue placeholder="Select Hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotels.map((h) => (
                        <SelectItem key={h.id} value={String(h.id)}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 items-center">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className="flex items-center gap-1 text-xs">
                        <CalendarIcon className="w-3 h-3" />
                        From
                        <input
                          type="date"
                          className="rounded border px-1 py-0.5 text-xs"
                          value={from}
                          max={to}
                          onChange={(e) => setFrom(e.target.value)}
                        />
                      </label>
                      <label className="flex items-center gap-1 text-xs">
                        <CalendarIcon className="w-3 h-3" />
                        To
                        <input
                          type="date"
                          className="rounded border px-1 py-0.5 text-xs"
                          value={to}
                          min={from}
                          onChange={(e) => setTo(e.target.value)}
                        />
                      </label>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-yellow-500 shadow ml-2"
                      disabled={!blockBookings.length}
                      onClick={() => exportCsv(blockBookings, hotelName)}
                    >
                      <DownloadCloud className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardHeader>
                    <div className="text-xs text-gray-500">
                      Total Block Bookings
                    </div>
                    <div className="text-2xl font-bold">{totalBookings}</div>
                  </CardHeader>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardHeader>
                    <div className="text-xs text-gray-500">Approved</div>
                    <div className="text-2xl font-bold text-green-700">
                      {approvedBookings}
                    </div>
                  </CardHeader>
                </Card>
                <Card className="bg-red-50 border-red-200">
                  <CardHeader>
                    <div className="text-xs text-gray-500">Pending</div>
                    <div className="text-2xl font-bold text-red-600">
                      {pendingBookings}
                    </div>
                  </CardHeader>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <div className="text-xs text-gray-500">
                      Total Amount (LKR)
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {totalAmount.toLocaleString()}
                    </div>
                  </CardHeader>
                </Card>
              </div>
              {/* Table Section */}
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full border">
                  <thead className="bg-yellow-50">
                    <tr>
                      <th className="px-2 py-1 border">ID</th>
                      <th className="px-2 py-1 border">Company Name</th>
                      <th className="px-2 py-1 border">Hotel</th>
                      <th className="px-2 py-1 border">Arrival</th>
                      <th className="px-2 py-1 border">Departure</th>
                      <th className="px-2 py-1 border">Room Types</th>
                      <th className="px-2 py-1 border">Discount Rate</th>
                      <th className="px-2 py-1 border">Amount (LKR)</th>
                      <th className="px-2 py-1 border">Status</th>
                      <th className="px-2 py-1 border">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockBookings.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="text-center text-gray-400 py-8"
                        >
                          No block bookings found.
                        </td>
                      </tr>
                    ) : (
                      blockBookings.map((b) => (
                        <tr key={b.id}>
                          <td className="px-2 py-1 border">{b.id}</td>
                          <td className="px-2 py-1 border">
                            {b.travelCompany?.companyName}
                          </td>
                          <td className="px-2 py-1 border">{b.hotel?.name}</td>
                          <td className="px-2 py-1 border">
                            {b.arrivalDate?.slice(0, 10)}
                          </td>
                          <td className="px-2 py-1 border">
                            {b.departureDate?.slice(0, 10)}
                          </td>
                          <td className="px-2 py-1 border">
                            {b.roomTypes.map((rt) => (
                              <div key={rt.id}>
                                {rt.roomType} x{rt.rooms}
                              </div>
                            ))}
                          </td>
                          <td className="px-2 py-1 border">
                            {b.discountRate}%
                          </td>
                          <td className="px-2 py-1 border">
                            {b.totalAmount?.toLocaleString()}
                          </td>
                          <td className="px-2 py-1 border">
                            {b.status === "reserved" ? (
                              <span className="text-green-800 font-semibold">
                                Approved
                              </span>
                            ) : b.status === "rejected" ? (
                              <span className="text-red-800 font-semibold">
                                Rejected
                              </span>
                            ) : (
                              <span className="text-yellow-800 font-semibold">
                                {b.status}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1 border">
                            {b.status !== "reserved" &&
                            b.status !== "rejected" ? (
                              <div className="flex gap-2">
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
