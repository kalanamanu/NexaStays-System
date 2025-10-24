"use client";
import { useEffect, useState } from "react";
import NavBar from "@/components/nav-bar";
import ManagerSidebar from "@/components/ui/ManagerSidebar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DownloadCloud,
  Calendar as CalendarIcon,
  BarChart3,
  Building,
  TrendingUp,
  Target,
  Users,
  Bed,
  PieChart,
  Filter,
  Eye,
  AlertTriangle,
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
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function exportToCsv(data: any[], filename: string) {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => `"${String(row[header] || "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
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

  // Additional metrics
  const totalRoomsAvailable = report.reduce(
    (sum, row) => sum + row.roomsAvailable,
    0
  );
  const totalRoomsOccupied = report.reduce(
    (sum, row) => sum + row.roomsOccupied,
    0
  );
  const peakOccupancyDay = report.find(
    (row) => row.occupancyRate === maxOccupancy
  );
  const lowOccupancyDay = report.find(
    (row) => row.occupancyRate === minOccupancy
  );

  // Performance metrics
  const highOccupancyDays = report.filter(
    (row) => row.occupancyRate >= 90
  ).length;
  const lowOccupancyDays = report.filter(
    (row) => row.occupancyRate <= 30
  ).length;
  const performanceRate =
    totalDays > 0 ? (highOccupancyDays / totalDays) * 100 : 0;

  // Chart Data
  const chartData = {
    labels: report.map((r) => {
      const date = new Date(r.date);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }),
    datasets: [
      {
        label: "Occupancy Rate (%)",
        data: report.map((r) => r.occupancyRate),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        pointBackgroundColor: "#2563eb",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Daily Occupancy Trend",
        font: {
          size: 16,
          weight: "bold" as "bold",
        },
        padding: 20,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: { size: 14 },
        bodyFont: { size: 14 },
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function (context: any) {
            return `Occupancy: ${context.parsed.y.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          callback: function (value: any) {
            return value + "%";
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const getOccupancyLevel = (rate: number) => {
    if (rate >= 90)
      return {
        color: "text-green-700",
        bg: "bg-green-50",
        badge: "bg-green-100 text-green-800",
      };
    if (rate >= 70)
      return {
        color: "text-blue-700",
        bg: "bg-blue-50",
        badge: "bg-blue-100 text-blue-800",
      };
    if (rate >= 50)
      return {
        color: "text-yellow-700",
        bg: "bg-yellow-50",
        badge: "bg-yellow-100 text-yellow-800",
      };
    if (rate >= 30)
      return {
        color: "text-orange-700",
        bg: "bg-orange-50",
        badge: "bg-orange-100 text-orange-800",
      };
    return {
      color: "text-red-700",
      bg: "bg-red-50",
      badge: "bg-red-100 text-red-800",
    };
  };

  const handleExportData = () => {
    const exportData = report.map((day) => ({
      Date: day.date,
      RoomsOccupied: day.roomsOccupied,
      RoomsAvailable: day.roomsAvailable,
      OccupancyRate: `${day.occupancyRate.toFixed(1)}%`,
      Performance:
        day.occupancyRate >= 90
          ? "High"
          : day.occupancyRate >= 70
          ? "Good"
          : day.occupancyRate >= 50
          ? "Moderate"
          : day.occupancyRate >= 30
          ? "Low"
          : "Very Low",
    }));
    exportToCsv(exportData, `Occupancy_Report_${hotelName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <NavBar />
      <ManagerSidebar />

      <main className="ml-60 pt-16 min-h-screen">
        <div className="py-8 px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Occupancy Analytics
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Comprehensive occupancy analysis and performance metrics
                </p>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <Card className="shadow-lg border-0 mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Select Hotel
                    </Label>
                    <Select
                      value={String(selectedHotel)}
                      onValueChange={setSelectedHotel}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a hotel..." />
                      </SelectTrigger>
                      <SelectContent>
                        {hotels.map((h) => (
                          <SelectItem key={h.id} value={String(h.id)}>
                            {h.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Date Range
                    </Label>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          type="date"
                          value={from}
                          max={to}
                          onChange={(e) => setFrom(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="date"
                          value={to}
                          min={from}
                          onChange={(e) => setTo(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    disabled={!report.length}
                    onClick={handleExportData}
                  >
                    <DownloadCloud className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {!selectedHotel && (
            <Card className="shadow-lg border-0">
              <CardContent className="py-16 text-center">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a Hotel
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Choose a hotel from the dropdown above to view detailed
                  occupancy analytics and performance reports.
                </p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="shadow-lg border-0">
              <CardContent className="py-16 text-center">
                <div className="animate-pulse">
                  <BarChart3 className="h-16 w-16 text-blue-300 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Loading occupancy analytics...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedHotel && !loading && report.length > 0 && (
            <>
              {/* Key Performance Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-blue-500 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Average Occupancy
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {avgOccupancy.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Period average
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Target className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-green-500 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Peak Performance
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {maxOccupancy.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Highest occupancy
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-purple-500 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Room Utilization
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {totalRoomsOccupied}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Total rooms occupied
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Bed className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-amber-500 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Performance Rate
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {performanceRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          High occupancy days
                        </p>
                      </div>
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <Users className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Range Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <div className="text-sm font-medium text-green-800">
                          Peak Occupancy Day
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-900">
                        {maxOccupancy.toFixed(1)}%
                      </div>
                      {peakOccupancyDay && (
                        <div className="text-xs text-green-600 mt-1">
                          {formatDate(peakOccupancyDay.date)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        <div className="text-sm font-medium text-blue-800">
                          Average Performance
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">
                        {avgOccupancy.toFixed(1)}%
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {totalDays} day period
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div className="text-sm font-medium text-red-800">
                          Low Occupancy Days
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-red-900">
                        {lowOccupancyDays}
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        Needs attention
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart Section */}
              <Card className="shadow-lg border-0 mb-8">
                <CardHeader className="border-b border-gray-200 pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Occupancy Trend Analysis
                  </CardTitle>
                  <CardDescription>
                    Daily occupancy rates from {formatDate(from)} to{" "}
                    {formatDate(to)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-80">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              {/* Room Type Breakdown */}
              {roomTypes && Object.keys(roomTypes).length > 0 && (
                <Card className="shadow-lg border-0 mb-8">
                  <CardHeader className="border-b border-gray-200 pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <PieChart className="h-5 w-5 text-purple-600" />
                      Room Category Analysis
                    </CardTitle>
                    <CardDescription>
                      Current room utilization by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Room Type
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Occupied
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reserved
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Available
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Utilization
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {Object.entries(roomTypes).map(([type, stats]) => {
                            const available =
                              stats.total - stats.occupied - stats.reserved;
                            const utilization =
                              (stats.occupied / stats.total) * 100;
                            const level = getOccupancyLevel(utilization);

                            return (
                              <tr
                                key={type}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {type}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                  {stats.total}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-semibold">
                                  {stats.occupied}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 text-right font-semibold">
                                  {stats.reserved}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                                  {available}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                  <Badge className={level.badge}>
                                    {utilization.toFixed(1)}%
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Daily Breakdown Table */}
              <Card className="shadow-lg border-0">
                <CardHeader className="border-b border-gray-200 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Eye className="h-5 w-5 text-blue-600" />
                        Daily Occupancy Breakdown
                      </CardTitle>
                      <CardDescription>
                        Detailed daily occupancy metrics and performance
                        indicators
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {report.length} Days
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Occupied
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Available
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Occupancy Rate
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Performance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {[...report]
                          .sort(
                            (a, b) =>
                              new Date(b.date).getTime() -
                              new Date(a.date).getTime()
                          )
                          .map((day) => {
                            const level = getOccupancyLevel(day.occupancyRate);
                            return (
                              <tr
                                key={day.date}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  <div className="flex flex-col">
                                    <span>{formatDate(day.date)}</span>
                                    <span className="text-xs text-gray-500">
                                      {day.date}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                                  {day.roomsOccupied}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                                  {day.roomsAvailable}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                  <span className={`font-bold ${level.color}`}>
                                    {day.occupancyRate.toFixed(1)}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                  <Badge className={level.badge}>
                                    {day.occupancyRate >= 90
                                      ? "High"
                                      : day.occupancyRate >= 70
                                      ? "Good"
                                      : day.occupancyRate >= 50
                                      ? "Moderate"
                                      : day.occupancyRate >= 30
                                      ? "Low"
                                      : "Very Low"}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {selectedHotel && !loading && report.length === 0 && (
            <Card className="shadow-lg border-0">
              <CardContent className="py-16 text-center">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Occupancy Data Available
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  No occupancy data found for the selected hotel and date range.
                  Try adjusting your filters or select a different period.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
