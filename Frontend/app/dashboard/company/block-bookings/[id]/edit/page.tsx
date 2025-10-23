"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import NavBar from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Loader2, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Room type model for multi-room-type support
interface BlockBookingRoomType {
  id: number | string;
  roomType: string;
  rooms: number;
}

interface RoomFromHotel {
  id: number | string;
  type: string;
  pricePerNight: number;
}

interface BlockBooking {
  id: number | string;
  arrivalDate: string;
  departureDate: string;
  discountRate: number;
  status: "pending" | "confirmed" | "cancelled";
  totalAmount: number;
  hotel?: {
    id: number | string;
    name: string;
    rooms: RoomFromHotel[];
  };
  roomTypes: BlockBookingRoomType[];
}

export default function EditBlockBookingPage() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [blockBooking, setBlockBooking] = useState<BlockBooking | null>(null);

  // Each entry: type, label, price, rooms (user input)
  const [roomTypeSelections, setRoomTypeSelections] = useState<
    {
      type: string;
      label: string;
      price: number;
      rooms: number;
    }[]
  >([]);

  const [formData, setFormData] = useState({
    arrivalDate: undefined as Date | undefined,
    departureDate: undefined as Date | undefined,
    discountRate: 10,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:5000/api/block-bookings/${id}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Booking not found");
        const data = await res.json();
        setBlockBooking(data.blockBooking);

        // Deduplicate room types from hotel.rooms, using actual pricePerNight
        const roomsArr: RoomFromHotel[] = data.blockBooking.hotel?.rooms || [];
        const typeMap: Record<
          string,
          { type: string; label: string; price: number }
        > = {};
        roomsArr.forEach((room: RoomFromHotel) => {
          const typeKey = room.type.trim().toLowerCase();
          if (!typeMap[typeKey]) {
            typeMap[typeKey] = {
              type: typeKey,
              label: room.type.trim(),
              price: room.pricePerNight,
            };
          }
        });

        // For each type, fill in the booked count if present
        const selections = Object.values(typeMap).map((rt) => {
          const found = data.blockBooking.roomTypes?.find(
            (r: BlockBookingRoomType) =>
              r.roomType.trim().toLowerCase() === rt.type
          );
          return {
            ...rt,
            rooms: found ? found.rooms : 0,
          };
        });
        setRoomTypeSelections(selections);

        setFormData({
          arrivalDate: new Date(data.blockBooking.arrivalDate),
          departureDate: new Date(data.blockBooking.departureDate),
          discountRate: data.blockBooking.discountRate,
        });
      } catch (e) {
        toast({
          title: "Error",
          description: "Failed to load block booking.",
          variant: "destructive",
        });
        router.push("/dashboard/company/block-bookings");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
    // eslint-disable-next-line
  }, [id, router, toast]);

  const updateRoomTypeCount = (type: string, value: number) => {
    setRoomTypeSelections((prev) =>
      prev.map((rt) =>
        rt.type === type ? { ...rt, rooms: Math.max(0, Math.floor(value)) } : rt
      )
    );
    setErrors((prev) => ({ ...prev, [`roomType_${type}`]: "" }));
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const totalRooms = roomTypeSelections.reduce((sum, r) => sum + r.rooms, 0);
    if (totalRooms < 3)
      newErrors.roomTypeSelections =
        "Minimum 3 rooms required for block booking";
    if (!formData.arrivalDate)
      newErrors.arrivalDate = "Arrival date is required";
    if (!formData.departureDate)
      newErrors.departureDate = "Departure date is required";
    if (formData.discountRate < 0)
      newErrors.discountRate = "Discount rate cannot be negative";
    if (formData.discountRate > 50)
      newErrors.discountRate = "Discount rate must not exceed 50%";
    if (
      formData.arrivalDate &&
      formData.departureDate &&
      formData.arrivalDate >= formData.departureDate
    ) {
      newErrors.departureDate = "Departure date must be after arrival date";
    }
    // No negative or non-integer rooms
    for (const rt of roomTypeSelections) {
      if (rt.rooms < 0) newErrors[`roomType_${rt.type}`] = "Cannot be negative";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = () => {
    if (!formData.arrivalDate || !formData.departureDate) return 0;
    const nights = Math.ceil(
      (formData.departureDate.getTime() - formData.arrivalDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    let total = 0;
    for (const rt of roomTypeSelections) {
      total += rt.rooms * rt.price * nights;
    }
    const discountAmount = total * (formData.discountRate / 100);
    return total - discountAmount;
  };

  const calculateTotalBeforeDiscount = () => {
    if (!formData.arrivalDate || !formData.departureDate) return 0;
    const nights = Math.ceil(
      (formData.departureDate.getTime() - formData.arrivalDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    let total = 0;
    for (const rt of roomTypeSelections) {
      total += rt.rooms * rt.price * nights;
    }
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const url = `http://localhost:5000/api/block-bookings/${id}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hotelId: blockBooking?.hotel?.id, // <-- ADD THIS LINE
          roomTypes: roomTypeSelections
            .filter((r) => r.rooms > 0)
            .map((r) => ({ roomType: r.type, rooms: r.rooms })),
          arrivalDate: formData.arrivalDate?.toISOString(),
          departureDate: formData.departureDate?.toISOString(),
          discountRate: formData.discountRate,
          totalAmount: calculateTotal(),
        }),
      });
      if (!response.ok) throw new Error("Failed to update block booking");
      toast({
        title: "Block Booking Updated!",
        description: `Successfully updated block booking.`,
      });
      router.push("/dashboard/company/block-bookings");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update block booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <NavBar />
        <div className="max-w-2xl mx-auto py-12 px-4">
          <h1 className="text-2xl">Loading...</h1>
        </div>
      </div>
    );
  }

  const totalRooms = roomTypeSelections.reduce((sum, r) => sum + r.rooms, 0);

  return (
    <div>
      <NavBar />
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold mb-4">Edit Block Booking</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-purple-700 dark:text-purple-300">
              Edit Block Booking
            </CardTitle>
            <CardDescription>
              Update your block booking details below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Room Type/Count Section */}
              <div className="space-y-2">
                <Label>Room Types and Counts *</Label>
                <div className="space-y-3">
                  {roomTypeSelections.map((rt) => (
                    <div key={rt.type} className="flex items-center gap-3">
                      <span className="min-w-[120px] font-medium">
                        {rt.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        (LKR {rt.price}/night)
                      </span>
                      <Input
                        type="number"
                        min={0}
                        value={rt.rooms}
                        onChange={(e) =>
                          updateRoomTypeCount(
                            rt.type,
                            Math.max(0, Number(e.target.value))
                          )
                        }
                        className={cn(
                          "w-24",
                          errors[`roomType_${rt.type}`] && "border-red-500"
                        )}
                        placeholder="Rooms"
                      />
                      <span className="text-xs text-gray-500">rooms</span>
                      {errors[`roomType_${rt.type}`] && (
                        <span className="text-xs text-red-500 ml-2">
                          {errors[`roomType_${rt.type}`]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {errors.roomTypeSelections && (
                  <p className="text-sm text-red-500">
                    {errors.roomTypeSelections}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Minimum 3 rooms required in total for block booking.
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="font-semibold">Total Rooms:</span>
                  <span>{totalRooms}</span>
                </div>
              </div>
              {/* Dates and Discount */}
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
                          : "Pick arrival date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.arrivalDate}
                        onSelect={(date) => updateFormData("arrivalDate", date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.arrivalDate && (
                    <p className="text-sm text-red-500">{errors.arrivalDate}</p>
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
                          !formData.departureDate && "text-muted-foreground",
                          errors.departureDate && "border-red-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.departureDate
                          ? format(formData.departureDate, "PPP")
                          : "Pick departure date"}
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
                          date < new Date() ||
                          (formData.arrivalDate
                            ? date <= formData.arrivalDate
                            : false)
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
              <div className="space-y-2">
                <Label htmlFor="discountRate">Discount Rate (%)</Label>
                <Input
                  id="discountRate"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.discountRate}
                  onChange={(e) =>
                    updateFormData(
                      "discountRate",
                      Math.max(0, Math.min(50, Number(e.target.value) || 0))
                    )
                  }
                  className={cn(errors.discountRate && "border-red-500")}
                />
                {errors.discountRate && (
                  <p className="text-sm text-red-500">{errors.discountRate}</p>
                )}
                <p className="text-sm text-gray-500">
                  Negotiated discount rate for bulk booking (max 50%)
                </p>
              </div>
              {formData.arrivalDate &&
                formData.departureDate &&
                totalRooms > 0 && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">
                      Booking Summary
                    </h4>
                    <div className="space-y-1 text-sm">
                      {roomTypeSelections.map(
                        (sel) =>
                          sel.rooms > 0 && (
                            <div
                              key={sel.type}
                              className="flex justify-between items-center"
                            >
                              <span>
                                {sel.label} x {sel.rooms} room
                                {sel.rooms > 1 ? "s" : ""} @ LKR {sel.price}
                              </span>
                              <span className="flex flex-col items-end">
                                {formData.discountRate > 0 ? (
                                  <>
                                    <span className="line-through text-gray-400">
                                      LKR
                                      {(
                                        sel.price *
                                        sel.rooms *
                                        Math.ceil(
                                          (formData.departureDate!.getTime() -
                                            formData.arrivalDate!.getTime()) /
                                            (1000 * 60 * 60 * 24)
                                        )
                                      ).toLocaleString()}
                                    </span>
                                    <span className="font-semibold text-purple-700">
                                      LKR
                                      {(
                                        sel.price *
                                        sel.rooms *
                                        Math.ceil(
                                          (formData.departureDate!.getTime() -
                                            formData.arrivalDate!.getTime()) /
                                            (1000 * 60 * 60 * 24)
                                        ) *
                                        (1 - formData.discountRate / 100)
                                      ).toLocaleString()}
                                    </span>
                                  </>
                                ) : (
                                  <span className="font-semibold">
                                    LKR
                                    {(
                                      sel.price *
                                      sel.rooms *
                                      Math.ceil(
                                        (formData.departureDate!.getTime() -
                                          formData.arrivalDate!.getTime()) /
                                          (1000 * 60 * 60 * 24)
                                      )
                                    ).toLocaleString()}
                                  </span>
                                )}
                              </span>
                            </div>
                          )
                      )}
                      <div className="flex justify-between">
                        <span>Total Rooms:</span>
                        <span>{totalRooms}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nights:</span>
                        <span>
                          {Math.ceil(
                            (formData.departureDate.getTime() -
                              formData.arrivalDate.getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>{formData.discountRate}%</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                        <span>Total:</span>
                        <span>
                          {formData.discountRate > 0 && (
                            <span className="line-through text-gray-400 mr-2">
                              LKR{" "}
                              {calculateTotalBeforeDiscount().toLocaleString()}
                            </span>
                          )}
                          <span>LKR {calculateTotal().toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Block Booking...
                    </>
                  ) : (
                    "Update Block Booking"
                  )}
                </Button>
                <Button
                  type="button"
                  className="w-1/4 bg-gray-200 dark:bg-gray-700 dark:text-white"
                  onClick={() =>
                    router.push("/dashboard/company/block-bookings")
                  }
                  variant="outline"
                >
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
