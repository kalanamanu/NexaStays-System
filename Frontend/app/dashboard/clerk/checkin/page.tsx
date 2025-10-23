"use client";
import { useEffect, useState } from "react";
import NavBar from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, CheckCircle2 } from "lucide-react";

interface Hotel {
  id: string | number;
  name: string;
}

interface Reservation {
  id: string | number;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  hotelId: string | number;
  hotelName?: string;
  roomType: string;
  roomNumber?: string;
  arrivalDate: string;
  departureDate: string;
  status: string;
  guests: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export default function ClerkCheckInPage() {
  const { toast } = useToast();

  // Hotels & Reservations
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filtered, setFiltered] = useState<Reservation[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string | number | "">("");
  const [search, setSearch] = useState("");

  // View/Check-in Dialogs
  const [viewReservation, setViewReservation] = useState<Reservation | null>(
    null
  );
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [checkInTarget, setCheckInTarget] = useState<Reservation | null>(null);

  // --- Walk-In Check-In Dialog ---
  const [showWalkInDialog, setShowWalkInDialog] = useState(false);
  const [roomTypes, setRoomTypes] = useState<
    { type: string; label: string; price: number; available: number }[]
  >([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string | number | "">(
    ""
  );
  const [walkInForm, setWalkInForm] = useState({
    guestName: "",
    email: "",
    phoneNumber: "",
    hotelId: "",
    roomType: "",
    roomNumber: "",
    arrivalDate: "",
    departureDate: "",
  });

  // Fetch hotels once
  useEffect(() => {
    async function fetchHotels() {
      const res = await fetch("http://localhost:5000/api/hotels");
      const data = await res.json();
      setHotels(data.data || []);
    }
    fetchHotels();
  }, []);

  // Fetch reservations
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
        }))
      );
    }
    fetchReservations();
  }, []);

  // Filter reservations: Show all statuses
  useEffect(() => {
    let list = reservations;
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

  // Open view dialog
  function handleView(res: Reservation) {
    setViewReservation(res);
    setShowViewDialog(true);
  }

  // Open check-in confirm dialog
  function handleCheckIn(res: Reservation) {
    setCheckInTarget(res);
    setShowCheckInDialog(true);
  }

  // Confirm check-in
  async function confirmCheckIn() {
    if (!checkInTarget) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "http://localhost:5000/api/reservations/checkin",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reservationId: checkInTarget.id,
          }),
        }
      );
      if (!res.ok) throw new Error("Check-in failed");
      setReservations((prev) =>
        prev.map((r) =>
          r.id === checkInTarget.id ? { ...r, status: "checked-in" } : r
        )
      );
      toast({ title: "Checked In!", description: "Reservation checked in." });
      setShowCheckInDialog(false);
      setCheckInTarget(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Could not check in reservation.",
        variant: "destructive",
      });
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "reserved":
        return (
          <Badge className="bg-purple-100 text-purple-800">Reserved</Badge>
        );
      case "paid":
        return <Badge className="bg-gray-200 text-gray-800">Paid</Badge>;
      case "pending_payment":
        return (
          <Badge className="bg-orange-100 text-orange-800">
            Pending Payment
          </Badge>
        );
      case "checked-in":
        return (
          <Badge className="bg-green-100 text-green-800">Checked-In</Badge>
        );
      case "checked-out":
        return (
          <Badge className="bg-green-100 text-green-800">Checked-Out</Badge>
        );
      case "no-show":
        return <Badge className="bg-red-100 text-red-800">No-Show</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-200 text-gray-600">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-200 text-gray-800">{status}</Badge>;
    }
  };

  // -------- Walk-In Check-In Logic --------
  useEffect(() => {
    if (!selectedHotelId) return;
    async function fetchRooms() {
      const res = await fetch(
        `http://localhost:5000/api/hotels/${selectedHotelId}`
      );
      const data = await res.json();
      const hotelRooms = data.data?.rooms || [];
      setRooms(hotelRooms);
      // Deduplicate types
      const typeMap: Record<
        string,
        { type: string; label: string; price: number; available: number }
      > = {};
      hotelRooms.forEach((room: any) => {
        const key = room.type.trim().toLowerCase();
        if (!typeMap[key]) {
          typeMap[key] = {
            type: key,
            label: room.type,
            price: room.pricePerNight,
            available: room.status === "available" ? 1 : 0,
          };
        } else {
          if (room.status === "available") typeMap[key].available += 1;
        }
      });
      setRoomTypes(Object.values(typeMap));
    }
    fetchRooms();
  }, [selectedHotelId]);

  useEffect(() => {
    if (walkInForm.roomType) {
      setFilteredRooms(
        rooms.filter(
          (room) =>
            room.type.trim().toLowerCase() ===
              walkInForm.roomType.toLowerCase() &&
            room.status === "available" &&
            room.number &&
            room.number !== ""
        )
      );
    } else {
      setFilteredRooms([]);
    }
  }, [walkInForm.roomType, rooms]);

  function handleWalkInChange(field: string, value: string) {
    setWalkInForm((prev) => ({ ...prev, [field]: value }));
    if (field === "hotelId") {
      setSelectedHotelId(value);
      setWalkInForm((prev) => ({
        ...prev,
        hotelId: value,
        roomType: "",
        roomNumber: "",
      }));
    }
    if (field === "roomType") {
      setWalkInForm((prev) => ({
        ...prev,
        roomNumber: "",
      }));
    }
  }
  async function handleWalkInCheckIn() {
    if (
      !walkInForm.guestName ||
      !walkInForm.phoneNumber ||
      !walkInForm.hotelId ||
      !walkInForm.roomType ||
      !walkInForm.roomNumber ||
      !walkInForm.arrivalDate ||
      !walkInForm.departureDate
    ) {
      toast({
        title: "Missing Fields",
        description: "All fields marked * are required.",
        variant: "destructive",
      });
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const payload = {
        guestName: walkInForm.guestName,
        guestEmail: walkInForm.email,
        guestPhone: walkInForm.phoneNumber,
        hotelId: walkInForm.hotelId,
        roomType: walkInForm.roomType,
        roomNumber: walkInForm.roomNumber,
        arrivalDate: walkInForm.arrivalDate,
        departureDate: walkInForm.departureDate,
        status: "checked-in",
      };
      const res = await fetch("http://localhost:5000/api/reservations/clerk", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to check in walk-in guest.");
      toast({ title: "Checked In!", description: "Walk-in guest checked in." });
      setShowWalkInDialog(false);
      setWalkInForm({
        guestName: "",
        email: "",
        phoneNumber: "",
        hotelId: "",
        roomType: "",
        roomNumber: "",
        arrivalDate: "",
        departureDate: "",
      });
      setSelectedHotelId("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Could not check in walk-in guest.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-1">Reservation Check-In</h1>
              <div className="text-gray-600 dark:text-gray-300">
                Search for reservations and process guest check-in, or check-in
                a walk-in instantly.
              </div>
            </div>
            {/* <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowWalkInDialog(true)}
            >
              Walk-In Check-In
            </Button> */}
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
                          onClick={() => handleView(r)}
                          className="mr-2"
                        >
                          <Eye className="w-4 h-4" /> View
                        </Button>
                        {r.status === "checked-in" ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              (window.location.href = `/dashboard/clerk/checkout/${r.id}`)
                            }
                          >
                            Check-Out
                          </Button>
                        ) : (
                          [
                            "confirmed",
                            "pending",
                            "reserved",
                            "pending_payment",
                            "paid",
                          ].includes(r.status) && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleCheckIn(r)}
                            >
                              <CheckCircle2 className="w-4 h-4" /> Check-In
                            </Button>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Reservation View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reservation Details</DialogTitle>
          </DialogHeader>
          {viewReservation && (
            <div className="space-y-2">
              <div>
                <Label>ID:</Label> {viewReservation.id}
              </div>
              <div>
                <Label>Guest:</Label> {viewReservation.guestName}
              </div>
              <div>
                <Label>Email:</Label> {viewReservation.guestEmail}
              </div>
              <div>
                <Label>Phone:</Label> {viewReservation.guestPhone}
              </div>
              <div>
                <Label>Hotel:</Label> {viewReservation.hotelName}
              </div>
              <div>
                <Label>Room Type:</Label> {viewReservation.roomType}
              </div>
              <div>
                <Label>Room Number:</Label>{" "}
                {viewReservation.roomNumber || (
                  <span className="text-gray-500">Unassigned</span>
                )}
              </div>
              <div>
                <Label>Dates:</Label>{" "}
                {viewReservation.arrivalDate?.slice(0, 10)} to{" "}
                {viewReservation.departureDate?.slice(0, 10)}
              </div>
              <div>
                <Label>Guests:</Label> {viewReservation.guests}
              </div>
              <div>
                <Label>Status:</Label> {statusBadge(viewReservation.status)}
              </div>
              <div>
                <Label>Total Amount:</Label> LKR {viewReservation.totalAmount}
              </div>
              <div>
                <Label>Created:</Label>{" "}
                {viewReservation.createdAt?.slice(0, 19).replace("T", " ")}
              </div>
              <div>
                <Label>Updated:</Label>{" "}
                {viewReservation.updatedAt?.slice(0, 19).replace("T", " ")}
              </div>
            </div>
          )}
          <DialogFooter>
            {viewReservation &&
              (viewReservation.status === "confirmed" ||
                viewReservation.status === "pending" ||
                viewReservation.status === "reserved") && (
                <Button
                  variant="default"
                  onClick={() => {
                    setShowViewDialog(false);
                    handleCheckIn(viewReservation);
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Check-In
                </Button>
              )}
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-In Confirm Dialog */}
      <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Check-In</DialogTitle>
            <DialogDescription>
              Are you sure you want to check in guest{" "}
              <span className="font-bold">{checkInTarget?.guestName}</span> for
              reservation <span className="font-bold">{checkInTarget?.id}</span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCheckInDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="default" onClick={confirmCheckIn}>
              Confirm Check-In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Walk-In Check-In Dialog */}
      <Dialog open={showWalkInDialog} onOpenChange={setShowWalkInDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Walk-In Check-In</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Guest Name*</Label>
            <Input
              value={walkInForm.guestName}
              onChange={(e) => handleWalkInChange("guestName", e.target.value)}
            />
            <Label>Email</Label>
            <Input
              type="email"
              value={walkInForm.email}
              onChange={(e) => handleWalkInChange("email", e.target.value)}
            />
            <Label>Phone Number*</Label>
            <Input
              value={walkInForm.phoneNumber}
              onChange={(e) =>
                handleWalkInChange("phoneNumber", e.target.value)
              }
            />
            <Label>Hotel*</Label>
            <Select
              value={walkInForm.hotelId}
              onValueChange={(v) => handleWalkInChange("hotelId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select hotel" />
              </SelectTrigger>
              <SelectContent>
                {hotels
                  .filter((h) => h.id && h.id !== "")
                  .map((h) => (
                    <SelectItem key={h.id} value={String(h.id)}>
                      {h.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Label>Room Type*</Label>
            <Select
              value={walkInForm.roomType}
              onValueChange={(v) => handleWalkInChange("roomType", v)}
              disabled={!walkInForm.hotelId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes
                  .filter((rt) => rt.type && rt.type !== "")
                  .map((rt) => (
                    <SelectItem key={rt.type} value={rt.type}>
                      {rt.label} (LKR {rt.price}/night) - {rt.available}{" "}
                      available
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Label>Room Number*</Label>
            <Select
              value={walkInForm.roomNumber}
              onValueChange={(v) => handleWalkInChange("roomNumber", v)}
              disabled={!walkInForm.roomType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room number" />
              </SelectTrigger>
              <SelectContent>
                {filteredRooms
                  .filter((room) => room.number && room.number !== "")
                  .map((room) => (
                    <SelectItem key={room.number} value={room.number}>
                      Room {room.number} (LKR {room.pricePerNight}/night)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Arrival Date*</Label>
                <Input
                  type="date"
                  value={walkInForm.arrivalDate}
                  onChange={(e) =>
                    handleWalkInChange("arrivalDate", e.target.value)
                  }
                />
              </div>
              <div className="flex-1">
                <Label>Departure Date*</Label>
                <Input
                  type="date"
                  value={walkInForm.departureDate}
                  onChange={(e) =>
                    handleWalkInChange("departureDate", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleWalkInCheckIn}>Check-In</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
