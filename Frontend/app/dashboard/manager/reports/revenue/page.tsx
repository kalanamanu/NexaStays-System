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
  DollarSign,
  Building,
  TrendingUp,
  Target,
  Award,
  TrendingDown,
  Filter,
  Eye,
  CreditCard,
  Users,
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
interface RevenueDay {
  date: string;
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

export default function ManagerRevenueReportPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string | number | "">("");
  const [hotelName, setHotelName] = useState<string>("");
  const [report, setReport] = useState<RevenueDay[]>([]);
  const [loading, setLoading] = useState(false);

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [avgDailyRevenue, setAvgDailyRevenue] = useState(0);
  const [maxRevenue, setMaxRevenue] = useState(0);
  const [minRevenue, setMinRevenue] = useState(0);
  const [revenueDays, setRevenueDays] = useState(0);
  const [zeroRevenueDays, setZeroRevenueDays] = useState(0);

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
        setTotalRevenue(0);
        setAvgDailyRevenue(0);
        setMaxRevenue(0);
        setMinRevenue(0);
        setRevenueDays(0);
        setZeroRevenueDays(0);
        return;
      }
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const url = `http://localhost:5000/api/manager/reports/revenue?hotelId=${selectedHotel}&from=${from}&to=${to}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        const dailyReport = data.daily || [];
        setReport(dailyReport);
        setTotalRevenue(data.totalRevenue || 0);
        setAvgDailyRevenue(data.avgDailyRevenue || 0);
        setMaxRevenue(data.maxRevenue || 0);
        setMinRevenue(data.minRevenue || 0);

        // Calculate additional metrics
        const daysWithRevenue: number = dailyReport.filter(
          (day: RevenueDay) => day.revenue > 0
        ).length;
        const daysWithoutRevenue: number = dailyReport.filter(
          (day: RevenueDay) => day.revenue === 0
        ).length;
        setRevenueDays(daysWithRevenue);
        setZeroRevenueDays(daysWithoutRevenue);

        const h = hotels.find((h) => String(h.id) === String(selectedHotel));
        setHotelName(h ? h.name : "");
      } catch (e) {
        setReport([]);
        setTotalRevenue(0);
        setAvgDailyRevenue(0);
        setMaxRevenue(0);
        setMinRevenue(0);
        setRevenueDays(0);
        setZeroRevenueDays(0);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHotel, hotels, from, to]);

  // Performance metrics
  const performanceRate =
    report.length > 0 ? (revenueDays / report.length) * 100 : 0;
  const peakRevenueDay = report.find((day) => day.revenue === maxRevenue);
  const avgAboveDays = report.filter(
    (day) => day.revenue > avgDailyRevenue
  ).length;

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
        label: "Daily Revenue (LKR)",
        data: report.map((r) => r.revenue),
        borderColor: "#059669",
        backgroundColor: "rgba(5, 150, 105, 0.1)",
        pointBackgroundColor: "#059669",
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
        text: "Daily Revenue Trend",
        font: {
          size: 16,
          weight: "bold", // Use allowed values: "bold", "normal", "lighter", "bolder"
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
            return `Revenue: LKR ${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          callback: function (value: any) {
            return "LKR " + value.toLocaleString();
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

  const getRevenueLevel = (revenue: number) => {
    const avg = avgDailyRevenue;
    if (revenue === 0)
      return {
        color: "text-gray-700",
        bg: "bg-gray-50",
        badge: "bg-gray-100 text-gray-800",
      };
    if (revenue >= avg * 2)
      return {
        color: "text-green-700",
        bg: "bg-green-50",
        badge: "bg-green-100 text-green-800",
      };
    if (revenue >= avg * 1.5)
      return {
        color: "text-blue-700",
        bg: "bg-blue-50",
        badge: "bg-blue-100 text-blue-800",
      };
    if (revenue >= avg)
      return {
        color: "text-yellow-700",
        bg: "bg-yellow-50",
        badge: "bg-yellow-100 text-yellow-800",
      };
    return {
      color: "text-orange-700",
      bg: "bg-orange-50",
      badge: "bg-orange-100 text-orange-800",
    };
  };

  const handleExportData = () => {
    const exportData = report.map((day) => ({
      Date: day.date,
      Revenue: day.revenue,
      Performance:
        day.revenue === 0
          ? "No Revenue"
          : day.revenue >= avgDailyRevenue * 2
          ? "Excellent"
          : day.revenue >= avgDailyRevenue * 1.5
          ? "Very Good"
          : day.revenue >= avgDailyRevenue
          ? "Good"
          : "Below Average",
    }));
    exportToCsv(exportData, `Revenue_Report_${hotelName}`);
  };

  const getRevenueBadge = (revenue: number) => {
    const avg = avgDailyRevenue;
    if (revenue === 0)
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-700">
          No Revenue
        </Badge>
      );
    if (revenue >= avg * 2)
      return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (revenue >= avg * 1.5)
      return <Badge className="bg-blue-100 text-blue-800">Very Good</Badge>;
    if (revenue >= avg)
      return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-orange-100 text-orange-800">Below Avg</Badge>;
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
                  Revenue Analytics
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Comprehensive revenue analysis and financial performance
                  metrics
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
                    className="border-green-500 text-green-600 hover:bg-green-50"
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
                  revenue analytics and financial reports.
                </p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="shadow-lg border-0">
              <CardContent className="py-16 text-center">
                <div className="animate-pulse">
                  <BarChart3 className="h-16 w-16 text-green-300 mx-auto mb-4" />
                  <p className="text-gray-600">Loading revenue analytics...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedHotel && !loading && report.length > 0 && (
            <>
              {/* Key Performance Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-green-500 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Revenue
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          LKR {totalRevenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {revenueDays} revenue day
                          {revenueDays !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-blue-500 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Avg Daily Revenue
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          LKR{" "}
                          {avgDailyRevenue.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Per day average
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-purple-500 shadow-lg">
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
                          Days with revenue
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Target className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-l-4 border-l-amber-500 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Above Average Days
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {avgAboveDays}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Exceeded daily average
                        </p>
                      </div>
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <Award className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Range Performance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <div className="text-sm font-medium text-green-800">
                          Peak Revenue Day
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-900">
                        LKR {maxRevenue.toLocaleString()}
                      </div>
                      {peakRevenueDay && (
                        <div className="text-xs text-green-600 mt-1">
                          {formatDate(peakRevenueDay.date)}
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
                        LKR{" "}
                        {avgDailyRevenue.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Daily benchmark
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                        <div className="text-sm font-medium text-red-800">
                          No Revenue Days
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-red-900">
                        {zeroRevenueDays}
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
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    Revenue Trend Analysis
                  </CardTitle>
                  <CardDescription>
                    Daily revenue performance from {formatDate(from)} to{" "}
                    {formatDate(to)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-80">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              {/* Daily Revenue Breakdown */}
              <Card className="shadow-lg border-0">
                <CardHeader className="border-b border-gray-200 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Eye className="h-5 w-5 text-green-600" />
                        Daily Revenue Breakdown
                      </CardTitle>
                      <CardDescription>
                        {hotelName} • {formatDate(from)} to {formatDate(to)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4 mt-2 sm:mt-0">
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">{revenueDays}</span> of{" "}
                        <span className="font-semibold">{report.length}</span>{" "}
                        days with revenue
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        {report.length} Days
                      </Badge>
                    </div>
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
                            Revenue (LKR)
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Performance
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            vs Average
                          </th>
                        </tr>
                      </thead>
                      {[...report]
                        .sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime()
                        )
                        .map((day) => {
                          const level = getRevenueLevel(day.revenue);
                          const vsAverage = day.revenue - avgDailyRevenue;
                          const vsAveragePercent =
                            avgDailyRevenue > 0
                              ? (vsAverage / avgDailyRevenue) * 100
                              : 0;

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
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                <span className={`font-bold ${level.color}`}>
                                  LKR {day.revenue.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                {getRevenueBadge(day.revenue)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                {day.revenue > 0 ? (
                                  <span
                                    className={`text-xs font-medium ${
                                      vsAverage > 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {vsAverage > 0 ? "+" : ""}
                                    {vsAveragePercent.toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-500">
                                    -
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Insights */}
              <Card className="shadow-lg border-0 mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    Revenue Performance Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">
                        Performance Indicators
                      </h4>
                      <ul className="space-y-2 text-gray-600">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>
                            <strong>Excellent (&ge;200% avg)</strong>:
                            Outstanding revenue days
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>
                            <strong>Very Good (150-199% avg)</strong>: Strong
                            revenue performance
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span>
                            <strong>Good (100-149% avg)</strong>: Meeting
                            revenue targets
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span>
                            <strong>Below Average (&lt;100% avg)</strong>: Needs
                            improvement
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                          <span>
                            <strong>No Revenue (0)</strong>: Critical attention
                            needed
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">
                        Business Recommendations
                      </h4>
                      <ul className="space-y-2 text-gray-600">
                        <li>
                          • Focus on converting zero-revenue days through
                          targeted promotions
                        </li>
                        <li>
                          • Analyze peak performance days for replication
                          strategies
                        </li>
                        <li>
                          • Implement dynamic pricing during high-demand periods
                        </li>
                        <li>
                          • Target consistent performance above daily average
                        </li>
                        <li>
                          • Monitor seasonal trends for better revenue
                          forecasting
                        </li>
                      </ul>
                    </div>
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
                  No Revenue Data Available
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  No revenue data found for the selected hotel and date range.
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
