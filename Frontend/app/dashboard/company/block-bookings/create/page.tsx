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
import { CalendarIcon, Loader2, X, Info } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import NavBar from "@/components/nav-bar";
import { useToast } from "@/hooks/use-toast";

interface RoomTypeOption {
  type: string;
  label: string;
  price?: number;
  available: number;
  total: number;
}

interface SelectedType {
  type: string;
  label: string;
  price?: number;
  available: number;
  total: number;
  rooms: number;
}

export default function CreateBlockBookingPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State for hotels and room types
  const [hotels, setHotels] = useState<{ id: string | number; name: string }[]>(
    []
  );
  const [roomTypes, setRoomTypes] = useState<RoomTypeOption[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Block booking form state
  const [formData, setFormData] = useState<{
    hotelId: string | number | "";
    roomTypeSelections: SelectedType[];
    arrivalDate: Date | undefined;
    departureDate: Date | undefined;
    discountRate: number;
  }>({
    hotelId: "",
    roomTypeSelections: [],
    arrivalDate: undefined,
    departureDate: undefined,
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
      setFormData((prev) => ({ ...prev, roomTypeSelections: [] }));
      return;
    }
    async function fetchRoomTypes() {
      setLoadingRooms(true);
      try {
        const res = await fetch(
          `http://localhost:5000/api/hotels/${formData.hotelId}`
        );
        const data = await res.json();
        const roomsArr = data.data?.rooms || [];
        const typeMap: Record<string, RoomTypeOption> = {};
        roomsArr.forEach((room: any) => {
          const typeKey = room.type.trim().toLowerCase();
          if (!typeMap[typeKey]) {
            typeMap[typeKey] = {
              type: typeKey,
              label: room.type.trim(),
              price: room.pricePerNight,
              available: room.status === "available" ? 1 : 0,
              total: 1,
            };
          } else {
            typeMap[typeKey].total += 1;
            if (room.status === "available") typeMap[typeKey].available += 1;
          }
        });
        // Show only room types with available > 0, and display "Available: X from Y"
        const dedupedTypes = Object.values(typeMap).filter(
          (rt) => rt.available > 0
        );
        setRoomTypes(dedupedTypes);
        setFormData((prev) => ({
          ...prev,
          roomTypeSelections: [],
        }));
      } catch {
        setRoomTypes([]);
        setFormData((prev) => ({ ...prev, roomTypeSelections: [] }));
      } finally {
        setLoadingRooms(false);
      }
    }
    fetchRoomTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.hotelId]);

  // Add or update a room type selection
  const updateRoomTypeSelection = (type: string, rooms: number) => {
    const typeKey = type.toLowerCase();
    setFormData((prev) => {
      const prevSelections = prev.roomTypeSelections;
      const idx = prevSelections.findIndex((rt) => rt.type === typeKey);
      const roomTypeMeta = roomTypes.find((rt) => rt.type === typeKey);
      if (rooms === 0) {
        return {
          ...prev,
          roomTypeSelections: prevSelections.filter(
            (rt) => rt.type !== typeKey
          ),
        };
      }
      const newSelection: SelectedType = {
        type: typeKey,
        label: roomTypeMeta?.label || type,
        price: roomTypeMeta?.price,
        available: roomTypeMeta?.available || 0,
        total: roomTypeMeta?.total || 0,
        rooms,
      };
      if (idx === -1) {
        return {
          ...prev,
          roomTypeSelections: [...prevSelections, newSelection],
        };
      } else {
        return {
          ...prev,
          roomTypeSelections: [
            ...prevSelections.slice(0, idx),
            newSelection,
            ...prevSelections.slice(idx + 1),
          ],
        };
      }
    });
    setErrors((prev) => ({ ...prev, [`roomType_${typeKey}`]: "" }));
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.hotelId) newErrors.hotelId = "Hotel is required";
    if (!formData.arrivalDate || !formData.departureDate)
      newErrors.arrivalDate = "Arrival and Departure dates are required";
    if (
      formData.arrivalDate &&
      formData.departureDate &&
      formData.arrivalDate >= formData.departureDate
    ) {
      newErrors.departureDate = "Departure date must be after arrival date";
    }
    if (formData.discountRate < 0)
      newErrors.discountRate = "Discount rate cannot be negative";
    if (formData.discountRate > 50)
      newErrors.discountRate = "Discount cannot exceed 50%";
    const totalRooms = formData.roomTypeSelections.reduce(
      (sum, r) => sum + r.rooms,
      0
    );
    if (formData.roomTypeSelections.length === 0)
      newErrors.roomTypeSelections = "Select at least one room type";
    if (totalRooms < 3)
      newErrors.roomTypeSelections =
        "Minimum 3 rooms required for block booking";
    for (const sel of formData.roomTypeSelections) {
      if (sel.rooms < 0)
        newErrors[`roomType_${sel.type}`] = "Rooms cannot be negative";
      if (sel.rooms > sel.available)
        newErrors[`roomType_${sel.type}`] = "Cannot select more than available";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate total price for all selected room types
  const calculateTotal = () => {
    if (
      !formData.arrivalDate ||
      !formData.departureDate ||
      formData.roomTypeSelections.length === 0
    )
      return 0;
    const nights = Math.ceil(
      (formData.departureDate.getTime() - formData.arrivalDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    let sum = 0;
    for (const sel of formData.roomTypeSelections) {
      const baseRate = sel.price || 0;
      sum += baseRate * nights * sel.rooms;
    }
    const discountAmount = sum * (formData.discountRate / 100);
    return sum - discountAmount;
  };

  const calculateTotalBeforeDiscount = () => {
    if (
      !formData.arrivalDate ||
      !formData.departureDate ||
      formData.roomTypeSelections.length === 0
    )
      return 0;
    const nights = Math.ceil(
      (formData.departureDate.getTime() - formData.arrivalDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    let sum = 0;
    for (const sel of formData.roomTypeSelections) {
      const baseRate = sel.price || 0;
      sum += baseRate * nights * sel.rooms;
    }
    return sum;
  };

  // Submit handler
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
          roomTypes: formData.roomTypeSelections.map((rt) => ({
            roomType: rt.type,
            rooms: rt.rooms,
          })),
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
        description: `Successfully created block booking.`,
      });
      setFormData({
        hotelId: "",
        roomTypeSelections: [],
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
              Block bookings at a discounted rate for one or more nights for{" "}
              <b>three or more rooms</b> of any type.
              <br />
              <span className="flex items-center gap-1 text-purple-800 dark:text-purple-200 mt-2">
                <Info className="w-4 h-4" />
                Bills are charged directly to the travel company. Nexa Stays may
                need to approve the requested discount.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Hotel Selection */}
              <div className="space-y-2">
                <Label htmlFor="hotel">Hotel *</Label>
                <Select
                  value={String(formData.hotelId)}
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
                      <SelectItem key={hotel.id} value={String(hotel.id)}>
                        {hotel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!loadingHotels && hotels.length === 0 && (
                  <p className="text-sm text-gray-500 px-2 py-1">
                    No hotels available
                  </p>
                )}
                {errors.hotelId && (
                  <p className="text-sm text-red-500">{errors.hotelId}</p>
                )}
              </div>

              {/* Room Type Selection */}
              <div className="space-y-2">
                <Label>Room Types *</Label>
                {loadingRooms ? (
                  <div className="text-sm text-gray-500">Loading rooms...</div>
                ) : !formData.hotelId ? (
                  <div className="text-sm text-gray-500">
                    Select hotel first
                  </div>
                ) : roomTypes.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No available room types for this hotel.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {roomTypes.map((rt) => (
                      <div key={rt.type} className="flex items-center gap-3">
                        <span className="min-w-[120px] font-medium">
                          {rt.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          (Available: {rt.available} from {rt.total}, Rate: LKR{" "}
                          {rt.price})
                        </span>
                        <Input
                          type="number"
                          min={0}
                          max={rt.available}
                          value={
                            formData.roomTypeSelections.find(
                              (sel) => sel.type === rt.type
                            )?.rooms ?? 0
                          }
                          onChange={(e) =>
                            updateRoomTypeSelection(
                              rt.type,
                              Math.max(
                                0,
                                Math.min(Number(e.target.value), rt.available)
                              )
                            )
                          }
                          className={cn(
                            "w-24",
                            errors[`roomType_${rt.type}`] && "border-red-500"
                          )}
                          placeholder="Rooms"
                          disabled={rt.available === 0}
                        />
                        <span className="text-xs text-gray-500">rooms</span>
                        {rt.available === 0 && (
                          <span className="text-xs text-gray-400 ml-2 italic">
                            Unavailable
                          </span>
                        )}
                        {errors[`roomType_${rt.type}`] && (
                          <span className="text-xs text-red-500 ml-2">
                            {errors[`roomType_${rt.type}`]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {errors.roomTypeSelections && (
                  <p className="text-sm text-red-500">
                    {errors.roomTypeSelections}
                  </p>
                )}
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
                  step="1"
                  value={formData.discountRate}
                  onChange={(e) => {
                    let val = Number.parseInt(e.target.value) || 0;
                    if (val > 50) val = 50;
                    if (val < 0) val = 0;
                    updateFormData("discountRate", val);
                  }}
                  className={cn(errors.discountRate && "border-red-500")}
                />
                {errors.discountRate && (
                  <p className="text-sm text-red-500">{errors.discountRate}</p>
                )}
                <p className="text-sm text-gray-500">
                  Negotiated discount rate for bulk booking (max 50%)
                </p>
              </div>

              {/* Booking Summary */}
              {formData.arrivalDate &&
                formData.departureDate &&
                formData.roomTypeSelections.length > 0 && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">
                      Booking Summary
                    </h4>
                    <div className="space-y-1 text-sm">
                      {formData.roomTypeSelections.map((sel) =>
                        sel.rooms > 0 ? (
                          <div
                            key={sel.type}
                            className="flex justify-between items-center"
                          >
                            <span>
                              {sel.label} x {sel.rooms} room
                              {sel.rooms > 1 ? "s" : ""} @ LKR {sel.price || 0}
                            </span>
                            <span className="flex flex-col items-end">
                              {formData.discountRate > 0 ? (
                                <>
                                  <span className="line-through text-gray-400">
                                    LKR
                                    {(
                                      (sel.price || 0) *
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
                                      (sel.price || 0) *
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
                                    (sel.price || 0) *
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
                        ) : null
                      )}
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
