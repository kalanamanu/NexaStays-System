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
  BedDouble,
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
interface SuiteDay {
  date: string;
  suitesOccupied: number;
  suitesAvailable: number;
  occupancyRate: number;
  revenue: number;
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

function exportCsv(report: SuiteDay[], hotelName: string) {
  if (!report.length) return;
  const header = [
    "Date",
    "Suites Occupied",
    "Suites Available",
    "Occupancy Rate (%)",
    "Revenue (LKR)",
  ];
  const rows = report.map((r) => [
    r.date,
    r.suitesOccupied,
    r.suitesAvailable,
    r.occupancyRate.toFixed(1),
    r.revenue,
  ]);
  const csvContent = [header, ...rows]
    .map((row) =>
      row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
    )
    .join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Suite_Occupancy_Revenue_${hotelName || "Hotel"}.csv`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function ManagerSuiteReportPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string | number | "">("");
  const [hotelName, setHotelName] = useState<string>("");
  const [report, setReport] = useState<SuiteDay[]>([]);
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
        setHotelName("");
        return;
      }
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const url = `http://localhost:5000/api/manager/reports/suites?hotelId=${selectedHotel}&from=${from}&to=${to}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        setReport(data.daily || []);
        const h = hotels.find((h) => String(h.id) === String(selectedHotel));
        setHotelName(h ? h.name : "");
      } catch (e) {
        setReport([]);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHotel, hotels, from, to]);

  // Summary
  const totalRevenue = report.reduce((sum, r) => sum + r.revenue, 0);
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
        label: "Suite Occupancy Rate (%)",
        data: report.map((r) => r.occupancyRate),
        borderColor: "#a21caf",
        backgroundColor: "rgba(162, 28, 175, 0.13)",
        pointRadius: 2,
        tension: 0.3,
        yAxisID: "y",
      },
      {
        label: "Suite Revenue (LKR)",
        data: report.map((r) => r.revenue),
        borderColor: "#059669",
        backgroundColor: "rgba(5, 150, 105, 0.07)",
        pointRadius: 2,
        tension: 0.3,
        yAxisID: "y1",
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: { display: true },
      title: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: "Occupancy Rate (%)" },
      },
      y1: {
        type: "linear" as const,
        position: "right" as const,
        title: { display: true, text: "Revenue (LKR)" },
        min: 0,
      },
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
                    <BedDouble className="h-6 w-6 text-purple-700" />
                    Suite Occupancy & Revenue
                  </CardTitle>
                  <div className="text-gray-500 text-sm mt-1">
                    View suite bookings, occupancy, revenue, charts, and export
                    daily stats.
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
                  <Select
                    value={String(selectedHotel)}
                    onValueChange={setSelectedHotel}
                  >
                    <SelectTrigger className="min-w-[220px] border-purple-400">
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
                      className="border-purple-500 shadow ml-2"
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
                  Select a hotel to view suite report.
                </div>
              )}
              {loading && (
                <div className="text-center py-8 animate-pulse">
                  Loading suite report...
                </div>
              )}
              {selectedHotel && !loading && (
                <div>
                  {/* Summary Section */}
                  <div className="flex flex-col md:flex-row gap-6 md:gap-12 mb-6 text-center md:text-left">
                    <div>
                      <div className="text-xs uppercase text-gray-500">
                        Total Suite Revenue
                      </div>
                      <div className="text-2xl font-bold text-purple-700">
                        LKR {totalRevenue.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase text-gray-500">
                        Avg. Suite Occupancy
                      </div>
                      <div className="text-2xl font-bold text-purple-700">
                        {avgOccupancy.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase text-gray-500">
                        Max/Min Suite Occupancy
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
                  {/* Table Section */}
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full border">
                      <thead className="bg-purple-50">
                        <tr>
                          <th className="px-2 py-1 border">Date</th>
                          <th className="px-2 py-1 border">Suites Occupied</th>
                          <th className="px-2 py-1 border">Suites Available</th>
                          <th className="px-2 py-1 border">
                            Occupancy Rate (%)
                          </th>
                          <th className="px-2 py-1 border">Revenue (LKR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center text-gray-400 py-8"
                            >
                              No suite data available.
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
                                {row.suitesOccupied}
                              </td>
                              <td className="px-2 py-1 border">
                                {row.suitesAvailable}
                              </td>
                              <td className="px-2 py-1 border font-semibold">
                                {row.occupancyRate.toFixed(1)}%
                              </td>
                              <td className="px-2 py-1 border">
                                <span className="font-semibold">
                                  LKR {row.revenue.toLocaleString()}
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
                    <strong>Suite Occupancy Rate</strong> = (Suites Occupied ÷
                    Suites Available) × 100.
                    <br />
                    <strong>Suite Revenue</strong> is calculated for suite-type
                    reservations with status <b>paid</b> or <b>checked-out</b>.
                    <br />
                    <span className="text-green-600 font-semibold">
                      Green rows
                    </span>{" "}
                    indicate high suite occupancy days (&ge; 90%),{" "}
                    <span className="text-red-600 font-semibold">red rows</span>{" "}
                    indicate low suite occupancy (&le; 30%).
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
