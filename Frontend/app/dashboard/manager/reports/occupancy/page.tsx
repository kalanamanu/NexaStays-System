"use client";
import { useEffect, useState } from "react";
import NavBar from "@/components/nav-bar";
import ManagerSidebar from "@/components/ui/ManagerSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DownloadCloud,
  Calendar as CalendarIcon,
  BarChart2,
} from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Hotel {
  id: string | number;
  name: string;
}
interface OccupancyDay {
  date: string;
  roomsOccupied: number;
  roomsAvailable: number;
  occupancyRate: number;
}
interface RoomTypeBreakdown {
  [type: string]: { total: number; occupied: number; reserved: number };
}

function getDefaultDates() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return {
    from: firstDay.toISOString().slice(0, 10),
    to: lastDay.toISOString().slice(0, 10),
  };
}

function exportCsv(report: OccupancyDay[], hotelName: string) {
  if (!report.length) return;
  const header = [
    "Date",
    "Rooms Occupied",
    "Rooms Available",
    "Occupancy Rate (%)",
  ];
  const rows = report.map((r) => [
    r.date,
    r.roomsOccupied,
    r.roomsAvailable,
    r.occupancyRate.toFixed(1),
  ]);
  const csvContent = [header, ...rows]
    .map((row) =>
      row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
    )
    .join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Occupancy_Report_${hotelName || "Hotel"}.csv`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function ManagerOccupancyReportPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string | number | "">("");
  const [hotelName, setHotelName] = useState<string>("");
  const [report, setReport] = useState<OccupancyDay[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeBreakdown>({});
  const [loading, setLoading] = useState(false);

  const defaultDates = getDefaultDates();
  const [from, setFrom] = useState<string>(defaultDates.from);
  const [to, setTo] = useState<string>(defaultDates.to);

  useEffect(() => {
    async function fetchHotels() {
      const res = await fetch("http://localhost:5000/api/hotels");
      const data = await res.json();
      setHotels(data.data || []);
    }
    fetchHotels();
  }, []);

  useEffect(() => {
    async function fetchReport() {
      if (!selectedHotel) {
        setReport([]);
        setRoomTypes({});
        setHotelName("");
        return;
      }
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const url = `http://localhost:5000/api/manager/reports/occupancy?hotelId=${selectedHotel}&from=${from}&to=${to}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        setReport(data.daily || []);
        setRoomTypes(data.roomTypes || {});
        const h = hotels.find((h) => String(h.id) === String(selectedHotel));
        setHotelName(h ? h.name : "");
      } catch (e) {
        setReport([]);
        setRoomTypes({});
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHotel, hotels, from, to]);

  // High-level summary
  const totalDays = report.length;
  const avgOccupancy =
    report.length > 0
      ? report.reduce((sum, row) => sum + row.occupancyRate, 0) / report.length
      : 0;
  const maxOccupancy = Math.max(...report.map((row) => row.occupancyRate), 0);
  const minOccupancy = Math.min(...report.map((row) => row.occupancyRate), 100);

  // Chart Data
  const chartData = {
    labels: report.map((r) => r.date),
    datasets: [
      {
        label: "Occupancy Rate (%)",
        data: report.map((r) => r.occupancyRate),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        pointRadius: 2,
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: { min: 0, max: 100 },
    },
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      <ManagerSidebar />
      <main className="ml-60 pt-16 min-h-screen overflow-y-auto">
        <div className="max-w-5xl mx-auto py-8 px-4">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="h-6 w-6 text-blue-700" />
                    Occupancy Report
                  </CardTitle>
                  <div className="text-gray-500 text-sm mt-1">
                    View occupancy projections, charts, and export daily stats.
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
                  <Select
                    value={String(selectedHotel)}
                    onValueChange={setSelectedHotel}
                  >
                    <SelectTrigger className="min-w-[220px] border-blue-400">
                      <SelectValue placeholder="Select Hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotels.map((h) => (
                        <SelectItem key={h.id} value={String(h.id)}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 items-center">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className="flex items-center gap-1 text-xs">
                        <CalendarIcon className="w-3 h-3" />
                        From
                        <input
                          type="date"
                          className="rounded border px-1 py-0.5 text-xs"
                          value={from}
                          max={to}
                          onChange={(e) => setFrom(e.target.value)}
                        />
                      </label>
                      <label className="flex items-center gap-1 text-xs">
                        <CalendarIcon className="w-3 h-3" />
                        To
                        <input
                          type="date"
                          className="rounded border px-1 py-0.5 text-xs"
                          value={to}
                          min={from}
                          onChange={(e) => setTo(e.target.value)}
                        />
                      </label>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-500 shadow ml-2"
                      disabled={!report.length}
                      onClick={() => exportCsv(report, hotelName)}
                    >
                      <DownloadCloud className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent>
              {!selectedHotel && (
                <div className="text-gray-500 text-center py-12">
                  Select a hotel to view report.
                </div>
              )}
              {loading && (
                <div className="text-center py-8 animate-pulse">
                  Loading report...
                </div>
              )}
              {selectedHotel && !loading && (
                <div>
                  {/* Summary Section */}
                  <div className="flex flex-col md:flex-row gap-6 md:gap-12 mb-6 text-center md:text-left">
                    <div>
                      <div className="text-xs uppercase text-gray-500">
                        Total Days
                      </div>
                      <div className="text-2xl font-bold">{totalDays}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase text-gray-500">
                        Avg. Occupancy
                      </div>
                      <div className="text-2xl font-bold text-blue-700">
                        {avgOccupancy.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase text-gray-500">
                        Max/Min Occupancy
                      </div>
                      <div className="text-2xl font-bold">
                        <span className="text-green-600">
                          {maxOccupancy.toFixed(1)}%
                        </span>
                        <span className="mx-1">/</span>
                        <span className="text-red-500">
                          {minOccupancy.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Chart Section */}
                  <div className="mb-8">
                    <Line data={chartData} options={chartOptions} height={90} />
                  </div>
                  {/* Room Type Breakdown */}
                  {roomTypes && Object.keys(roomTypes).length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Room Category Breakdown
                      </h3>
                      <table className="min-w-full text-sm border">
                        <thead className="bg-blue-50">
                          <tr>
                            <th className="py-1 px-2 border">Type</th>
                            <th className="py-1 px-2 border">Total</th>
                            <th className="py-1 px-2 border">Occupied</th>
                            <th className="py-1 px-2 border">Reserved</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(roomTypes).map(([type, stats]) => (
                            <tr key={type}>
                              <td className="py-1 px-2 border">{type}</td>
                              <td className="py-1 px-2 border">
                                {stats.total}
                              </td>
                              <td className="py-1 px-2 border">
                                {stats.occupied}
                              </td>
                              <td className="py-1 px-2 border">
                                {stats.reserved}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {/* Table Section */}
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full border">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="px-2 py-1 border">Date</th>
                          <th className="px-2 py-1 border">Rooms Occupied</th>
                          <th className="px-2 py-1 border">Rooms Available</th>
                          <th className="px-2 py-1 border">
                            Occupancy Rate (%)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="text-center text-gray-400 py-8"
                            >
                              No daily occupancy data available.
                            </td>
                          </tr>
                        ) : (
                          report.map((row) => (
                            <tr
                              key={row.date}
                              className={
                                row.occupancyRate >= 90
                                  ? "bg-green-50"
                                  : row.occupancyRate <= 30
                                  ? "bg-red-50"
                                  : ""
                              }
                            >
                              <td className="px-2 py-1 border">{row.date}</td>
                              <td className="px-2 py-1 border">
                                {row.roomsOccupied}
                              </td>
                              <td className="px-2 py-1 border">
                                {row.roomsAvailable}
                              </td>
                              <td className="px-2 py-1 border font-semibold">
                                <span
                                  className={
                                    row.occupancyRate >= 90
                                      ? "text-green-700"
                                      : row.occupancyRate <= 30
                                      ? "text-red-600"
                                      : "text-blue-900"
                                  }
                                >
                                  {row.occupancyRate.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Report explanations */}
                  <div className="mt-6 text-xs text-gray-500 leading-relaxed">
                    <strong>Occupancy Rate</strong> = (Rooms Occupied ÷ Rooms
                    Available) × 100.
                    <br />
                    <span className="text-green-600 font-semibold">
                      Green rows
                    </span>{" "}
                    indicate high occupancy days (&ge; 90%),{" "}
                    <span className="text-red-600 font-semibold">red rows</span>{" "}
                    indicate low occupancy (&le; 30%).
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
