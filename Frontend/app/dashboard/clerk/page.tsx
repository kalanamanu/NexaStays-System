"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/nav-bar";
import ClerkSidebar from "@/components/ui/ClerkSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Users,
  CalendarCheck2,
  CalendarX2,
  ClipboardList,
  Plus,
  UserCheck,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
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
interface Reservation {
  id: string | number;
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
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
}

export default function ClerkDashboard() {
  const { toast } = useToast();
  const { user } = useUser();

  // Dashboard stats & recent reservations
  const [stats, setStats] = useState({
    todayCheckIns: 0,
    todayCheckOuts: 0,
    totalReservations: 0,
    currentlyCheckedIn: 0,
  });
  const [recentReservations, setRecentReservations] = useState<Reservation[]>(
    []
  );

  // Hotel/Room Data (for dialogs)
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

  // Fetch dashboard stats and recent reservations
  useEffect(() => {
    async function fetchStatsAndRecents() {
      const token = localStorage.getItem("token");
      // Fetch hotels first
      const hotelsRes = await fetch("http://localhost:5000/api/hotels");
      const hotelsData = await hotelsRes.json();
      const hotelsList = hotelsData.data || [];
      setHotels(hotelsList); // Keep for other dialog usage

      const hotelsById = Object.fromEntries(
        hotelsList.map((h: Hotel) => [String(h.id), h.name])
      );

      // Fetch reservations
      const res = await fetch("http://localhost:5000/api/reservations/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);

      let todayCheckIns = 0;
      let todayCheckOuts = 0;
      let currentlyCheckedIn = 0;
      let totalReservations = data.reservations.length;

      // Map hotel names into reservations
      const sorted = [...data.reservations]
        .map((r: Reservation) => ({
          ...r,
          hotelName: hotelsById[String(r.hotelId)] || r.hotelName || r.hotelId,
        }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      // Compute stats
      sorted.forEach((r: Reservation) => {
        if (r.arrivalDate && r.arrivalDate.slice(0, 10) === todayStr)
          todayCheckIns++;
        if (r.departureDate && r.departureDate.slice(0, 10) === todayStr)
          todayCheckOuts++;
        if (r.status === "checked-in") currentlyCheckedIn++;
      });

      setStats({
        todayCheckIns,
        todayCheckOuts,
        totalReservations,
        currentlyCheckedIn,
      });

      setRecentReservations(sorted.slice(0, 6));
    }
    fetchStatsAndRecents();
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Top NavBar */}
      <NavBar />

      {/* Flex row: Sidebar + Main */}
      <div className="flex flex-1 min-h-0">
        {/* Clerk Sidebar */}
        <ClerkSidebar />

        {/* Main Content */}
        <main className="flex-1 ml-60 pt-16">
          <div className="py-8 px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Clerk Dashboard
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Welcome back! Manage reservations and check-ins efficiently.
                  </p>
                </div>
                <div className="flex gap-3 mt-4 sm:mt-0">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    onClick={() => setShowWalkInDialog(true)}
                  >
                    <UserCheck className="h-4 w-4" />
                    Walk-In Check-In
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                    onClick={() => setShowReservationDialog(true)}
                  >
                    <Plus className="h-4 w-4" />
                    New Reservation
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-all duration-300">
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
                  <p className="text-xs text-gray-500 mt-1">
                    Scheduled for today
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-emerald-500 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Today's Check-Outs
                  </CardTitle>
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CalendarX2 className="h-5 w-5 text-emerald-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.todayCheckOuts}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Departing today</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-all duration-300">
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
                  <p className="text-xs text-gray-500 mt-1">
                    All time reservations
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-all duration-300">
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

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Reservations - Takes 2/3 width */}
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-0">
                  <CardHeader className="border-b border-gray-200 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Recent Reservations
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                        onClick={() =>
                          (window.location.href =
                            "/dashboard/clerk/reservations")
                        }
                      >
                        View All
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-hidden">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="font-semibold text-gray-700">
                              Guest
                            </TableHead>
                            <TableHead className="font-semibold text-gray-700">
                              Hotel
                            </TableHead>
                            <TableHead className="font-semibold text-gray-700">
                              Room
                            </TableHead>
                            <TableHead className="font-semibold text-gray-700">
                              Dates
                            </TableHead>
                            <TableHead className="font-semibold text-gray-700">
                              Status
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentReservations.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center py-8 text-gray-500"
                              >
                                <div className="flex flex-col items-center justify-center">
                                  <ClipboardList className="h-12 w-12 text-gray-300 mb-2" />
                                  <p>No recent reservations</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            recentReservations.map((r) => (
                              <TableRow
                                key={r.id}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <TableCell>
                                  <div className="font-medium text-gray-900">
                                    {r.guestName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {r.guestEmail}
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {r.hotelName || r.hotelId}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-semibold">
                                      {r.roomType}
                                    </span>
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
                                    className={`
                                      ${
                                        r.status === "checked-in"
                                          ? "bg-green-100 text-green-800 border-green-200"
                                          : ""
                                      }
                                      ${
                                        r.status === "checked-out"
                                          ? "bg-gray-100 text-gray-800 border-gray-200"
                                          : ""
                                      }
                                      ${
                                        r.status === "confirmed"
                                          ? "bg-blue-100 text-blue-800 border-blue-200"
                                          : ""
                                      }
                                      ${
                                        r.status === "reserved"
                                          ? "bg-amber-100 text-amber-800 border-amber-200"
                                          : ""
                                      }
                                      font-medium px-2 py-1
                                    `}
                                  >
                                    {r.status.charAt(0).toUpperCase() +
                                      r.status.slice(1)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Walk-In Check-In Dialog */}
          <Dialog open={showWalkInDialog} onOpenChange={setShowWalkInDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  Walk-In Check-In
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-3">
                  <Label>Guest Name *</Label>
                  <Input
                    value={walkInForm.guestName}
                    onChange={(e) =>
                      handleWalkInChange("guestName", e.target.value)
                    }
                    placeholder="Enter guest name"
                  />

                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={walkInForm.email}
                    onChange={(e) =>
                      handleWalkInChange("email", e.target.value)
                    }
                    placeholder="guest@example.com"
                  />

                  <Label>Phone Number *</Label>
                  <Input
                    value={walkInForm.phoneNumber}
                    onChange={(e) =>
                      handleWalkInChange("phoneNumber", e.target.value)
                    }
                    placeholder="+1 (555) 000-0000"
                  />

                  <Label>Guests *</Label>
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
                </div>

                <div className="space-y-3">
                  <Label>Hotel *</Label>
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

                  <Label>Room Type *</Label>
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
                          {rt.label} (LKR {rt.price}/night) - {rt.available}{" "}
                          available
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Label>Room Number *</Label>
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

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Arrival Date *</Label>
                      <Input
                        type="date"
                        value={walkInForm.arrivalDate}
                        onChange={(e) =>
                          handleWalkInChange("arrivalDate", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Departure Date *</Label>
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
              </div>

              {walkInForm.roomId &&
                walkInForm.arrivalDate &&
                walkInForm.departureDate && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-blue-600">
                          Total Amount
                        </div>
                        <div className="text-2xl font-bold text-blue-700">
                          LKR {calculateTotalAmountForWalkIn()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowWalkInDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleWalkInCheckIn}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Check-In Guest
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* New Reservation Dialog */}
          <Dialog
            open={showReservationDialog}
            onOpenChange={setShowReservationDialog}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Plus className="h-5 w-5 text-emerald-600" />
                  New Reservation
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-3">
                  <Label>Guest Name *</Label>
                  <Input
                    value={reservationForm.guestName}
                    onChange={(e) =>
                      handleReservationChange("guestName", e.target.value)
                    }
                    placeholder="Enter guest name"
                  />

                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={reservationForm.email}
                    onChange={(e) =>
                      handleReservationChange("email", e.target.value)
                    }
                    placeholder="guest@example.com"
                  />

                  <Label>Phone Number *</Label>
                  <Input
                    value={reservationForm.phoneNumber}
                    onChange={(e) =>
                      handleReservationChange("phoneNumber", e.target.value)
                    }
                    placeholder="+1 (555) 000-0000"
                  />

                  <Label>Guests *</Label>
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
                </div>

                <div className="space-y-3">
                  <Label>Hotel *</Label>
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

                  <Label>Room Type *</Label>
                  <Select
                    value={reservationForm.roomType}
                    onValueChange={(v) =>
                      handleReservationChange("roomType", v)
                    }
                    disabled={!reservationForm.hotelId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map((rt) => (
                        <SelectItem key={rt.type} value={rt.type}>
                          {rt.label} (LKR {rt.price}/night) - {rt.available}{" "}
                          available
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Label>Room Number *</Label>
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

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Arrival Date *</Label>
                      <Input
                        type="date"
                        value={reservationForm.arrivalDate}
                        onChange={(e) =>
                          handleReservationChange("arrivalDate", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Departure Date *</Label>
                      <Input
                        type="date"
                        value={reservationForm.departureDate}
                        onChange={(e) =>
                          handleReservationChange(
                            "departureDate",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {reservationForm.roomId &&
                reservationForm.arrivalDate &&
                reservationForm.departureDate && (
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-emerald-600">
                          Total Amount
                        </div>
                        <div className="text-2xl font-bold text-emerald-700">
                          LKR {calculateTotalAmountForReservation()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowReservationDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReservationCreate}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Create Reservation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
