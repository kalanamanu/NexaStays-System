"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { CalendarIcon, Loader2, AlertTriangle, Info } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import NavBar from "@/components/nav-bar";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";

// Dynamically import Stripe form (avoids SSR issues)
const ReservationPaymentForm = dynamic(
  () => import("@/components/ReservationPaymentForm"),
  { ssr: false }
);

const ROOM_PRICES: Record<string, number> = {
  standard: 120,
  deluxe: 180,
  suite: 280,
};

const RESIDENTIAL_WEEKLY_RATE = 1200;
const RESIDENTIAL_MONTHLY_RATE = 3500;

function getNights(arrival?: Date, departure?: Date) {
  if (!arrival || !departure) return 1;
  const nights = Math.ceil(
    (departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(nights, 1);
}

function getResidentialDeparture(
  arrival: Date | undefined,
  durationType: "week" | "month" | "",
  durationCount: number
) {
  if (!arrival || !durationType || durationCount <= 0) return undefined;
  const d = new Date(arrival);
  if (durationType === "week") d.setDate(d.getDate() + durationCount * 7);
  else if (durationType === "month") d.setMonth(d.getMonth() + durationCount);
  return d;
}

export default function ReservationPage() {
  // Hotel Room state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    roomType: "",
    occupants: 1,
    arrivalDate: undefined as Date | undefined,
    departureDate: undefined as Date | undefined,
    skipCreditCard: false,
  });

  // Residential Suite state
  const [residentialForm, setResidentialForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    durationType: "" as "week" | "month" | "",
    durationCount: 1,
    arrivalDate: undefined as Date | undefined,
    occupants: 1,
    skipCreditCard: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [residentialErrors, setResidentialErrors] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("hotel");
  const router = useRouter();
  const { toast } = useToast();

  // Hotel calculation
  const nights = getNights(formData.arrivalDate, formData.departureDate);
  const pricePerNight = ROOM_PRICES[formData.roomType] || 0;
  const totalAmount = pricePerNight * nights;

  // Residential calculation
  const resDepartureDate = getResidentialDeparture(
    residentialForm.arrivalDate,
    residentialForm.durationType,
    residentialForm.durationCount
  );
  let residentialTotal = 0;
  if (residentialForm.durationType === "week") {
    residentialTotal = RESIDENTIAL_WEEKLY_RATE * residentialForm.durationCount;
  } else if (residentialForm.durationType === "month") {
    residentialTotal = RESIDENTIAL_MONTHLY_RATE * residentialForm.durationCount;
  }

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.roomType) newErrors.roomType = "Room type is required";
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

  const validateResidential = () => {
    const newErrors: Record<string, string> = {};
    if (!residentialForm.fullName.trim())
      newErrors.fullName = "Full name is required";
    if (!residentialForm.email.trim()) newErrors.email = "Email is required";
    if (!residentialForm.phone.trim())
      newErrors.phone = "Phone number is required";
    if (!residentialForm.arrivalDate)
      newErrors.arrivalDate = "Arrival date is required";
    if (!residentialForm.durationType)
      newErrors.durationType = "Duration type is required";
    if (!residentialForm.durationCount || residentialForm.durationCount < 1)
      newErrors.durationCount = "Duration must be at least 1";
    setResidentialErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const updateResidentialForm = (field: string, value: any) => {
    setResidentialForm((prev) => ({ ...prev, [field]: value }));
    if (residentialErrors[field])
      setResidentialErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const reqBody = {
        roomType: formData.roomType,
        arrivalDate: formData.arrivalDate?.toISOString(),
        departureDate: formData.departureDate?.toISOString(),
        guests: formData.occupants,
        totalAmount, // UI total
        skipCreditCard: formData.skipCreditCard,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      };
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reqBody),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to make reservation");

      setReservationId(data.reservation.id);

      if (formData.skipCreditCard) {
        toast({
          title: "Reservation Created!",
          description: "Your reservation has been submitted.",
        });
        router.push("/dashboard/customer");
      } else {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setShowPayment(true);
        } else {
          toast({
            title: "Error",
            description:
              "No clientSecret received from backend. Stripe payment cannot proceed.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create reservation.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResidentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateResidential()) return;
    setIsLoading(true);

    try {
      const reqBody = {
        roomType: "residential",
        durationType: residentialForm.durationType,
        durationCount: residentialForm.durationCount,
        arrivalDate: residentialForm.arrivalDate?.toISOString(),
        departureDate: resDepartureDate?.toISOString(),
        guests: residentialForm.occupants,
        totalAmount: residentialTotal,
        skipCreditCard: residentialForm.skipCreditCard,
        fullName: residentialForm.fullName,
        email: residentialForm.email,
        phone: residentialForm.phone,
      };
      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:5000/api/reservations/residential",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(reqBody),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to make reservation");

      setReservationId(data.reservation.id);

      if (residentialForm.skipCreditCard) {
        toast({
          title: "Reservation Created!",
          description: "Your reservation has been submitted.",
        });
        router.push("/dashboard/customer");
      } else {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setShowPayment(true);
        } else {
          toast({
            title: "Error",
            description:
              "No clientSecret received from backend. Stripe payment cannot proceed.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create reservation.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful!",
      description: "Your reservation is confirmed.",
    });
    setShowPayment(false);
    router.push("/dashboard/customer");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Make a Reservation
              </CardTitle>
              <CardDescription className="text-center">
                Fill out the form below to book your stay
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showPayment && clientSecret && (
                <ReservationPaymentForm
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                />
              )}
              {!showPayment && (
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="mb-6 w-full">
                    <TabsTrigger value="hotel" className="w-1/2">
                      Hotel Room
                    </TabsTrigger>
                    <TabsTrigger value="residential" className="w-1/2">
                      Residential Suite
                    </TabsTrigger>
                  </TabsList>
                  {/* Hotel Room Tab */}
                  <TabsContent value="hotel">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Personal Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Personal Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name *</Label>
                            <Input
                              id="fullName"
                              value={formData.fullName}
                              onChange={(e) =>
                                updateFormData("fullName", e.target.value)
                              }
                              className={cn(
                                errors.fullName && "border-red-500"
                              )}
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
                              <p className="text-sm text-red-500">
                                {errors.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) =>
                              updateFormData("phone", e.target.value)
                            }
                            className={cn(errors.phone && "border-red-500")}
                          />
                          {errors.phone && (
                            <p className="text-sm text-red-500">
                              {errors.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Room Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Room Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="roomType">Room Type *</Label>
                            <Select
                              value={formData.roomType}
                              onValueChange={(value) =>
                                updateFormData("roomType", value)
                              }
                            >
                              <SelectTrigger
                                className={cn(
                                  errors.roomType && "border-red-500"
                                )}
                              >
                                <SelectValue placeholder="Select room type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standard">
                                  Standard - $120/night
                                </SelectItem>
                                <SelectItem value="deluxe">
                                  Deluxe - $180/night
                                </SelectItem>
                                <SelectItem value="suite">
                                  Suite - $280/night
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {errors.roomType && (
                              <p className="text-sm text-red-500">
                                {errors.roomType}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="occupants">
                              Number of Occupants
                            </Label>
                            <Select
                              value={formData.occupants.toString()}
                              onValueChange={(value) =>
                                updateFormData(
                                  "occupants",
                                  Number.parseInt(value)
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 Guest</SelectItem>
                                <SelectItem value="2">2 Guests</SelectItem>
                                <SelectItem value="3">3 Guests</SelectItem>
                                <SelectItem value="4">4 Guests</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
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
                                    !formData.arrivalDate &&
                                      "text-muted-foreground",
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
                      </div>
                      {/* Total Amount */}
                      <div className="my-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                        <span className="font-semibold text-lg">
                          Total Amount
                        </span>
                        <span className="font-bold text-2xl text-green-700 dark:text-green-300">
                          ${totalAmount}
                        </span>
                        <span className="text-gray-500 ml-4 text-sm">
                          {nights} night{nights > 1 ? "s" : ""} x $
                          {pricePerNight}
                          /night
                        </span>
                      </div>
                      {/* Payment Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Payment Details
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="skipCreditCard"
                            checked={formData.skipCreditCard}
                            onCheckedChange={(checked) =>
                              updateFormData("skipCreditCard", checked)
                            }
                          />
                          <Label htmlFor="skipCreditCard">
                            Skip credit card (pay at hotel)
                          </Label>
                        </div>
                        {formData.skipCreditCard && (
                          <div className="flex items-center bg-yellow-100 dark:bg-yellow-900 rounded-md px-3 py-2 mt-2 text-yellow-900 dark:text-yellow-100 text-sm">
                            <AlertTriangle className="mr-2" size={18} />
                            <span>
                              Reservations without a credit card will be{" "}
                              <b>automatically cancelled at 7:00 PM</b> on the
                              day of arrival unless checked in. No-show
                              customers will be billed for the reservation.
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-1 text-blue-700 dark:text-blue-200">
                          <Info size={18} />
                          <span className="font-semibold">
                            Important policies:
                          </span>
                        </div>
                        <ul className="list-disc ml-6 text-sm text-blue-900 dark:text-blue-100">
                          <li>
                            Reservations <b>without credit card</b> are
                            auto-cancelled at <b>7 PM daily</b>.
                          </li>
                          <li>
                            No-show customers are billed; a billing record is
                            created for each no-show reservation by{" "}
                            <b>7:00 PM</b> daily.
                          </li>
                          <li>
                            A daily report is produced with total occupancy and
                            revenue for the previous night.
                          </li>
                        </ul>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Reservation...
                          </>
                        ) : (
                          "Create Reservation"
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                  {/* Residential Suite Tab */}
                  <TabsContent value="residential">
                    <form
                      onSubmit={handleResidentialSubmit}
                      className="space-y-6"
                    >
                      {/* Personal Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Personal Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="res_fullName">Full Name *</Label>
                            <Input
                              id="res_fullName"
                              value={residentialForm.fullName}
                              onChange={(e) =>
                                updateResidentialForm(
                                  "fullName",
                                  e.target.value
                                )
                              }
                              className={cn(
                                residentialErrors.fullName && "border-red-500"
                              )}
                            />
                            {residentialErrors.fullName && (
                              <p className="text-sm text-red-500">
                                {residentialErrors.fullName}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="res_email">Email *</Label>
                            <Input
                              id="res_email"
                              type="email"
                              value={residentialForm.email}
                              onChange={(e) =>
                                updateResidentialForm("email", e.target.value)
                              }
                              className={cn(
                                residentialErrors.email && "border-red-500"
                              )}
                            />
                            {residentialErrors.email && (
                              <p className="text-sm text-red-500">
                                {residentialErrors.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="res_phone">Phone Number *</Label>
                          <Input
                            id="res_phone"
                            value={residentialForm.phone}
                            onChange={(e) =>
                              updateResidentialForm("phone", e.target.value)
                            }
                            className={cn(
                              residentialErrors.phone && "border-red-500"
                            )}
                          />
                          {residentialErrors.phone && (
                            <p className="text-sm text-red-500">
                              {residentialErrors.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Residential Suite Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Residential Suite Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Duration Type *</Label>
                            <Select
                              value={residentialForm.durationType}
                              onValueChange={(val) =>
                                updateResidentialForm(
                                  "durationType",
                                  val as "week" | "month"
                                )
                              }
                            >
                              <SelectTrigger
                                className={cn(
                                  residentialErrors.durationType &&
                                    "border-red-500"
                                )}
                              >
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="week">Per Week</SelectItem>
                                <SelectItem value="month">Per Month</SelectItem>
                              </SelectContent>
                            </Select>
                            {residentialErrors.durationType && (
                              <p className="text-sm text-red-500">
                                {residentialErrors.durationType}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>
                              How many{" "}
                              {residentialForm.durationType
                                ? residentialForm.durationType === "week"
                                  ? "Weeks"
                                  : "Months"
                                : "units"}{" "}
                              *
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              value={residentialForm.durationCount}
                              onChange={(e) =>
                                updateResidentialForm(
                                  "durationCount",
                                  Number(e.target.value)
                                )
                              }
                              className={cn(
                                residentialErrors.durationCount &&
                                  "border-red-500"
                              )}
                            />
                            {residentialErrors.durationCount && (
                              <p className="text-sm text-red-500">
                                {residentialErrors.durationCount}
                              </p>
                            )}
                          </div>
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
                                    !residentialForm.arrivalDate &&
                                      "text-muted-foreground",
                                    residentialErrors.arrivalDate &&
                                      "border-red-500"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {residentialForm.arrivalDate
                                    ? format(residentialForm.arrivalDate, "PPP")
                                    : "Pick a date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={residentialForm.arrivalDate}
                                  onSelect={(date) =>
                                    updateResidentialForm("arrivalDate", date)
                                  }
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            {residentialErrors.arrivalDate && (
                              <p className="text-sm text-red-500">
                                {residentialErrors.arrivalDate}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Departure Date</Label>
                            <Input
                              value={
                                resDepartureDate
                                  ? format(resDepartureDate, "PPP")
                                  : ""
                              }
                              readOnly
                              placeholder="Auto-calculated"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="res_occupants">
                            Number of Occupants
                          </Label>
                          <Select
                            value={residentialForm.occupants.toString()}
                            onValueChange={(value) =>
                              updateResidentialForm(
                                "occupants",
                                Number.parseInt(value)
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 Guest</SelectItem>
                              <SelectItem value="2">2 Guests</SelectItem>
                              <SelectItem value="3">3 Guests</SelectItem>
                              <SelectItem value="4">4 Guests</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {/* Total Amount */}
                      <div className="my-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                        <span className="font-semibold text-lg">
                          Total Amount
                        </span>
                        <span className="font-bold text-2xl text-green-700 dark:text-green-300">
                          ${residentialTotal}
                        </span>
                        <span className="text-gray-500 ml-4 text-sm">
                          {residentialForm.durationCount}{" "}
                          {residentialForm.durationType === "week"
                            ? "week(s)"
                            : residentialForm.durationType === "month"
                            ? "month(s)"
                            : ""}{" "}
                          x $
                          {residentialForm.durationType === "week"
                            ? RESIDENTIAL_WEEKLY_RATE
                            : residentialForm.durationType === "month"
                            ? RESIDENTIAL_MONTHLY_RATE
                            : ""}
                        </span>
                      </div>
                      {/* Payment Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Payment Details
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="res_skipCreditCard"
                            checked={residentialForm.skipCreditCard}
                            onCheckedChange={(checked) =>
                              updateResidentialForm("skipCreditCard", checked)
                            }
                          />
                          <Label htmlFor="res_skipCreditCard">
                            Skip credit card (pay at hotel)
                          </Label>
                        </div>
                        {residentialForm.skipCreditCard && (
                          <div className="flex items-center bg-yellow-100 dark:bg-yellow-900 rounded-md px-3 py-2 mt-2 text-yellow-900 dark:text-yellow-100 text-sm">
                            <AlertTriangle className="mr-2" size={18} />
                            <span>
                              Reservations without a credit card will be{" "}
                              <b>automatically cancelled at 7:00 PM</b> on the
                              day of arrival unless checked in. No-show
                              customers will be billed for the reservation.
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-1 text-blue-700 dark:text-blue-200">
                          <Info size={18} />
                          <span className="font-semibold">
                            Important policies:
                          </span>
                        </div>
                        <ul className="list-disc ml-6 text-sm text-blue-900 dark:text-blue-100">
                          <li>
                            Reservations <b>without credit card</b> are
                            auto-cancelled at <b>7 PM daily</b>.
                          </li>
                          <li>
                            No-show customers are billed; a billing record is
                            created for each no-show reservation by{" "}
                            <b>7:00 PM</b> daily.
                          </li>
                          <li>
                            A daily report is produced with total occupancy and
                            revenue for the previous night.
                          </li>
                        </ul>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Reservation...
                          </>
                        ) : (
                          "Create Reservation"
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
