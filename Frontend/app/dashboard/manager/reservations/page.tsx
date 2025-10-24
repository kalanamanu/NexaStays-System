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
  Search,
  ClipboardList,
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
    r.arrivalDate,
    r.departureDate,
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
                    <ClipboardList className="h-6 w-6 text-indigo-600" />
                    Reservation History
                  </CardTitle>
                  <div className="text-gray-500 text-sm mt-1">
                    Search, filter, and view hotel reservations.
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
                  <Select
                    value={String(selectedHotel)}
                    onValueChange={setSelectedHotel}
                  >
                    <SelectTrigger className="min-w-[220px] border-indigo-400">
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
                      className="border-indigo-500 shadow ml-2"
                      disabled={!filteredReservations.length}
                      onClick={() => exportCsv(filteredReservations, hotelName)}
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
              {!selectedHotel && (
                <div className="text-gray-500 text-center py-12">
                  Select a hotel to view reservations.
                </div>
              )}
              {loading && (
                <div className="text-center py-8 animate-pulse">
                  Loading reservations...
                </div>
              )}
              {selectedHotel && !loading && (
                <div>
                  {/* Filter Section */}
                  <div className="flex flex-col md:flex-row gap-4 mb-4 items-center">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        className="border rounded px-2 py-1 text-sm"
                        placeholder="Search guest name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-700">Status</label>
                      <select
                        className="border rounded px-2 py-1 text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="">All</option>
                        <option value="reserved">Reserved</option>
                        <option value="checked-in">Checked-In</option>
                        <option value="checked-out">Checked-Out</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-700">Room</label>
                      <input
                        type="text"
                        className="border rounded px-2 py-1 text-sm"
                        placeholder="Room number..."
                        value={roomFilter}
                        onChange={(e) => setRoomFilter(e.target.value)}
                      />
                    </div>
                  </div>
                  {/* Table Section */}
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full border">
                      <thead className="bg-indigo-50">
                        <tr>
                          <th className="px-2 py-1 border">ID</th>
                          <th className="px-2 py-1 border">Guest Name</th>
                          <th className="px-2 py-1 border">Room Number</th>
                          <th className="px-2 py-1 border">Room Type</th>
                          <th className="px-2 py-1 border">Arrival</th>
                          <th className="px-2 py-1 border">Departure</th>
                          <th className="px-2 py-1 border">Amount (LKR)</th>
                          <th className="px-2 py-1 border">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReservations.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="text-center text-gray-400 py-8"
                            >
                              No reservations found.
                            </td>
                          </tr>
                        ) : (
                          filteredReservations.map((r) => (
                            <tr key={r.id}>
                              <td className="px-2 py-1 border">{r.id}</td>
                              <td className="px-2 py-1 border">
                                {r.guestName}
                              </td>
                              <td className="px-2 py-1 border">
                                {r.roomNumber}
                              </td>
                              <td className="px-2 py-1 border">{r.roomType}</td>
                              <td className="px-2 py-1 border">
                                {r.arrivalDate}
                              </td>
                              <td className="px-2 py-1 border">
                                {r.departureDate}
                              </td>
                              <td className="px-2 py-1 border">
                                {r.totalAmount?.toLocaleString()}
                              </td>
                              <td className="px-2 py-1 border">{r.status}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-6 text-xs text-gray-500 leading-relaxed">
                    <strong>Tip:</strong> Use the filters to find reservations
                    by guest, status, or room number. Export the results with
                    the button above.
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
