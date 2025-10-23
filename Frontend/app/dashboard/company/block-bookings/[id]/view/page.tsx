"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import NavBar from "@/components/nav-bar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Loader2, Building2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// New: room type details
interface BlockBookingRoomType {
  id: number | string;
  roomType: string;
  rooms: number;
  // Optionally: price?: number
}

interface BlockBooking {
  id: number | string;
  arrivalDate: string;
  departureDate: string;
  discountRate: number;
  status: "pending" | "confirmed" | "cancelled";
  totalAmount: number;
  hotel?: { name: string };
  roomTypes: BlockBookingRoomType[];
}

export default function ViewBlockBookingPage() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [blockBooking, setBlockBooking] = useState<BlockBooking | null>(null);

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
      } catch (e) {
        setBlockBooking(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <div>
        <NavBar />
        <div className="max-w-2xl mx-auto py-12 px-4 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-600" />
          <div className="mt-2">Loading view...</div>
        </div>
      </div>
    );
  }

  if (!blockBooking) {
    return (
      <div>
        <NavBar />
        <div className="max-w-2xl mx-auto py-12 px-4 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-lg font-bold mb-2">Block Booking Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            We couldn't find this block booking.
          </p>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => router.push("/dashboard/company/block-bookings")}
          >
            Back to My Block Bookings
          </Button>
        </div>
      </div>
    );
  }

  // Compute total rooms
  const totalRooms =
    blockBooking.roomTypes?.reduce((sum, rt) => sum + rt.rooms, 0) || 0;

  return (
    <div>
      <NavBar />
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Block Booking Details
            </CardTitle>
            <CardDescription>
              <Badge className={getStatusColor(blockBooking.status)}>
                {blockBooking.status.charAt(0).toUpperCase() +
                  blockBooking.status.slice(1)}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Booking ID:</span>
                <span>{`BLK${String(blockBooking.id).padStart(3, "0")}`}</span>
              </div>
              {blockBooking.hotel?.name && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Hotel:</span>
                  <span>{blockBooking.hotel.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-semibold">Total Rooms:</span>
                <span>{totalRooms}</span>
              </div>
              {/* Room breakdown */}
              {blockBooking.roomTypes && blockBooking.roomTypes.length > 0 && (
                <div>
                  <span className="font-semibold">Room Details:</span>
                  <ul className="list-disc ml-6 mt-1">
                    {blockBooking.roomTypes.map((rt) => (
                      <li key={rt.roomType}>
                        {rt.rooms} x {rt.roomType}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-semibold">Discount:</span>
                <span>{blockBooking.discountRate}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Check-in:</span>
                <CalendarIcon className="h-4 w-4 text-purple-600 mr-1" />
                <span>{format(new Date(blockBooking.arrivalDate), "PPP")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Check-out:</span>
                <CalendarIcon className="h-4 w-4 text-purple-600 mr-1" />
                <span>
                  {format(new Date(blockBooking.departureDate), "PPP")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-green-700 dark:text-green-300">
                  LKR {blockBooking.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-8 flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/company/block-bookings")}
              >
                Back
              </Button>
              <Button
                onClick={() =>
                  router.push(
                    `/dashboard/company/block-bookings/${blockBooking.id}/edit`
                  )
                }
              >
                Edit Booking
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
