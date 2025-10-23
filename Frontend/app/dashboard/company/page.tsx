"use client";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/nav-bar";
import { useRouter } from "next/navigation";

export default function TravelCompanyDashboard() {
  const router = useRouter();
  return (
    <div>
      <NavBar />
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-4">Travel Company Dashboard</h1>
        <div className="space-x-4">
          <Button
            onClick={() =>
              router.push("/dashboard/company/block-bookings/create")
            }
          >
            Create Block Booking
          </Button>
          <Button
            onClick={() => router.push("/dashboard/company/block-bookings")}
          >
            View My Block Bookings
          </Button>
        </div>
      </div>
    </div>
  );
}
