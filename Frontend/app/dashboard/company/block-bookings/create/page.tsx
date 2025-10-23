"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { CalendarIcon, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import NavBar from "@/components/nav-bar";
import { useToast } from "@/hooks/use-toast";

export default function CreateBlockBookingPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State for hotels and rooms
  const [hotels, setHotels] = useState<{ id: string | number; name: string }[]>(
    []
  );
  const [roomTypes, setRoomTypes] = useState<
    { type: string; label: string; price?: number }[]
  >([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [formData, setFormData] = useState({
    hotelId: "",
    rooms: 3,
    roomType: "",
    arrivalDate: undefined as Date | undefined,
    departureDate: undefined as Date | undefined,
    discountRate: 10,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch hotels on mount
  useEffect(() => {
    async function fetchHotels() {
      setLoadingHotels(true);
      try {
        const res = await fetch("http://localhost:5000/api/hotels");
        const data = await res.json();
        setHotels(
          (data.data || []).map((h: any) => ({ id: h.id, name: h.name }))
        );
      } catch {
        setHotels([]);
      } finally {
        setLoadingHotels(false);
      }
    }
    fetchHotels();
  }, []);

  // Fetch room types when hotel changes
  useEffect(() => {
    if (!formData.hotelId) {
      setRoomTypes([]);
      setFormData((prev) => ({ ...prev, roomType: "" }));
      return;
    }

    async function fetchRoomTypes() {
      setLoadingRooms(true);
      try {
        const res = await fetch(
          `http://localhost:5000/api/hotels/${formData.hotelId}`
        );
        const data = await res.json();
        // Assume API returns: { ..., rooms: [{ type: 'deluxe', label: 'Deluxe Room', price: 180 }, ...] }
        setRoomTypes(data.rooms || []);
        if (!data.rooms?.find((r: any) => r.type === formData.roomType)) {
          setFormData((prev) => ({ ...prev, roomType: "" }));
        }
      } catch {
        setRoomTypes([]);
        setFormData((prev) => ({ ...prev, roomType: "" }));
      } finally {
        setLoadingRooms(false);
      }
    }
    fetchRoomTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.hotelId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.hotelId) newErrors.hotelId = "Hotel is required";
    if (formData.rooms < 3)
      newErrors.rooms = "Minimum 3 rooms required for block booking";
    if (!formData.roomType) newErrors.roomType = "Room type is required";
    if (!formData.arrivalDate)
      newErrors.arrivalDate = "Arrival date is required";
    if (!formData.departureDate)
      newErrors.departureDate = "Departure date is required";
    if (formData.discountRate < 0 || formData.discountRate > 50) {
      newErrors.discountRate = "Discount rate must be between 0% and 50%";
    }
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

  const calculateTotal = () => {
    if (!formData.arrivalDate || !formData.departureDate || !formData.roomType)
      return 0;

    const nights = Math.ceil(
      (formData.departureDate.getTime() - formData.arrivalDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const roomTypeObj = roomTypes.find((r) => r.type === formData.roomType);
    let baseRate = 0;
    if (roomTypeObj && roomTypeObj["price"]) baseRate = roomTypeObj["price"];
    const fallbackRates: any = {
      standard: 120,
      deluxe: 180,
      suite: 280,
      residential: 450,
    };
    if (!baseRate)
      baseRate =
        fallbackRates[formData.roomType as keyof typeof fallbackRates] || 0;
    const totalBeforeDiscount = baseRate * nights * formData.rooms;
    const discountAmount = totalBeforeDiscount * (formData.discountRate / 100);

    return totalBeforeDiscount - discountAmount;
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Create handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = "http://localhost:5000/api/block-bookings";
      const method = "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hotelId: formData.hotelId,
          rooms: formData.rooms,
          roomType: formData.roomType,
          arrivalDate: formData.arrivalDate?.toISOString(),
          departureDate: formData.departureDate?.toISOString(),
          discountRate: formData.discountRate,
          totalAmount: calculateTotal(),
        }),
      });
      if (!response.ok) throw new Error("Failed to create block booking.");
      const data = await response.json();
      toast({
        title: "Block Booking Created!",
        description: `Successfully created block booking for ${formData.rooms} rooms.`,
      });
      setFormData({
        hotelId: "",
        rooms: 3,
        roomType: "",
        arrivalDate: undefined,
        departureDate: undefined,
        discountRate: 10,
      });
      router.push("/dashboard/company/block-bookings");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create block booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <NavBar />
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold mb-4">Create Block Booking</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-purple-700 dark:text-purple-300">
              Create Block Booking
            </CardTitle>
            <CardDescription>
              Book multiple rooms with special rates (minimum 3 rooms)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Hotel Selection */}
              <div className="space-y-2">
                <Label htmlFor="hotel">Hotel *</Label>
                <Select
                  value={formData.hotelId}
                  onValueChange={(value) => updateFormData("hotelId", value)}
                  disabled={loadingHotels}
                >
                  <SelectTrigger
                    className={cn(errors.hotelId && "border-red-500")}
                  >
                    <SelectValue
                      placeholder={
                        loadingHotels ? "Loading hotels..." : "Select hotel"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map((hotel) => (
                      <SelectItem key={hotel.id} value={hotel.id.toString()}>
                        {hotel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Show message if no hotels available */}
                {!loadingHotels && hotels.length === 0 && (
                  <p className="text-sm text-gray-500 px-2 py-1">
                    No hotels available
                  </p>
                )}
                {errors.hotelId && (
                  <p className="text-sm text-red-500">{errors.hotelId}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rooms">Number of Rooms *</Label>
                  <Input
                    id="rooms"
                    type="number"
                    min="3"
                    value={formData.rooms}
                    onChange={(e) =>
                      updateFormData(
                        "rooms",
                        Number.parseInt(e.target.value) || 3
                      )
                    }
                    className={cn(errors.rooms && "border-red-500")}
                  />
                  {errors.rooms && (
                    <p className="text-sm text-red-500">{errors.rooms}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomType">Room Type *</Label>
                  <Select
                    value={formData.roomType}
                    onValueChange={(value) => updateFormData("roomType", value)}
                    disabled={
                      !formData.hotelId ||
                      loadingRooms ||
                      roomTypes.length === 0
                    }
                  >
                    <SelectTrigger
                      className={cn(errors.roomType && "border-red-500")}
                    >
                      <SelectValue
                        placeholder={
                          !formData.hotelId
                            ? "Select hotel first"
                            : loadingRooms
                            ? "Loading rooms..."
                            : roomTypes.length === 0
                            ? "No rooms available"
                            : "Select room type"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map((room) => (
                        <SelectItem key={room.type} value={room.type}>
                          {room.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Show message if no rooms available */}
                  {!loadingRooms &&
                    formData.hotelId &&
                    roomTypes.length === 0 && (
                      <p className="text-sm text-gray-500 px-2 py-1">
                        No rooms available
                      </p>
                    )}
                  {errors.roomType && (
                    <p className="text-sm text-red-500">{errors.roomType}</p>
                  )}
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
                      Number.parseInt(e.target.value) || 0
                    )
                  }
                  className={cn(errors.discountRate && "border-red-500")}
                />
                {errors.discountRate && (
                  <p className="text-sm text-red-500">{errors.discountRate}</p>
                )}
                <p className="text-sm text-gray-500">
                  Negotiated discount rate for bulk booking
                </p>
              </div>

              {formData.arrivalDate &&
                formData.departureDate &&
                formData.roomType && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">
                      Booking Summary
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Rooms:</span>
                        <span>{formData.rooms}</span>
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
                        <span>${calculateTotal().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Block Booking...
                    </>
                  ) : (
                    "Create Block Booking"
                  )}
                </Button>
                <Button
                  type="button"
                  className="w-1/4 bg-gray-200 dark:bg-gray-700 dark:text-white"
                  onClick={() => router.push("/dashboard/company")}
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
