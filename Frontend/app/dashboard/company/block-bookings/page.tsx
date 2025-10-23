"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/nav-bar";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Edit2, Eye, Trash2, Loader2, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface BlockBooking {
  id: number | string;
  rooms: number;
  roomType: string;
  arrivalDate: string;
  departureDate: string;
  discountRate: number;
  status: "pending" | "confirmed" | "cancelled";
  totalAmount: number;
}

export default function CompanyBlockBookingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [blockBookings, setBlockBookings] = useState<BlockBooking[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Fetch block bookings from backend
    const fetchBookings = async () => {
      setFetchLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          "http://localhost:5000/api/block-bookings",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("Fetch failed");
        const data = await response.json();
        setBlockBookings(data.blockBookings || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch block bookings.",
          variant: "destructive",
        });
      } finally {
        setFetchLoading(false);
      }
    };
    fetchBookings();
  }, [toast]);

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

  // Delete
  const handleDelete = async (id: number | string) => {
    setDeleteId(id);
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/block-bookings/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error();
      setBlockBookings((prev) => prev.filter((b) => b.id !== id));
      toast({
        title: "Deleted",
        description: "Block booking deleted.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete block booking.",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
      setDeleting(false);
    }
  };

  return (
    <div>
      <NavBar />
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-8 w-8 text-purple-600" />
          <h1 className="text-2xl font-bold">My Block Bookings</h1>
        </div>

        {fetchLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin h-6 w-6 text-purple-600" />
          </div>
        ) : blockBookings.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No block bookings yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create your first block booking to get started.
            </p>
            <Button
              className="mt-4 bg-purple-600 hover:bg-purple-700"
              onClick={() =>
                router.push("/dashboard/company/block-bookings/create")
              }
            >
              Create Block Booking
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {blockBookings.map((booking) => (
              <div
                key={booking.id}
                className={cn(
                  "p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 relative"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{`BLK${String(
                      booking.id
                    ).padStart(3, "0")}`}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {booking.rooms} {booking.roomType} rooms
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {/* View */}
                    <Button
                      size="icon"
                      variant="ghost"
                      title="View"
                      onClick={() =>
                        router.push(
                          `/dashboard/company/block-bookings/${booking.id}/view`
                        )
                      }
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                    </Button>
                    {/* Edit */}
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Edit"
                      onClick={() =>
                        router.push(
                          `/dashboard/company/block-bookings/${booking.id}/edit`
                        )
                      }
                    >
                      <Edit2 className="w-4 h-4 text-purple-600" />
                    </Button>
                    {/* Delete */}
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Delete"
                      disabled={deleting && deleteId === booking.id}
                      onClick={() => handleDelete(booking.id)}
                    >
                      {deleting && deleteId === booking.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-600" />
                      )}
                    </Button>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status.charAt(0).toUpperCase() +
                        booking.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Check-in:</span>
                    <div>
                      {new Date(booking.arrivalDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Check-out:</span>
                    <div>
                      {new Date(booking.departureDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Discount:</span>
                    <div>{booking.discountRate}%</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Total:</span>
                    <div className="font-semibold">
                      ${booking.totalAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
