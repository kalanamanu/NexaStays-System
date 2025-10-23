"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/nav-bar";
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
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";

interface Hotel {
  id: string | number;
  name: string;
}
interface Room {
  id: string | number;
  number: string;
  type: string;
  pricePerNight: number;
  status: "available" | "occupied" | "maintenance" | "reserved";
}
interface RoomTypeOption {
  type: string;
  label: string;
  price: number;
  available: number;
}

export default function ClerkDashboard() {
  const { toast } = useToast();
  const { user } = useUser();

  // Hotel/Room Data
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string | number | "">(
    ""
  );
  const [roomTypes, setRoomTypes] = useState<RoomTypeOption[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);

  // Dialog state
  const [showWalkInDialog, setShowWalkInDialog] = useState(false);
  const [showReservationDialog, setShowReservationDialog] = useState(false);

  // Walk-In state
  const [walkInForm, setWalkInForm] = useState({
    guestName: "",
    email: "",
    phoneNumber: "",
    hotelId: "",
    roomType: "",
    roomId: "",
    arrivalDate: "",
    departureDate: "",
    guests: 1,
  });

  // Reservation state
  const [reservationForm, setReservationForm] = useState({
    guestName: "",
    email: "",
    phoneNumber: "",
    hotelId: "",
    roomType: "",
    roomId: "",
    arrivalDate: "",
    departureDate: "",
    creditCard: "",
    guests: 1,
  });

  // Fetch all hotels on mount
  useEffect(() => {
    async function fetchHotels() {
      const res = await fetch("http://localhost:5000/api/hotels");
      const data = await res.json();
      setHotels(data.data || []);
    }
    fetchHotels();
  }, []);

  // Fetch rooms & types for selected hotel
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
      const typeMap: Record<string, RoomTypeOption> = {};
      hotelRooms.forEach((room: Room) => {
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

  // Filter rooms for selected type
  useEffect(() => {
    if (walkInForm.roomType) {
      setFilteredRooms(
        rooms.filter(
          (room) =>
            room.type.trim().toLowerCase() ===
              walkInForm.roomType.toLowerCase() && room.status === "available"
        )
      );
    } else if (reservationForm.roomType) {
      setFilteredRooms(
        rooms.filter(
          (room) =>
            room.type.trim().toLowerCase() ===
              reservationForm.roomType.toLowerCase() &&
            room.status === "available"
        )
      );
    } else {
      setFilteredRooms([]);
    }
  }, [walkInForm.roomType, reservationForm.roomType, rooms]);

  // ---- Walk-In Handlers ----
  function handleWalkInChange(field: string, value: string) {
    setWalkInForm((prev) => ({ ...prev, [field]: value }));
    if (field === "hotelId") {
      setSelectedHotelId(value);
      setWalkInForm((prev) => ({
        ...prev,
        roomType: "",
        roomId: "",
        guests: 1,
      }));
    }
    if (field === "roomType") {
      setWalkInForm((prev) => ({
        ...prev,
        roomId: "",
        guests: 1,
      }));
    }
  }

  function calculateTotalAmountForWalkIn() {
    if (
      !walkInForm.roomId ||
      !walkInForm.arrivalDate ||
      !walkInForm.departureDate
    ) {
      return 0;
    }
    const roomObj = rooms.find(
      (r) => String(r.id) === String(walkInForm.roomId)
    );
    const price = roomObj?.pricePerNight || 0;
    const nights =
      (new Date(walkInForm.departureDate).getTime() -
        new Date(walkInForm.arrivalDate).getTime()) /
      (1000 * 60 * 60 * 24);
    return price * Math.max(1, nights);
  }

  // ---- Reservation Handlers ----
  function handleReservationChange(field: string, value: string) {
    setReservationForm((prev) => ({ ...prev, [field]: value }));
    if (field === "hotelId") {
      setSelectedHotelId(value);
      setReservationForm((prev) => ({
        ...prev,
        roomType: "",
        roomId: "",
        guests: 1,
      }));
    }
    if (field === "roomType") {
      setReservationForm((prev) => ({
        ...prev,
        roomId: "",
        guests: 1,
      }));
    }
  }

  function calculateTotalAmountForReservation() {
    if (
      !reservationForm.roomId ||
      !reservationForm.arrivalDate ||
      !reservationForm.departureDate
    ) {
      return 0;
    }
    const roomObj = rooms.find(
      (r) => String(r.id) === String(reservationForm.roomId)
    );
    const price = roomObj?.pricePerNight || 0;
    const nights =
      (new Date(reservationForm.departureDate).getTime() -
        new Date(reservationForm.arrivalDate).getTime()) /
      (1000 * 60 * 60 * 24);
    return price * Math.max(1, nights);
  }

  async function handleWalkInCheckIn() {
    if (
      !walkInForm.guestName ||
      !walkInForm.phoneNumber ||
      !walkInForm.hotelId ||
      !walkInForm.roomType ||
      !walkInForm.roomId ||
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
      const totalAmount = calculateTotalAmountForWalkIn();
      const payload = {
        guestName: walkInForm.guestName,
        guestEmail: walkInForm.email,
        guestPhone: walkInForm.phoneNumber,
        hotelId: walkInForm.hotelId,
        roomType: walkInForm.roomType,
        roomId: walkInForm.roomId,
        arrivalDate: walkInForm.arrivalDate,
        departureDate: walkInForm.departureDate,
        status: "checked-in",
        totalAmount,
        guests: walkInForm.guests,
      };
      const res = await fetch("http://localhost:5000/api/reservations/walkin", {
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
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Could not check in walk-in guest.",
        variant: "destructive",
      });
    }
  }

  async function handleReservationCreate() {
    if (
      !reservationForm.guestName ||
      !reservationForm.phoneNumber ||
      !reservationForm.hotelId ||
      !reservationForm.roomType ||
      !reservationForm.arrivalDate ||
      !reservationForm.departureDate ||
      !reservationForm.roomId
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
      const totalAmount = calculateTotalAmountForReservation();
      const payload = {
        guestName: reservationForm.guestName,
        guestEmail: reservationForm.email,
        guestPhone: reservationForm.phoneNumber,
        hotelId: reservationForm.hotelId,
        roomType: reservationForm.roomType,
        roomId: reservationForm.roomId,
        arrivalDate: reservationForm.arrivalDate,
        departureDate: reservationForm.departureDate,
        creditCard: reservationForm.creditCard,
        status: "reserved",
        totalAmount,
        guests: reservationForm.guests,
      };
      const res = await fetch("http://localhost:5000/api/reservations/clerk", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create reservation.");
      toast({
        title: "Reservation Created",
        description: "Reservation successfully created.",
      });
      setShowReservationDialog(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Could not create reservation.",
        variant: "destructive",
      });
    }
  }

  // ---- UI ----
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Clerk Dashboard</h1>
          <div className="flex flex-col gap-6">
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowWalkInDialog(true)}
            >
              Walk-In Check-In
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowReservationDialog(true)}
            >
              New Reservation
            </Button>
          </div>
        </div>
      </div>

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
                {hotels.map((h) => (
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
                {roomTypes.map((rt) => (
                  <SelectItem key={rt.type} value={rt.type}>
                    {rt.label} (LKR {rt.price}/night) - {rt.available} available
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label>Room Number*</Label>
            <Select
              value={walkInForm.roomId}
              onValueChange={(v) => handleWalkInChange("roomId", v)}
              disabled={!walkInForm.roomType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room number" />
              </SelectTrigger>
              <SelectContent>
                {filteredRooms.map((room) => (
                  <SelectItem key={room.id} value={String(room.id)}>
                    Room {room.number} (LKR {room.pricePerNight}/night)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label>Guests*</Label>
            <Input
              type="number"
              min={1}
              value={walkInForm.guests}
              onChange={(e) =>
                handleWalkInChange(
                  "guests",
                  String(Math.max(1, Number(e.target.value)))
                )
              }
            />
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
            {walkInForm.roomId &&
              walkInForm.arrivalDate &&
              walkInForm.departureDate && (
                <div className="p-2 bg-blue-50 rounded text-right">
                  <div className="text-gray-600">Total Amount:</div>
                  <div className="font-bold text-lg">
                    LKR {calculateTotalAmountForWalkIn()}
                  </div>
                </div>
              )}
          </div>
          <DialogFooter>
            <Button onClick={handleWalkInCheckIn}>Check-In</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Reservation Dialog */}
      <Dialog
        open={showReservationDialog}
        onOpenChange={setShowReservationDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Reservation</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Guest Name*</Label>
            <Input
              value={reservationForm.guestName}
              onChange={(e) =>
                handleReservationChange("guestName", e.target.value)
              }
            />
            <Label>Email</Label>
            <Input
              type="email"
              value={reservationForm.email}
              onChange={(e) => handleReservationChange("email", e.target.value)}
            />
            <Label>Phone Number*</Label>
            <Input
              value={reservationForm.phoneNumber}
              onChange={(e) =>
                handleReservationChange("phoneNumber", e.target.value)
              }
            />
            <Label>Hotel*</Label>
            <Select
              value={reservationForm.hotelId}
              onValueChange={(v) => handleReservationChange("hotelId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select hotel" />
              </SelectTrigger>
              <SelectContent>
                {hotels.map((h) => (
                  <SelectItem key={h.id} value={String(h.id)}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label>Room Type*</Label>
            <Select
              value={reservationForm.roomType}
              onValueChange={(v) => handleReservationChange("roomType", v)}
              disabled={!reservationForm.hotelId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((rt) => (
                  <SelectItem key={rt.type} value={rt.type}>
                    {rt.label} (LKR {rt.price}/night) - {rt.available} available
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label>Room Number*</Label>
            <Select
              value={reservationForm.roomId}
              onValueChange={(v) => handleReservationChange("roomId", v)}
              disabled={!reservationForm.roomType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room number" />
              </SelectTrigger>
              <SelectContent>
                {filteredRooms.map((room) => (
                  <SelectItem key={room.id} value={String(room.id)}>
                    Room {room.number} (LKR {room.pricePerNight}/night)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label>Guests*</Label>
            <Input
              type="number"
              min={1}
              value={reservationForm.guests}
              onChange={(e) =>
                handleReservationChange(
                  "guests",
                  String(Math.max(1, Number(e.target.value)))
                )
              }
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Arrival Date*</Label>
                <Input
                  type="date"
                  value={reservationForm.arrivalDate}
                  onChange={(e) =>
                    handleReservationChange("arrivalDate", e.target.value)
                  }
                />
              </div>
              <div className="flex-1">
                <Label>Departure Date*</Label>
                <Input
                  type="date"
                  value={reservationForm.departureDate}
                  onChange={(e) =>
                    handleReservationChange("departureDate", e.target.value)
                  }
                />
              </div>
            </div>
            {reservationForm.roomId &&
              reservationForm.arrivalDate &&
              reservationForm.departureDate && (
                <div className="p-2 bg-blue-50 rounded text-right">
                  <div className="text-gray-600">Total Amount:</div>
                  <div className="font-bold text-lg">
                    LKR {calculateTotalAmountForReservation()}
                  </div>
                </div>
              )}
          </div>
          <DialogFooter>
            <Button onClick={handleReservationCreate}>
              Create Reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
