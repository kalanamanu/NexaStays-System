"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import NavBar from "@/components/nav-bar";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
const fetcher = (url: string) =>
  fetch(`${API_BASE}${url}`, { credentials: "include" }).then((res) =>
    res.json()
  );

function getNights(arrival?: Date, departure?: Date) {
  if (!arrival || !departure) return 1;
  const nights = Math.ceil(
    (departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(nights, 1);
}

export default function EditReservationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id?.toString();
  const { toast } = useToast();

  // Reservation state
  const [reservation, setReservation] = useState<any>(null);

  // Hotel/room data
  const { data: hotelsData, isLoading: hotelsLoading } = useSWR(
    "/api/hotels",
    fetcher
  );
  const hotels = Array.isArray(hotelsData)
    ? hotelsData
    : Array.isArray(hotelsData?.data)
    ? hotelsData.data
    : [];

  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [selectedHotelDetails, setSelectedHotelDetails] = useState<any>(null);
  const [hotelDetailsLoading, setHotelDetailsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    hotelId: "",
    fullName: "",
    email: "",
    phone: "",
    occupants: "1",
    arrivalDate: undefined as Date | undefined,
    departureDate: undefined as Date | undefined,
    skipCreditCard: false,
  });

  // Room selection
  const [selectedRoomType, setSelectedRoomType] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  // Validation/errors/loading
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch reservation on mount (with token from localStorage)
  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/api/reservations/${id}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.reservation) {
          setReservation(data.reservation);
          // Prefill form with reservation data
          setFormData({
            hotelId: data.reservation.hotelId?.toString() || "",
            fullName: data.reservation.guestName || "",
            email: data.reservation.guestEmail || "",
            phone: data.reservation.guestPhone || "",
            occupants: data.reservation.guests?.toString() || "1",
            arrivalDate: data.reservation.arrivalDate
              ? new Date(data.reservation.arrivalDate)
              : undefined,
            departureDate: data.reservation.departureDate
              ? new Date(data.reservation.departureDate)
              : undefined,
            skipCreditCard: false, // Set as needed or fetch if supported
          });
          setSelectedHotelId(data.reservation.hotelId?.toString() || "");
          setSelectedRoomType((data.reservation.roomType || "").toLowerCase());
          setSelectedRoomId(data.reservation.roomId?.toString() || "");
        }
      });
  }, [id]);

  // Fetch hotel detail for selected hotel
  useEffect(() => {
    if (!selectedHotelId) {
      setSelectedHotelDetails(null);
      return;
    }
    setHotelDetailsLoading(true);
    fetch(`${API_BASE}/api/hotels/${selectedHotelId}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setSelectedHotelDetails(data.data);
        setHotelDetailsLoading(false);
      })
      .catch(() => {
        setSelectedHotelDetails(null);
        setHotelDetailsLoading(false);
      });
  }, [selectedHotelId]);

  // Compute available rooms/types from selectedHotelDetails
  const availableRooms = useMemo(
    () =>
      selectedHotelDetails?.rooms?.filter(
        (r: any) =>
          String(r.status).toLowerCase() === "available" ||
          r.id?.toString() === selectedRoomId // Allow current reserved room to be selected
      ) || [],
    [selectedHotelDetails, selectedRoomId]
  );
  const availableRoomTypeDetails = useMemo(() => {
    const typeMap: {
      [type: string]: {
        type: string;
        price: number;
        available: number;
        rooms: any[];
      };
    } = {};
    for (const r of availableRooms) {
      const type = (r.type || "").toLowerCase();
      if (!type) continue;
      if (!typeMap[type]) {
        typeMap[type] = {
          type,
          price: r.pricePerNight ?? 0,
          available: 1,
          rooms: [r],
        };
      } else {
        typeMap[type].available += 1;
        typeMap[type].rooms.push(r);
        if (
          r.pricePerNight !== undefined &&
          r.pricePerNight < typeMap[type].price
        ) {
          typeMap[type].price = r.pricePerNight;
        }
      }
    }
    return Object.values(typeMap);
  }, [availableRooms]);

  // Autofill selectedRoomType and selectedRoomId if needed
  useEffect(() => {
    if (
      availableRoomTypeDetails.length > 0 &&
      (!selectedRoomType ||
        !availableRoomTypeDetails.find((t) => t.type === selectedRoomType))
    ) {
      setSelectedRoomType(availableRoomTypeDetails[0].type);
      const firstRoom = availableRoomTypeDetails[0].rooms?.[0];
      setSelectedRoomId(firstRoom ? firstRoom.id.toString() : "");
    } else if (selectedRoomType) {
      const foundType = availableRoomTypeDetails.find(
        (t) => t.type === selectedRoomType
      );
      if (foundType && foundType.rooms?.length > 0) {
        if (!foundType.rooms.find((r) => r.id.toString() === selectedRoomId)) {
          setSelectedRoomId(foundType.rooms[0].id.toString());
        }
      } else {
        setSelectedRoomId("");
      }
    }
  }, [availableRoomTypeDetails, selectedRoomType, selectedRoomId]);

  // Handler for changing hotel selection (dropdown)
  const handleHotelDropdownChange = (value: string) => {
    setSelectedHotelId(value);
  };

  // Handler for changing occupants
  const handleOccupantsChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      occupants: value,
    }));
  };

  // Handler for changing form fields
  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const nights = getNights(formData.arrivalDate, formData.departureDate);
  const selectedTypeInfo = availableRoomTypeDetails.find(
    (t) => t.type === selectedRoomType
  );
  const totalAmount = selectedTypeInfo ? selectedTypeInfo.price * nights : 0;

  // --- Validation & submission logic ---
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.hotelId) newErrors.hotelId = "Hotel is required";
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!selectedRoomType) newErrors.roomType = "Room type is required";
    if (!selectedRoomId) newErrors.roomType = "Room number is required";
    if (!formData.arrivalDate)
      newErrors.arrivalDate = "Arrival date is required";
    if (!formData.departureDate)
      newErrors.departureDate = "Departure date is required";
    if (
      formData.arrivalDate &&
      formData.departureDate &&
      formData.arrivalDate >= formData.departureDate
    ) {
      newErrors.departureDate = "Departure date must be after arrival date";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Submit updated reservation ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);

    const selectedRoomObj = (
      availableRoomTypeDetails.find((t) => t.type === selectedRoomType)
        ?.rooms ?? []
    ).find((room) => room.id.toString() === selectedRoomId);

    try {
      const reqBody = {
        hotelId: formData.hotelId,
        roomType: selectedRoomType,
        roomIds: [selectedRoomId],
        roomNumber: selectedRoomObj?.number || "",
        arrivalDate: formData.arrivalDate?.toISOString(),
        departureDate: formData.departureDate?.toISOString(),
        guests: Number(formData.occupants),
        totalAmount,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      };
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/api/reservations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(reqBody),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Reservation Updated!",
          description: "Your reservation has been updated.",
        });
        router.push("/dashboard/customer");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update reservation.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (hotelsLoading || !reservation || hotelDetailsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <NavBar />
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center text-lg">
            Loading reservation...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Edit Reservation
              </CardTitle>
              <CardDescription className="text-center">
                Update your reservation details below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="hotel">Hotel *</Label>
                  <Select
                    value={selectedHotelId}
                    onValueChange={handleHotelDropdownChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotels.map((hotel: any) => (
                        <SelectItem key={hotel.id} value={hotel.id.toString()}>
                          {hotel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.hotelId && (
                    <p className="text-sm text-red-500">{errors.hotelId}</p>
                  )}
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) =>
                          updateFormData("fullName", e.target.value)
                        }
                        className={cn(errors.fullName && "border-red-500")}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-red-500">
                          {errors.fullName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          updateFormData("email", e.target.value)
                        }
                        className={cn(errors.email && "border-red-500")}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      className={cn(errors.phone && "border-red-500")}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Room Details</h3>
                  <div className="space-y-2">
                    <Label>Room Type *</Label>
                    <Select
                      value={selectedRoomType}
                      onValueChange={(type) => {
                        setSelectedRoomType(type);
                        // Reset roomId to first available for that type
                        const foundType = availableRoomTypeDetails.find(
                          (t) => t.type === type
                        );
                        if (
                          foundType &&
                          foundType.rooms &&
                          foundType.rooms[0]
                        ) {
                          setSelectedRoomId(foundType.rooms[0].id.toString());
                        } else {
                          setSelectedRoomId("");
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoomTypeDetails.map((t) => (
                          <SelectItem
                            key={t.type}
                            value={t.type}
                            disabled={!t.rooms || t.rooms.length === 0}
                          >
                            {t.type.charAt(0).toUpperCase() + t.type.slice(1)}{" "}
                            (${t.price}/night, {t.rooms?.length ?? 0} available)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedRoomType && (
                    <div className="space-y-2">
                      <Label>Room Number *</Label>
                      <Select
                        value={selectedRoomId}
                        onValueChange={setSelectedRoomId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select room number" />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            availableRoomTypeDetails.find(
                              (t) => t.type === selectedRoomType
                            )?.rooms ?? []
                          ).map((room) => (
                            <SelectItem
                              key={room.id}
                              value={room.id.toString()}
                            >
                              Room {room.number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Number of Occupants *</Label>
                    <Select
                      value={formData.occupants?.toString() ?? ""}
                      onValueChange={(value) =>
                        updateFormData("occupants", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of occupants" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Guest</SelectItem>
                        <SelectItem value="2">2 Guests</SelectItem>
                        <SelectItem value="3">3 Guests</SelectItem>
                        <SelectItem value="4">4 Guests</SelectItem>
                        <SelectItem value="5">5 Guests</SelectItem>
                        <SelectItem value="6">6 Guests</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.occupants && (
                      <p className="text-sm text-red-500">{errors.occupants}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Arrival Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.arrivalDate && "text-muted-foreground",
                              errors.arrivalDate && "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.arrivalDate
                              ? format(formData.arrivalDate, "PPP")
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.arrivalDate}
                            onSelect={(date) =>
                              updateFormData("arrivalDate", date)
                            }
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.arrivalDate && (
                        <p className="text-sm text-red-500">
                          {errors.arrivalDate}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Departure Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.departureDate &&
                                "text-muted-foreground",
                              errors.departureDate && "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.departureDate
                              ? format(formData.departureDate, "PPP")
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.departureDate}
                            onSelect={(date) =>
                              updateFormData("departureDate", date)
                            }
                            disabled={(date) =>
                              !formData.arrivalDate ||
                              (formData.arrivalDate &&
                                date < formData.arrivalDate)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.departureDate && (
                        <p className="text-sm text-red-500">
                          {errors.departureDate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="my-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                  <span className="font-semibold text-lg">Total Amount</span>
                  <span className="font-bold text-2xl text-green-700 dark:text-green-300">
                    ${totalAmount}
                  </span>
                  <span className="text-gray-500 ml-4 text-sm">
                    {nights} night{nights > 1 ? "s" : ""} x ${totalAmount}
                    /night
                  </span>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading || !selectedRoomType || !selectedRoomId}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
