"use client";
import { useEffect, useState } from "react";
import NavBar from "@/components/nav-bar";
import ManagerSidebar from "@/components/ui/ManagerSidebar";
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
import {
  DownloadCloud,
  Calendar as CalendarIcon,
  Search,
  ClipboardList,
  Filter,
  User,
  Bed,
  AlertCircle,
} from "lucide-react";

interface Hotel {
  id: string | number;
  name: string;
}
interface Reservation {
  id: string | number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  roomNumber?: string;
  roomType?: string;
  arrivalDate: string;
  departureDate: string;
  totalAmount: number;
  status: string;
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

function exportCsv(reservations: Reservation[], hotelName: string) {
  if (!reservations.length) return;
  const header = [
    "ID",
    "Guest Name",
    "Room Number",
    "Room Type",
    "Arrival Date",
    "Departure Date",
    "Total Amount (LKR)",
    "Status",
  ];
  const rows = reservations.map((r) => [
    r.id,
    r.guestName || "",
    r.roomNumber || "",
    r.roomType || "",
    formatDisplayDate(r.arrivalDate),
    formatDisplayDate(r.departureDate),
    r.totalAmount,
    r.status,
  ]);
  const csvContent = [header, ...rows]
    .map((row) =>
      row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
    )
    .join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Reservation_History_${hotelName || "Hotel"}.csv`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function ManagerReservationHistoryPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string | number | "">("");
  const [hotelName, setHotelName] = useState<string>("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");

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
    async function fetchReservations() {
      if (!selectedHotel) {
        setReservations([]);
        setHotelName("");
        return;
      }
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const url = `http://localhost:5000/api/manager/reservations?hotelId=${selectedHotel}&from=${from}&to=${to}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        setReservations(data.reservations || []);
        const h = hotels.find((h) => String(h.id) === String(selectedHotel));
        setHotelName(h ? h.name : "");
      } catch (e) {
        setReservations([]);
      } finally {
        setLoading(false);
      }
    }
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHotel, hotels, from, to]);

  // Filter logic
  const filteredReservations = reservations.filter((r) => {
    const matchesSearch =
      search.trim() === "" ||
      (r.guestName &&
        r.guestName.toLowerCase().includes(search.toLowerCase())) ||
      (r.guestEmail &&
        r.guestEmail.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "" || r.status === statusFilter;
    const matchesRoom =
      roomFilter === "" || (r.roomNumber && r.roomNumber.includes(roomFilter));
    return matchesSearch && matchesStatus && matchesRoom;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      <ManagerSidebar />
      <main className="ml-60 pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto py-8 px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                  <ClipboardList className="h-8 w-8 text-indigo-600" />
                  Reservation History
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Search, filter, and export hotel reservation records.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="border-indigo-500 text-indigo-600 hover:bg-indigo-50"
                  disabled={!filteredReservations.length}
                  onClick={() => exportCsv(filteredReservations, hotelName)}
                >
                  <DownloadCloud className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <Card className="shadow-lg border-0 mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Bed className="h-4 w-4" />
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

                <div className="flex flex-col gap-3 mt-4 lg:mt-0">
                  <div className="flex gap-2 items-center">
                    <Search className="w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      className="border rounded px-2 py-1 text-sm w-40"
                      placeholder="Search guest name/email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      className="border rounded px-2 py-1 text-sm w-32"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value="reserved">Reserved</option>
                      <option value="checked-in">Checked-In</option>
                      <option value="checked-out">Checked-Out</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="flex gap-2 items-center">
                    <User className="w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      className="border rounded px-2 py-1 text-sm w-28"
                      placeholder="Room number..."
                      value={roomFilter}
                      onChange={(e) => setRoomFilter(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reservation Table Section */}
          <Card className="shadow-lg border-0">
            <CardHeader className="border-b border-gray-200 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <ClipboardList className="h-5 w-5 text-indigo-600" />
                    Reservation Records
                  </CardTitle>
                  <CardDescription>
                    All reservations for{" "}
                    <span className="font-medium">
                      {hotelName || "selected hotel"}
                    </span>{" "}
                    from {formatDisplayDate(from)} to {formatDisplayDate(to)}
                  </CardDescription>
                </div>
                <Badge
                  className="bg-indigo-50 text-indigo-700 border-indigo-200"
                  variant="outline"
                >
                  {filteredReservations.length} Records
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!selectedHotel && (
                <div className="py-16 text-center">
                  <Bed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Select a Hotel
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Choose a hotel from above to view reservation history.
                  </p>
                </div>
              )}
              {loading && (
                <div className="py-16 text-center">
                  <div className="animate-pulse">
                    <ClipboardList className="h-16 w-16 text-indigo-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Loading reservation records...
                    </p>
                  </div>
                </div>
              )}
              {selectedHotel && !loading && (
                <div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm rounded-lg overflow-hidden">
                      <thead className="bg-indigo-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            ID
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Guest Name
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Room
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Type
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Arrival
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Departure
                          </th>
                          <th className="px-4 py-2 text-right font-semibold text-gray-700">
                            Amount (LKR)
                          </th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-700">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReservations.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="text-center text-gray-400 py-12"
                            >
                              <AlertCircle className="inline-block mr-2 h-5 w-5 text-gray-300" />
                              No reservations found for selected criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredReservations.map((r) => (
                            <tr
                              key={r.id}
                              className="hover:bg-indigo-50 transition-colors"
                            >
                              <td className="px-4 py-2 font-medium text-gray-900">
                                {r.id}
                              </td>
                              <td className="px-4 py-2">
                                <div>{r.guestName}</div>
                                <div className="text-xs text-gray-500">
                                  {r.guestEmail}
                                </div>
                              </td>
                              <td className="px-4 py-2">{r.roomNumber}</td>
                              <td className="px-4 py-2">{r.roomType}</td>
                              <td className="px-4 py-2">
                                {formatDisplayDate(r.arrivalDate)}
                              </td>
                              <td className="px-4 py-2">
                                {formatDisplayDate(r.departureDate)}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {r.totalAmount?.toLocaleString()}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <Badge
                                  className={
                                    r.status === "reserved"
                                      ? "bg-blue-100 text-blue-700"
                                      : r.status === "checked-in"
                                      ? "bg-green-100 text-green-700"
                                      : r.status === "checked-out"
                                      ? "bg-purple-100 text-purple-800"
                                      : r.status === "paid"
                                      ? "bg-indigo-100 text-indigo-700"
                                      : r.status === "pending"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : r.status === "cancelled"
                                      ? "bg-red-100 text-red-700"
                                      : ""
                                  }
                                >
                                  {r.status.charAt(0).toUpperCase() +
                                    r.status.slice(1)}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-6 text-xs text-gray-500 leading-relaxed">
                    <strong>Tip:</strong> Use filters to find reservations by
                    guest, status or room. Export filtered results with the
                    button above.
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
