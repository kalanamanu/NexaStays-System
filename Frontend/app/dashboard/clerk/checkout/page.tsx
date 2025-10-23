"use client";
import { useEffect, useState } from "react";
import NavBar from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface Reservation {
  id: string | number;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  hotelId: string | number;
  hotelName?: string;
  roomType: string;
  roomNumber?: string;
  roomId?: string | number;
  arrivalDate: string;
  departureDate: string;
  status: string;
  guests: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface Hotel {
  id: string | number;
  name: string;
}

export default function ClerkCheckoutPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filtered, setFiltered] = useState<Reservation[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string | number | "">("");
  const [search, setSearch] = useState("");
  const router = useRouter();

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
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/reservations/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReservations(
        (data.reservations || []).map((r: any) => ({
          ...r,
          hotelName: r.hotel?.name || r.hotelName || r.hotelId,
          roomId: r.roomId, // <-- ensure roomId is present
        }))
      );
    }
    fetchReservations();
  }, []);

  useEffect(() => {
    // Only checked-in and checked-out
    let list = reservations.filter(
      (r) => r.status === "checked-in" || r.status === "checked-out"
    );
    if (selectedHotel && selectedHotel !== "all-hotels") {
      list = list.filter((r) => String(r.hotelId) === String(selectedHotel));
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          (r.guestName && r.guestName.toLowerCase().includes(s)) ||
          (r.guestPhone && r.guestPhone.toLowerCase().includes(s))
      );
    }
    setFiltered(list);
  }, [reservations, selectedHotel, search]);

  const statusBadge = (status: string) => {
    switch (status) {
      case "checked-in":
        return (
          <Badge className="bg-green-100 text-green-800">Checked-In</Badge>
        );
      case "checked-out":
        return <Badge className="bg-gray-200 text-gray-800">Checked-Out</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // Pass roomId as query param for checkout page
  const goToCheckout = (reservation: Reservation) => {
    if (reservation.roomId) {
      router.push(
        `/dashboard/clerk/checkout/${reservation.id}?roomId=${reservation.roomId}`
      );
    } else {
      router.push(`/dashboard/clerk/checkout/${reservation.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-1">Guest Check-Out</h1>
              <div className="text-gray-600 dark:text-gray-300">
                View checked-in guests and check them out. Checked-out list is
                shown as history.
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto mb-4">
            <Select
              value={String(selectedHotel)}
              onValueChange={setSelectedHotel}
            >
              <SelectTrigger className="min-w-[180px]">
                <SelectValue placeholder="Filter by Hotel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-hotels" key="all-hotels">
                  All Hotels
                </SelectItem>
                {hotels
                  .filter((h) => h.id && h.id !== "")
                  .map((h) => (
                    <SelectItem key={h.id} value={String(h.id)}>
                      {h.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
          </div>
          <div className="overflow-x-auto bg-white rounded-xl shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-gray-400"
                    >
                      No matching reservations
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-bold">{r.id}</TableCell>
                      <TableCell>{r.hotelName}</TableCell>
                      <TableCell>
                        <div>{r.guestName}</div>
                        <div className="text-xs text-gray-500">
                          {r.guestEmail}
                        </div>
                      </TableCell>
                      <TableCell>{r.guestPhone}</TableCell>
                      <TableCell>
                        {r.roomNumber ? (
                          <span className="font-semibold">{r.roomNumber}</span>
                        ) : (
                          <span className="text-gray-500">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>{r.roomType}</TableCell>
                      <TableCell>
                        <div>
                          {r.arrivalDate?.slice(0, 10)} to{" "}
                          {r.departureDate?.slice(0, 10)}
                        </div>
                      </TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => alert(JSON.stringify(r, null, 2))}
                          className="mr-2"
                        >
                          <Eye className="w-4 h-4" /> View
                        </Button>
                        {r.status === "checked-in" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => goToCheckout(r)}
                          >
                            Check-Out
                          </Button>
                        )}
                        {/* No action for checked-out */}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
