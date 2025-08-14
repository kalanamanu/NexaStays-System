"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  UserCheck,
  UserX,
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  Key,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import NavBar from "@/components/nav-bar";
import { useUser } from "@/context/user-context";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  formatISO,
  isAfter,
  isBefore,
  isToday,
  parseISO,
  addWeeks,
  addMonths,
  differenceInCalendarDays,
} from "date-fns";

type ReservationStatus =
  | "pending"
  | "confirmed"
  | "reserved"
  | "pending_payment"
  | "checked-in"
  | "checked-out"
  | "no-show"
  | "cancelled";

interface Reservation {
  id: string;
  guestName: string;
  email: string;
  guestPhone: string;
  phoneNumber?: string;
  roomType: string;
  roomNumber?: string;
  arrivalDate: string; // ISO
  departureDate: string; // ISO
  status: ReservationStatus;
  guests: number;
  totalAmount: number;
  creditCard?: string; // if present, it's guaranteed
  rateType?: "nightly" | "weekly" | "monthly";
  createdAt: string;
  updatedAt: string;
}
interface Room {
  id: number;
  number: string;
  type: string;
  status: "available" | "occupied" | "maintenance";
  pricePerNight: number;
}
interface Bill {
  roomCharges: number;
  restaurant: number;
  roomService: number;
  laundry: number;
  telephone: number;
  club: number;
  other: number;
  lateCheckout: number;
  total?: number; // <-- optional now
  reservationId?: string;
}
interface ReservationForm {
  guestName: string;
  email: string;
  phoneNumber: string;
  roomType: string;
  roomNumber: string;
  guests: number;
  arrivalDate: string;
  departureDate: string;
  creditCard: string;
  rateType: "nightly" | "weekly" | "monthly";
}

export default function ClerkDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState({
    guestName: "",
    email: "",
    phoneNumber: "",
    roomType: "",
    roomNumber: "",
    guests: 1,
    arrivalDate: formatISO(new Date(), { representation: "date" }),
    departureDate: formatISO(new Date(Date.now() + 86400000), {
      representation: "date",
    }),
    creditCard: "",
    rateType: "nightly" as "nightly" | "weekly" | "monthly",
  });

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReservation, setSelectedReservation] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [showReservationDialog, setShowReservationDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showNoShowDialog, setShowNoShowDialog] = useState(false);
  const [walkInMode, setWalkInMode] = useState(false);
  const [editingReservation, setEditingReservation] =
    useState<Reservation | null>(null);
  const [reservationForm, setReservationForm] = useState({
    guestName: "",
    email: "",
    phoneNumber: "",
    roomType: "",
    roomNumber: "",
    guests: 1,
    arrivalDate: "",
    departureDate: "",
    creditCard: "",
    rateType: "nightly" as "nightly" | "weekly" | "monthly",
  });
  const [checkoutBill, setCheckoutBill] = useState<Bill>({
    roomCharges: 0,
    restaurant: 0,
    roomService: 0,
    laundry: 0,
    telephone: 0,
    club: 0,
    other: 0,
    lateCheckout: 0,
    total: 0,
  });
  const [reportDialog, setReportDialog] = useState(false);
  const [todayOccupancy, setTodayOccupancy] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [noShowTarget, setNoShowTarget] = useState<Reservation | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [lastBill, setLastBill] = useState<Bill | null>(null);
  const [receiptMode, setReceiptMode] = useState<"preview" | "final">(
    "preview"
  );

  //Get all available rooms
  useEffect(() => {
    async function fetchRooms() {
      const res = await fetch("http://localhost:5000/api/rooms/available");
      const data = await res.json();
      setAvailableRooms(data);
      setRooms(data); // Optionally setRooms if you want to use all rooms elsewhere
    }
    fetchRooms();
  }, []);

  function openWalkInDialog() {
    setWalkInMode(true);
    setForm({
      guestName: "",
      email: "",
      phoneNumber: "",
      roomType: availableRooms[0]?.type || "",
      roomNumber: availableRooms[0]?.number || "",
      guests: 1,
      arrivalDate: formatISO(new Date(), { representation: "date" }),
      departureDate: formatISO(new Date(Date.now() + 86400000), {
        representation: "date",
      }),
      creditCard: "",
      rateType: "nightly",
    });
    setShowReservationDialog(true);
  }

  function openReservationDialog() {
    setWalkInMode(false);
    setForm({
      guestName: "",
      email: "",
      phoneNumber: "",
      roomType: "",
      roomNumber: "",
      guests: 1,
      arrivalDate: formatISO(new Date(), { representation: "date" }),
      departureDate: formatISO(new Date(Date.now() + 86400000), {
        representation: "date",
      }),
      creditCard: "",
      rateType: "nightly",
    });
    setShowReservationDialog(true);
  }

  // Demo data
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);

  //Get all reservations
  useEffect(() => {
    async function fetchAllReservations() {
      setLoadingReservations(true);
      setReservationError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/reservations/all", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch reservations");
        const data = await res.json();

        // Transform backend data to your flat Reservation shape
        const flatReservations: Reservation[] = data.reservations.map(
          (r: any) => ({
            ...r,
            guestName: r.customer
              ? `${r.customer.firstName} ${r.customer.lastName}`
              : r.guestName || "-",
            phoneNumber: r.customer?.phone || r.phoneNumber || "-",
            arrivalDate: r.arrivalDate?.slice(0, 10), // <--- format to YYYY-MM-DD
            departureDate: r.departureDate?.slice(0, 10), // <--- format to YYYY-MM-DD
          })
        );

        setReservations(flatReservations);
      } catch (err: any) {
        setReservationError(err.message || "Failed to load reservations.");
      } finally {
        setLoadingReservations(false);
      }
    }
    fetchAllReservations();
  }, []);

  // ---- Form change handler ----
  function handleFormChange(field: string, value: string | number) {
    // Handle auto departure for Residential Suite
    let arrival = form.arrivalDate;
    let departure = form.departureDate;
    let rateType = form.rateType;
    if (field === "arrivalDate") {
      arrival = value as string;
      if (
        form.roomType === "Residential Suite" &&
        form.rateType !== "nightly"
      ) {
        if (form.rateType === "weekly")
          departure = formatISO(addWeeks(new Date(arrival), 1), {
            representation: "date",
          });
        else if (form.rateType === "monthly")
          departure = formatISO(addMonths(new Date(arrival), 1), {
            representation: "date",
          });
      }
    }
    if (field === "rateType") {
      rateType = value as "nightly" | "weekly" | "monthly";
      if (
        form.roomType === "Residential Suite" &&
        (value === "weekly" || value === "monthly")
      ) {
        if (form.arrivalDate) {
          if (value === "weekly")
            departure = formatISO(addWeeks(new Date(form.arrivalDate), 1), {
              representation: "date",
            });
          else if (value === "monthly")
            departure = formatISO(addMonths(new Date(form.arrivalDate), 1), {
              representation: "date",
            });
        }
      }
    }
    setForm((prev) => ({
      ...prev,
      [field]: value,
      arrivalDate: arrival,
      departureDate: departure,
      rateType,
    }));
  }

  // ---- Reservation submit handler ----
  function handleSubmit() {
    if (
      !form.guestName ||
      !form.phoneNumber ||
      !form.arrivalDate ||
      !form.departureDate
    ) {
      alert("Please fill required fields");
      return;
    }

    let assignedRoomNumber = "";
    let assignedRoomType = "";
    let price = 0;

    if (walkInMode) {
      // Find selected room from availableRooms
      const room = availableRooms.find(
        (r) => r.number.toString() === form.roomNumber
      );
      if (!room) {
        alert("Room not found");
        return;
      }
      assignedRoomNumber = room.number;
      assignedRoomType = room.type;
      price = calculateRoomCharges(
        room.pricePerNight,
        form.arrivalDate,
        form.departureDate,
        form.rateType
      );
    } else {
      assignedRoomType = form.roomType;
      // For new reservation, assign just type, not number. Use any room's price for that type.
      const room = rooms.find((r) => r.type === assignedRoomType);
      price = calculateRoomCharges(
        room?.pricePerNight || 0,
        form.arrivalDate,
        form.departureDate,
        form.rateType
      );
    }

    const res: Reservation = {
      id: "RES" + Math.floor(Math.random() * 10000),
      guestName: form.guestName,
      email: form.email,
      guestPhone: form.phoneNumber, // Added guestPhone property
      phoneNumber: form.phoneNumber,
      roomType: assignedRoomType,
      roomNumber: walkInMode ? assignedRoomNumber : undefined,
      arrivalDate: form.arrivalDate,
      departureDate: form.departureDate,
      status: walkInMode ? "checked-in" : "confirmed",
      guests: form.guests,
      totalAmount: price,
      rateType: form.rateType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setReservations((prev) => [...prev, res]);
    setShowReservationDialog(false);
  }

  const [originalDepartureDate, setOriginalDepartureDate] = useState<
    string | null
  >(null);

  useEffect(() => {
    const now = new Date();
    const isNight = now.getHours() >= 19;
    if (isNight) {
      setReservations((prev) =>
        prev.map((r) => {
          if (
            (r.status === "pending" || r.status === "confirmed") &&
            !r.creditCard &&
            isToday(new Date(r.arrivalDate)) &&
            (!r.roomNumber || r.roomNumber === "")
          ) {
            return {
              ...r,
              status: "cancelled",
              updatedAt: new Date().toISOString(),
            };
          }
          return r;
        })
      );
    }
    if (isNight) {
      setReservations((prev) =>
        prev.map((r) => {
          if (
            (r.status === "confirmed" || r.status === "pending") &&
            isToday(new Date(r.arrivalDate)) &&
            (!r.roomNumber || r.roomNumber === "")
          ) {
            return {
              ...r,
              status: "no-show",
              updatedAt: new Date().toISOString(),
            };
          }
          return r;
        })
      );
    }
    // Calculate today's occupancy and revenue (yesterday night)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const occ = reservations.filter(
      (r) =>
        r.status === "checked-in" &&
        isAfter(new Date(r.departureDate), yesterday) &&
        isBefore(new Date(r.arrivalDate), now)
    ).length;
    setTodayOccupancy(occ);
    const rev = reservations
      .filter(
        (r) =>
          r.status === "checked-out" &&
          isAfter(new Date(r.departureDate), yesterday)
      )
      .reduce((sum, r) => sum + r.totalAmount, 0);
    setTodayRevenue(rev);
  }, []);

  useEffect(() => {
    if (!user || user.role !== "clerk") {
      router.push("/login");
    }
  }, [user, router]);

  // Reservation Form Handlers
  function openNewReservationDialog(walkin = false) {
    setWalkInMode(walkin);
    setReservationForm({
      guestName: "",
      email: "",
      phoneNumber: "",
      roomType: "",
      roomNumber: "",
      guests: 1,
      arrivalDate: "",
      departureDate: "",
      creditCard: "",
      rateType: "nightly",
    });
    setShowReservationDialog(true);
  }

  // Daily revenue and Occupancy
  useEffect(() => {
    // Calculate for "previous night"
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    // Occupancy: rooms that were checked in and still present yesterday night
    const occ = reservations.filter(
      (r) =>
        r.status === "checked-in" &&
        isAfter(new Date(r.departureDate), yesterday) &&
        isBefore(new Date(r.arrivalDate), now)
    ).length;

    // Revenue: total for rooms checked out yesterday
    const rev = reservations
      .filter(
        (r) =>
          r.status === "checked-out" &&
          isAfter(new Date(r.departureDate), yesterday) &&
          isBefore(new Date(r.departureDate), now)
      )
      .reduce((sum, r) => sum + r.totalAmount, 0);

    setTodayOccupancy(occ);
    setTodayRevenue(rev);
  }, [reservations]);

  function handleReservationFormChange(field: string, value: string) {
    setReservationForm((prev) => {
      let next = { ...prev, [field]: value };

      // If user is changing the departureDate directly, let them!
      if (field === "departureDate") {
        return next;
      }

      // Special logic for Residential Suite, weekly/monthly
      const isResidentialSuite =
        (field === "roomType" && value === "Residential Suite") ||
        (field !== "roomType" && prev.roomType === "Residential Suite");

      const nextRateType =
        field === "rateType"
          ? (value as "nightly" | "weekly" | "monthly")
          : prev.rateType;

      // If switching to Residential Suite, default rateType to weekly
      if (field === "roomType" && value === "Residential Suite") {
        next.rateType = "weekly";
      }
      // If switching away from Residential Suite, reset rateType to nightly
      if (field === "roomType" && value !== "Residential Suite") {
        next.rateType = "nightly";
      }

      // Auto-calculate departure date if needed
      if (
        isResidentialSuite &&
        (nextRateType === "weekly" || nextRateType === "monthly")
      ) {
        // Use the arrival date from next state (after update)
        const arrival =
          (field === "arrivalDate" ? value : prev.arrivalDate) || "";
        if (arrival) {
          if (nextRateType === "weekly") {
            next.departureDate = formatISO(addWeeks(new Date(arrival), 1), {
              representation: "date",
            });
          } else if (nextRateType === "monthly") {
            next.departureDate = formatISO(addMonths(new Date(arrival), 1), {
              representation: "date",
            });
          }
        }
      }

      return next;
    });
  }

  async function fetchAvailableRooms() {
    const res = await fetch("http://localhost:5000/api/rooms/available");
    const data = await res.json();
    setAvailableRooms(data);
    setRooms(data);
  }

  // Create a Reservation
  async function handleCreateReservation() {
    if (
      !reservationForm.guestName ||
      !reservationForm.roomType ||
      !reservationForm.arrivalDate ||
      !reservationForm.departureDate ||
      !reservationForm.phoneNumber ||
      (walkInMode && !reservationForm.roomNumber)
    ) {
      toast({
        title: "Missing Fields",
        description: "All required fields must be filled.",
        variant: "destructive",
      });
      return;
    }

    if (!reservationForm.guests || reservationForm.guests < 1) {
      toast({
        title: "Missing Fields",
        description: "Please enter the number of guests.",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      let pricePerNight = 0;

      if (walkInMode) {
        const selectedRoom = availableRooms.find(
          (r) =>
            r.type === reservationForm.roomType &&
            r.number === reservationForm.roomNumber
        );
        pricePerNight = selectedRoom?.pricePerNight || 0;
      } else {
        const anyRoom = availableRooms.find(
          (r) => r.type === reservationForm.roomType
        );
        pricePerNight = anyRoom?.pricePerNight || 0;
      }

      const payload = {
        guestName: reservationForm.guestName,
        guestPhone: reservationForm.phoneNumber,
        guestEmail: reservationForm.email,
        roomType: reservationForm.roomType,
        roomNumber: reservationForm.roomNumber,
        arrivalDate: reservationForm.arrivalDate,
        departureDate: reservationForm.departureDate,
        guests: reservationForm.guests,
        totalAmount: calculateRoomCharges(
          pricePerNight,
          reservationForm.arrivalDate,
          reservationForm.departureDate,
          reservationForm.rateType
        ),
        status: walkInMode ? "checked-in" : "reserved",
      };

      console.log("Payload to backend:", payload);
      const endpoint = "http://localhost:5000/api/reservations/clerk";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to create reservation"
        );
      }

      if (data.reservation) {
        setReservations((prev) => [...prev, data.reservation]);
        // REFRESH available rooms from backend after reservation
        await fetchAvailableRooms();
      }

      setShowReservationDialog(false);
      toast({
        title: walkInMode ? "Walk-in Checked In" : "Reservation Created",
        description: `${reservationForm.guestName} ${
          walkInMode ? "checked in" : "reservation has been created"
        }`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Could not create reservation",
        variant: "destructive",
      });
    }
  }

  //Edit
  function handleEditReservation(res: Reservation) {
    setEditingReservation(res);
    setReservationForm({
      guestName: "",
      email: "",
      phoneNumber: "",
      roomType: "",
      roomNumber: "",
      guests: 1,
      arrivalDate: "",
      departureDate: "",
      creditCard: "",
      rateType: "nightly",
    });
    setShowEditDialog(true);
  }

  function handleSaveEditReservation() {
    if (!editingReservation) return;
    setReservations((prev) =>
      prev.map((r) =>
        r.id === editingReservation.id
          ? {
              ...r,
              guestName: reservationForm.guestName,
              email: reservationForm.email,
              phoneNumber: reservationForm.phoneNumber,
              roomType: reservationForm.roomType,
              guests: reservationForm.guests,
              arrivalDate: reservationForm.arrivalDate,
              departureDate: reservationForm.departureDate,
              creditCard: reservationForm.creditCard,
              rateType: reservationForm.rateType,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
    setShowEditDialog(false);
    toast({
      title: "Reservation Updated",
      description: "Reservation details saved.",
    });
  }

  function handleCancelReservation(res: Reservation) {
    setCancelTarget(res);
    setShowCancelDialog(true);
  }

  function doCancelReservation() {
    if (!cancelTarget) return;
    setReservations((prev) =>
      prev.map((r) =>
        r.id === cancelTarget.id
          ? { ...r, status: "cancelled", updatedAt: new Date().toISOString() }
          : r
      )
    );
    setShowCancelDialog(false);
    setCancelTarget(null);
    toast({
      title: "Reservation Cancelled",
      description: "Reservation has been cancelled.",
    });
  }

  function handleNoShow(res: Reservation) {
    setNoShowTarget(res);
    setShowNoShowDialog(true);
  }

  function doNoShow() {
    if (!noShowTarget) return;
    setReservations((prev) =>
      prev.map((r) =>
        r.id === noShowTarget.id
          ? { ...r, status: "no-show", updatedAt: new Date().toISOString() }
          : r
      )
    );
    setShowNoShowDialog(false);
    setNoShowTarget(null);
    toast({
      title: "Marked as No-Show",
      description: "Billing record has been created for no-show.",
    });
  }

  function getAvailableRoomForType(roomType: string): string | undefined {
    const room = availableRooms.find(
      (r) => r.type === roomType && r.status === "available"
    );
    return room?.number;
  }

  function calculateRoomCharges(
    nightlyPrice: number,
    arrival: string,
    departure: string,
    rateType: "nightly" | "weekly" | "monthly" = "nightly"
  ): number {
    if (rateType === "weekly") return nightlyPrice * 7;
    if (rateType === "monthly") return nightlyPrice * 30;
    const nights = Math.max(
      1,
      differenceInCalendarDays(new Date(departure), new Date(arrival))
    );
    return nights * nightlyPrice;
  }

  async function fetchAllReservations() {
    setLoadingReservations(true);
    setReservationError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/reservations/all", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch reservations");
      const data = await res.json();
      const flatReservations: Reservation[] = data.reservations.map(
        (r: any) => ({
          ...r,
          guestName: r.customer
            ? `${r.customer.firstName} ${r.customer.lastName}`
            : r.guestName || "-",
          phoneNumber: r.customer?.phone || r.phoneNumber || "-",
          arrivalDate: r.arrivalDate?.slice(0, 10),
          departureDate: r.departureDate?.slice(0, 10),
        })
      );
      setReservations(flatReservations);
    } catch (err: any) {
      setReservationError(err.message || "Failed to load reservations.");
    } finally {
      setLoadingReservations(false);
    }
  }

  // Check-In Logic
  async function handleAssignRoomAndCheckIn() {
    if (!selectedReservation || !selectedRoom) {
      toast({
        title: "Error",
        description: "Please select both a reservation and a room.",
        variant: "destructive",
      });
      return;
    }
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
            reservationId: selectedReservation,
            roomNumber: selectedRoom,
          }),
        }
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to check in");
      }
      // Refetch reservations and rooms so UI updates
      await fetchAllReservations();
      await fetchAvailableRooms();

      toast({
        title: "Check-in Successful",
        description: `Guest has been checked into room ${selectedRoom}.`,
      });
      setSelectedReservation("");
      setSelectedRoom("");
    } catch (err: any) {
      toast({
        title: "Check-in Failed",
        description: err.message || "Could not check in guest.",
        variant: "destructive",
      });
    }
  }

  // Set bill and original departure date when reservation changes
  useEffect(() => {
    if (!selectedReservation) {
      setCheckoutBill({
        roomCharges: 0,
        restaurant: 0,
        roomService: 0,
        laundry: 0,
        telephone: 0,
        club: 0,
        other: 0,
        lateCheckout: 0,
      });
      setOriginalDepartureDate(null);
      return;
    }
    const res = reservations.find((r) => r.id === selectedReservation);
    if (res) {
      setCheckoutBill({
        roomCharges: res.totalAmount,
        restaurant: 0,
        roomService: 0,
        laundry: 0,
        telephone: 0,
        club: 0,
        other: 0,
        lateCheckout: 0,
      });
      setOriginalDepartureDate(res.departureDate);
    }
  }, [selectedReservation]);

  // Only update roomCharges if check-out date is extended or changed
  useEffect(() => {
    if (!selectedReservation) return;
    const res = reservations.find((r) => r.id === selectedReservation);
    if (!res) return;

    if (
      originalDepartureDate &&
      isAfter(new Date(res.departureDate), new Date(originalDepartureDate))
    ) {
      const room =
        rooms.find(
          (r) => r.type.toLowerCase() === res.roomType.toLowerCase()
        ) ||
        availableRooms.find(
          (r) => r.type.toLowerCase() === res.roomType.toLowerCase()
        );
      const nightlyPrice = room?.pricePerNight || 0;
      const rateType = res.rateType || "nightly";
      const newRoomCharges = calculateRoomCharges(
        nightlyPrice,
        res.arrivalDate,
        res.departureDate,
        rateType
      );
      setCheckoutBill((prev) => ({
        ...prev,
        roomCharges: newRoomCharges,
      }));
    } else if (originalDepartureDate) {
      setCheckoutBill((prev) => ({
        ...prev,
        roomCharges: res.totalAmount,
      }));
    }
  }, [
    selectedReservation,
    reservations,
    originalDepartureDate,
    rooms,
    availableRooms,
  ]);

  // Calculate total at render (not in state!)
  const billTotal =
    checkoutBill.roomCharges +
    checkoutBill.restaurant +
    checkoutBill.roomService +
    checkoutBill.laundry +
    checkoutBill.telephone +
    checkoutBill.club +
    checkoutBill.other +
    checkoutBill.lateCheckout;

  async function handleCheckOut() {
    if (!selectedReservation || !paymentMethod) {
      toast({
        title: "Error",
        description: "Please select a reservation and payment method.",
        variant: "destructive",
      });
      return;
    }
    // Find reservation
    const res = reservations.find((r) => r.id === selectedReservation);
    if (!res) return;

    // Get room price for this reservation
    const room = rooms.find((r) => r.type === res.roomType);
    const nightlyPrice = room?.pricePerNight || 0;

    // Calculate late checkout
    let lateFee = 0;
    const scheduled = new Date(res.departureDate);
    const now = new Date();
    if (isAfter(now, scheduled)) {
      lateFee = calculateRoomCharges(
        nightlyPrice,
        res.departureDate,
        formatISO(now, { representation: "date" }),
        res.rateType
      );
    }

    // Prepare bill (with lateFee)
    const bill: Bill = {
      ...checkoutBill,
      lateCheckout: lateFee,
      total:
        checkoutBill.roomCharges +
        checkoutBill.restaurant +
        checkoutBill.roomService +
        checkoutBill.laundry +
        checkoutBill.telephone +
        checkoutBill.club +
        checkoutBill.other +
        lateFee,
      roomCharges: checkoutBill.roomCharges,
    };

    try {
      const token = localStorage.getItem("token");
      const resCheckout = await fetch(
        "http://localhost:5000/api/reservations/checkout",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reservationId: selectedReservation,
            paymentMethod,
            bill,
          }),
        }
      );
      if (!resCheckout.ok) {
        const errData = await resCheckout.json();
        throw new Error(errData.error || "Checkout failed.");
      }
      // 1. Set lastBill and receipt mode BEFORE opening dialog
      setLastBill(bill);
      setReceiptMode("final");
      setShowBillDialog(true);

      // 2. Optionally reset related states
      setSelectedReservation("");
      setPaymentMethod("");
      // setCheckoutBill(defaultBillState); // reset after setting lastBill if you want

      // 3. Refresh state
      await fetchAllReservations();
      await fetchAvailableRooms();

      toast({
        title: "Check-out Successful",
        description: "Guest has been checked out and receipt generated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Could not check out reservation",
        variant: "destructive",
      });
    }
  }

  // Filtering, coloring, helpers
  const filteredReservations = reservations.filter(
    (reservation) =>
      (reservation.guestName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (reservation.email || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (reservation.id || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "checked-in":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "checked-out":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "no-show":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "cancelled":
        return "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (!user) return null;

  const dialogRoom = walkInMode
    ? availableRooms.find(
        (r) => r.number.toString() === reservationForm.roomNumber
      )
    : availableRooms.find((r) => r.type === reservationForm.roomType);
  const dialogNightlyPrice = dialogRoom ? dialogRoom.pricePerNight : 0;
  const showAmount =
    reservationForm.arrivalDate &&
    reservationForm.departureDate &&
    (walkInMode ? reservationForm.roomNumber : reservationForm.roomType);
  const estimatedAmount = showAmount
    ? calculateRoomCharges(
        dialogNightlyPrice,
        reservationForm.arrivalDate,
        reservationForm.departureDate,
        reservationForm.rateType
      )
    : 0;

  function handleCheckoutDateChange(newDate: string) {
    if (!selectedReservation) return;
    const res = reservations.find((r) => r.id === selectedReservation);
    if (!res || !newDate) return;

    // Only recalculate if the new date is after the original departure
    if (
      originalDepartureDate &&
      isAfter(new Date(newDate), new Date(originalDepartureDate))
    ) {
      // Find the room for price lookup
      const room = rooms.find((r) => r.type === res.roomType);
      const nightlyPrice = room?.pricePerNight || 0;
      // The rateType can be nightly/weekly/monthly; use res.rateType or default to nightly
      const rateType = res.rateType || "nightly";
      // Calculate room charges for the new duration
      const newRoomCharges = calculateRoomCharges(
        nightlyPrice,
        res.arrivalDate,
        newDate,
        rateType
      );
      setCheckoutBill((prev) => ({
        ...prev,
        roomCharges: newRoomCharges,
      }));
    } else if (originalDepartureDate) {
      // If moved back to the original or earlier, revert to original room charge
      setCheckoutBill((prev) => ({
        ...prev,
        roomCharges: res.totalAmount,
      }));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Clerk Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage check-ins, check-outs, and reservations
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setReportDialog(true)}
            >
              <FileText className="h-4 w-4" />
              Daily Occupancy/Revenue Report
            </Button>
          </div>

          <Tabs defaultValue="checkin" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="checkin">Check-In</TabsTrigger>
              <TabsTrigger value="checkout">Check-Out</TabsTrigger>
              <TabsTrigger value="reservations">Reservations</TabsTrigger>
            </TabsList>

            {/* Check-In Tab */}
            <TabsContent value="checkin">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Guest Check-In
                  </CardTitle>
                  <CardDescription>
                    Check in guests and assign rooms or process walk-ins
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="guest-search">Search Guest</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="guest-search"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reservation-select">
                          Select Reservation
                        </Label>
                        <Select
                          value={selectedReservation}
                          onValueChange={setSelectedReservation}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose reservation" />
                          </SelectTrigger>
                          <SelectContent>
                            {reservations
                              .filter(
                                (r) =>
                                  r.status === "confirmed" ||
                                  r.status === "pending" ||
                                  r.status === "pending_payment" ||
                                  r.status === "reserved" // Include reserved
                              )
                              .map((reservation) => (
                                <SelectItem
                                  key={reservation.id}
                                  value={reservation.id}
                                >
                                  {reservation.id} - {reservation.guestName} (
                                  {reservation.roomType}
                                  {reservation.creditCard ? (
                                    <span title="Guaranteed by card">
                                      {" "}
                                      <CreditCard className="inline h-3 w-3 text-green-600" />
                                    </span>
                                  ) : (
                                    <span title="Not guaranteed">
                                      {" "}
                                      <AlertCircle className="inline h-3 w-3 text-yellow-600" />
                                    </span>
                                  )}
                                  )
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Separator />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => openNewReservationDialog(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Walk-In Check-In
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => openNewReservationDialog(false)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          New Reservation
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="room-select">Assign Room</Label>
                        <Select
                          value={selectedRoom}
                          onValueChange={setSelectedRoom}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose available room" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRooms
                              .filter((room) => room.status === "available")
                              .map((room) => (
                                <SelectItem
                                  key={room.number}
                                  value={room.number.toString()}
                                >
                                  Room {room.number} - {room.type} ($
                                  {room.pricePerNight}/night)
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        onClick={handleAssignRoomAndCheckIn}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Check In Guest
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Check-Out Tab */}
            <TabsContent value="checkout">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserX className="h-5 w-5" />
                    Guest Check-Out
                  </CardTitle>
                  <CardDescription>
                    Process guest check-out, change checkout date, add charges
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="checkout-reservation">
                          Select Reservation
                        </Label>
                        <Select
                          value={selectedReservation}
                          onValueChange={setSelectedReservation}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose reservation to check out" />
                          </SelectTrigger>
                          <SelectContent>
                            {reservations
                              .filter((r) => r.status === "checked-in")
                              .map((reservation) => (
                                <SelectItem
                                  key={reservation.id}
                                  value={reservation.id}
                                >
                                  {reservation.id} - {reservation.guestName}{" "}
                                  (Room {reservation.roomNumber})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payment-method">Payment Method</Label>
                        <Select
                          value={paymentMethod}
                          onValueChange={setPaymentMethod}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="credit">Credit Card</SelectItem>
                            <SelectItem value="debit">Debit Card</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Change checkout date */}
                      <div className="space-y-2">
                        <Label htmlFor="change-checkout-date">
                          Change Checkout Date
                        </Label>
                        <Input
                          id="change-checkout-date"
                          type="date"
                          value={
                            reservations.find(
                              (r) => r.id === selectedReservation
                            )?.departureDate || ""
                          }
                          onChange={(e) => {
                            setReservations((prev) =>
                              prev.map((r) =>
                                r.id === selectedReservation
                                  ? { ...r, departureDate: e.target.value }
                                  : r
                              )
                            );
                            // ADD THIS:
                            handleCheckoutDateChange(e.target.value);
                          }}
                        />
                        <span className="text-xs text-gray-500">
                          Changing the checkout date may result in extra charges
                          for late checkout.
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Bill Summary</h3>
                      <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex justify-between">
                          <span>Room Charges</span>
                          <span>${checkoutBill.roomCharges}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Restaurant</span>
                          <Input
                            type="number"
                            min={0}
                            value={checkoutBill.restaurant}
                            onChange={(e) =>
                              setCheckoutBill((prev) => ({
                                ...prev,
                                restaurant: Number(e.target.value),
                              }))
                            }
                            className="w-20"
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>Room Service</span>
                          <Input
                            type="number"
                            min={0}
                            value={checkoutBill.roomService}
                            onChange={(e) =>
                              setCheckoutBill((prev) => ({
                                ...prev,
                                roomService: Number(e.target.value),
                              }))
                            }
                            className="w-20"
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>Laundry</span>
                          <Input
                            type="number"
                            min={0}
                            value={checkoutBill.laundry}
                            onChange={(e) =>
                              setCheckoutBill((prev) => ({
                                ...prev,
                                laundry: Number(e.target.value),
                              }))
                            }
                            className="w-20"
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>Telephone</span>
                          <Input
                            type="number"
                            min={0}
                            value={checkoutBill.telephone}
                            onChange={(e) =>
                              setCheckoutBill((prev) => ({
                                ...prev,
                                telephone: Number(e.target.value),
                              }))
                            }
                            className="w-20"
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>Club Facility</span>
                          <Input
                            type="number"
                            min={0}
                            value={checkoutBill.club}
                            onChange={(e) =>
                              setCheckoutBill((prev) => ({
                                ...prev,
                                club: Number(e.target.value),
                              }))
                            }
                            className="w-20"
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>Other Charges</span>
                          <Input
                            type="number"
                            min={0}
                            value={checkoutBill.other}
                            onChange={(e) =>
                              setCheckoutBill((prev) => ({
                                ...prev,
                                other: Number(e.target.value),
                              }))
                            }
                            className="w-20"
                          />
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total</span>
                          <span>
                            $
                            {checkoutBill.roomCharges +
                              checkoutBill.restaurant +
                              checkoutBill.roomService +
                              checkoutBill.laundry +
                              checkoutBill.telephone +
                              checkoutBill.club +
                              checkoutBill.other +
                              checkoutBill.lateCheckout}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleCheckOut}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Process Check-Out
                        </Button>
                        <Dialog
                          open={showBillDialog}
                          onOpenChange={setShowBillDialog}
                        >
                          <DialogTrigger asChild>
                            {/* <Button variant="outline">
                              <FileText className="h-4 w-4 mr-2" />
                              Preview Receipt
                            </Button> */}
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Receipt Preview</DialogTitle>
                              <DialogDescription>
                                Guest receipt for reservation{" "}
                                {receiptMode === "final"
                                  ? lastBill?.reservationId ??
                                    selectedReservation
                                  : selectedReservation}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="text-center">
                                <h3 className="text-lg font-bold">
                                  Nexa Stays
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Thank you for staying with us!
                                </p>
                              </div>
                              <Separator />
                              <div className="space-y-2">
                                {/**
                                 * Choose which bill object to display:
                                 * - If in "final" mode after checkout, use lastBill (frozen)
                                 * - If in "preview" mode before checkout, use checkoutBill (editable)
                                 */}
                                {(() => {
                                  const billToShow =
                                    receiptMode === "final" && lastBill
                                      ? lastBill
                                      : checkoutBill;
                                  return (
                                    <>
                                      <div className="flex justify-between">
                                        <span>Room Charges</span>
                                        <span>
                                          ${billToShow.roomCharges ?? 0}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Restaurant</span>
                                        <span>
                                          ${billToShow.restaurant ?? 0}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Room Service</span>
                                        <span>
                                          ${billToShow.roomService ?? 0}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Laundry</span>
                                        <span>${billToShow.laundry ?? 0}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Telephone</span>
                                        <span>
                                          ${billToShow.telephone ?? 0}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Club Facility</span>
                                        <span>${billToShow.club ?? 0}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Other</span>
                                        <span>${billToShow.other ?? 0}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Late Checkout</span>
                                        <span>
                                          ${billToShow.lateCheckout ?? 0}
                                        </span>
                                      </div>
                                      <Separator />
                                      <div className="flex justify-between font-bold">
                                        <span>Total</span>
                                        <span>
                                          $
                                          {(billToShow.roomCharges ?? 0) +
                                            (billToShow.restaurant ?? 0) +
                                            (billToShow.roomService ?? 0) +
                                            (billToShow.laundry ?? 0) +
                                            (billToShow.telephone ?? 0) +
                                            (billToShow.club ?? 0) +
                                            (billToShow.other ?? 0) +
                                            (billToShow.lateCheckout ?? 0)}
                                        </span>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline">Print Receipt</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reservations Tab */}
            <TabsContent value="reservations">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle>All Reservations</CardTitle>
                      <CardDescription>
                        Manage all hotel reservations
                      </CardDescription>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        className="gap-2"
                        onClick={() => openNewReservationDialog(false)}
                      >
                        <Plus className="h-4 w-4" />
                        New Reservation
                      </Button>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search reservations..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Guest</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Check-in</TableHead>
                          <TableHead>Check-out</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Credit Card</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReservations.map((reservation) => (
                          <TableRow key={reservation.id}>
                            <TableCell className="font-medium">
                              {reservation.id}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {reservation.guestName || "-"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {reservation.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {reservation.phoneNumber ||
                                reservation.guestPhone}
                            </TableCell>
                            <TableCell>
                              {reservation.roomNumber
                                ? `${reservation.roomNumber} (${reservation.roomType})`
                                : reservation.roomType}
                              {reservation.rateType &&
                              reservation.roomType === "Residential Suite" ? (
                                <div className="text-xs text-gray-500">
                                  ({reservation.rateType})
                                </div>
                              ) : null}
                            </TableCell>
                            <TableCell>{reservation.arrivalDate}</TableCell>
                            <TableCell>{reservation.departureDate}</TableCell>
                            <TableCell>
                              <Badge
                                className={getStatusColor(reservation.status)}
                              >
                                {reservation.status.charAt(0).toUpperCase() +
                                  reservation.status.slice(1)}
                              </Badge>
                              {reservation.status === "pending" &&
                                !reservation.creditCard && (
                                  <span
                                    title="Will auto-cancel at 7 PM"
                                    className="ml-2 text-xs text-yellow-600 flex items-center gap-1"
                                  >
                                    <AlertCircle className="inline h-3 w-3" />{" "}
                                    Not guaranteed
                                  </span>
                                )}
                              {reservation.status === "no-show" && (
                                <span className="ml-2 text-xs text-red-600 flex items-center gap-1">
                                  <Key className="inline h-3 w-3" /> No-Show
                                </span>
                              )}
                            </TableCell>
                            <TableCell>${reservation.totalAmount}</TableCell>
                            <TableCell>
                              {reservation.creditCard ? (
                                <span>
                                  <CreditCard className="inline h-4 w-4 text-green-600" />{" "}
                                  {reservation.creditCard}
                                </span>
                              ) : (
                                <span className="text-yellow-600 font-medium">
                                  No Card
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleEditReservation(reservation)
                                }
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {(reservation.status === "confirmed" ||
                                reservation.status === "pending") && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    handleCancelReservation(reservation)
                                  }
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                              {(reservation.status === "confirmed" ||
                                reservation.status === "pending") &&
                                isToday(new Date(reservation.arrivalDate)) &&
                                (!reservation.roomNumber ||
                                  reservation.roomNumber === "") && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleNoShow(reservation)}
                                  >
                                    Mark No-Show
                                  </Button>
                                )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* New Reservation Dialog */}
      <Dialog
        open={showReservationDialog}
        onOpenChange={setShowReservationDialog}
      >
        <DialogContent
          style={{
            maxHeight: "90vh",
            overflowY: "auto",
            minWidth: 350,
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {walkInMode ? "Walk-In Check-In" : "New Reservation"}
            </DialogTitle>
            <DialogDescription>
              {walkInMode
                ? "Create and check in a walk-in guest."
                : "Create a new reservation for a guest."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Guest Name*</Label>
            <Input
              value={reservationForm.guestName}
              onChange={(e) =>
                handleReservationFormChange("guestName", e.target.value)
              }
            />
            <Label>Email</Label>
            <Input
              type="email"
              value={reservationForm.email}
              onChange={(e) =>
                handleReservationFormChange("email", e.target.value)
              }
            />
            <Label>Phone Number*</Label>
            <Input
              value={reservationForm.phoneNumber}
              onChange={(e) =>
                handleReservationFormChange("phoneNumber", e.target.value)
              }
              placeholder="e.g. 555-123-4567"
            />

            {/* Walk-In: Show room number selection */}
            {walkInMode ? (
              <>
                <Label>Room*</Label>
                <Select
                  value={reservationForm.roomNumber}
                  onValueChange={(value) => {
                    handleReservationFormChange("roomNumber", value);
                    const room = availableRooms.find(
                      (r) => r.number.toString() === value
                    );
                    if (room) {
                      handleReservationFormChange("roomType", room.type);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.map((room) => (
                      <SelectItem
                        key={room.number}
                        value={room.number.toString()}
                      >
                        Room {room.number} - {room.type} (${room.pricePerNight}
                        /night)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : (
              <>
                <Label>Room Type*</Label>
                <Select
                  value={reservationForm.roomType}
                  onValueChange={(value) =>
                    handleReservationFormChange("roomType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...new Set(availableRooms.map((r) => r.type))].map(
                      (type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </>
            )}

            {/* If Residential Suite */}
            {reservationForm.roomType === "Residential Suite" ? (
              <>
                <Label>Rate Type*</Label>
                <Select
                  value={reservationForm.rateType}
                  onValueChange={(value) =>
                    handleReservationFormChange(
                      "rateType",
                      value as "nightly" | "weekly" | "monthly"
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rate type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="nightly">Nightly</SelectItem>
                  </SelectContent>
                </Select>

                {reservationForm.rateType === "weekly" ||
                reservationForm.rateType === "monthly" ? (
                  <div className="flex gap-2" key="suite-long">
                    <div>
                      <Label>Start Date*</Label>
                      <Input
                        type="date"
                        value={reservationForm.arrivalDate}
                        onChange={(e) =>
                          handleReservationFormChange(
                            "arrivalDate",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label>End Date*</Label>
                      <Input
                        type="date"
                        value={reservationForm.departureDate}
                        disabled
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2" key="suite-nightly">
                    <div>
                      <Label>Arrival Date*</Label>
                      <Input
                        type="date"
                        value={reservationForm.arrivalDate}
                        onChange={(e) =>
                          handleReservationFormChange(
                            "arrivalDate",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label>Departure Date*</Label>
                      <Input
                        type="date"
                        value={reservationForm.departureDate}
                        onChange={(e) =>
                          handleReservationFormChange(
                            "departureDate",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex gap-2" key="not-suite">
                <div>
                  <Label>Arrival Date*</Label>
                  <Input
                    type="date"
                    value={reservationForm.arrivalDate}
                    onChange={(e) =>
                      handleReservationFormChange("arrivalDate", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label>Departure Date*</Label>
                  <Input
                    type="date"
                    value={reservationForm.departureDate}
                    onChange={(e) =>
                      handleReservationFormChange(
                        "departureDate",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            )}

            <Label>Credit Card (optional, for guarantee)</Label>
            <Input
              value={reservationForm.creditCard}
              onChange={(e) =>
                handleReservationFormChange("creditCard", e.target.value)
              }
              placeholder="VISA 4111 1111 1111 1111"
            />

            {showAmount && (
              <div className="flex justify-between items-center p-2 rounded bg-blue-50 dark:bg-blue-900 my-2">
                <span className="font-medium">Estimated Total:</span>
                <span className="font-bold text-lg">${estimatedAmount}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleCreateReservation}>
              {walkInMode ? "Check In Walk-In" : "Create Reservation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Reservation Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reservation</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Guest Name*</Label>
            <Input
              value={reservationForm.guestName}
              onChange={(e) =>
                handleReservationFormChange("guestName", e.target.value)
              }
            />
            <Label>Email</Label>
            <Input
              type="email"
              value={reservationForm.email}
              onChange={(e) =>
                handleReservationFormChange("email", e.target.value)
              }
            />
            <Label>Phone Number*</Label>
            <Input
              value={reservationForm.phoneNumber}
              onChange={(e) =>
                handleReservationFormChange("phoneNumber", e.target.value)
              }
              placeholder="e.g. 555-123-4567"
            />
            <Label>Room Type*</Label>
            <Select
              value={reservationForm.roomType}
              onValueChange={(value) =>
                handleReservationFormChange("roomType", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Deluxe">Deluxe</SelectItem>
                <SelectItem value="Suite">Suite</SelectItem>
                <SelectItem value="Residential Suite">
                  Residential Suite
                </SelectItem>
              </SelectContent>
            </Select>
            {reservationForm.roomType === "Residential Suite" && (
              <>
                <Label>Rate Type*</Label>
                <Select
                  value={reservationForm.rateType}
                  onValueChange={(value) =>
                    handleReservationFormChange(
                      "rateType",
                      value as "nightly" | "weekly" | "monthly"
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rate type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="nightly">Nightly</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
            {reservationForm.roomType === "Residential Suite" &&
            reservationForm.rateType !== "nightly" ? (
              <>
                <Label>Start Date*</Label>
                <Input
                  type="date"
                  value={reservationForm.arrivalDate}
                  onChange={(e) =>
                    handleReservationFormChange("arrivalDate", e.target.value)
                  }
                />
                <Label>End Date*</Label>
                <Input
                  type="date"
                  value={reservationForm.departureDate}
                  disabled
                />
              </>
            ) : (
              <div className="flex gap-2">
                <div>
                  <Label>Arrival Date*</Label>
                  <Input
                    type="date"
                    value={reservationForm.arrivalDate}
                    onChange={(e) =>
                      handleReservationFormChange("arrivalDate", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label>Departure Date*</Label>
                  <Input
                    type="date"
                    value={reservationForm.departureDate}
                    onChange={(e) =>
                      handleReservationFormChange(
                        "departureDate",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            )}
            <Label>Credit Card (optional, for guarantee)</Label>
            <Input
              value={reservationForm.creditCard}
              onChange={(e) =>
                handleReservationFormChange("creditCard", e.target.value)
              }
              placeholder="VISA 4111 1111 1111 1111"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEditReservation}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Reservation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Reservation</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to cancel reservation{" "}
            <span className="font-bold">{cancelTarget?.id}</span> for{" "}
            {cancelTarget?.guestName}?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              No
            </Button>
            <Button variant="destructive" onClick={doCancelReservation}>
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* No-Show Dialog */}
      <Dialog open={showNoShowDialog} onOpenChange={setShowNoShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as No-Show</DialogTitle>
          </DialogHeader>
          <p>
            Mark reservation{" "}
            <span className="font-bold">{noShowTarget?.id}</span> for{" "}
            {noShowTarget?.guestName} as No-Show? A billing record will be
            created.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNoShowDialog(false)}
            >
              No
            </Button>
            <Button variant="destructive" onClick={doNoShow}>
              Yes, Mark No-Show
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Occupancy/Revenue Report Dialog */}
      <Dialog open={reportDialog} onOpenChange={setReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Occupancy & Revenue Report (Previous Night)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div>
              <span className="font-bold">Occupancy:</span> {todayOccupancy}{" "}
              rooms
            </div>
            <div>
              <span className="font-bold">Revenue:</span> ${todayRevenue}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
