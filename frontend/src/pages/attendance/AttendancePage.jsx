import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { usePermission } from "@/hooks/usePermission";
import {
  getMyAttendance,
  updateAttendance,
  getAttendanceByBatch,
  getAttendanceByDate,
} from "@/features/attendance/attendanceApi";
import { getAllBatches, getAllInternsByBatch } from "@/features/batches/batchApi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Users,
  RefreshCw,
  Award,
  Calendar,
} from "lucide-react";

// Helpers
const formatDuration = (secs) => {
  if (!secs || isNaN(secs)) return "0m";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AttendancePage = () => {
  const user = useSelector((state) => state.auth.user);
  const { hasPermission } = usePermission();
  const isIntern = user?.role?.name === "Intern";
  const isMentor = user?.role?.name === "Mentor";
  const canUpdate = hasPermission("attendance:update");

  // --- Intern State ---
  const [internLogs, setInternLogs] = useState([]);
  const [internStats, setInternStats] = useState({
    totalDays: 0,
    presentDays: 0,
    percentage: 0,
  });

  // --- Mentor/Admin State ---
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("all_colleges_view");
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [attendanceData, setAttendanceData] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  useEffect(() => {
    setInputValue("");
    setSearchQuery("");
    setActionError("");
  }, [selectedBatch, selectedDate]);

  // Common Loading & Error States
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  // 1. Fetch Intern History
  const fetchInternHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyAttendance();
      setInternLogs(res.data.data.attendance || []);
      setInternStats({
        totalDays: res.data.data.totalDays || 0,
        presentDays: res.data.data.presentDays || 0,
        percentage: res.data.data.percentage || 0,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load attendance logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Fetch Batches (for dropdown list)
  const fetchBatchesList = useCallback(async () => {
    try {
      if (isMentor) {
        // Mentors get their batches from user details
        setBatches(user.mentorBatches || []);
        if (user.mentorBatches?.length > 0) {
          setSelectedBatch(user.mentorBatches[0]._id);
        }
      } else {
        // Admin / Super Admin gets all batches
        const res = await getAllBatches();
        setBatches(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load batches:", err);
    }
  }, [isMentor, user.mentorBatches]);

  // 3. Fetch Grid Attendance (Mentor/Admin view)
  const fetchGridAttendance = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // If batch is selected, fetch both batch interns and attendance to merge
      if (selectedBatch && selectedBatch !== "all_colleges_view") {
        const [internsRes, attendanceRes] = await Promise.all([
          getAllInternsByBatch(selectedBatch),
          getAttendanceByBatch(selectedBatch, selectedDate),
        ]);

        const interns = internsRes.data.data || [];
        const attendance = attendanceRes.data.data || [];

        // Merge to ensure absent interns are displayed
        const merged = interns.map((intern) => {
          const record = attendance.find((a) => (a.intern?._id || a.intern) === intern._id);
          return {
            _id: record?._id || `temp-${intern._id}`,
            intern: {
              _id: intern._id,
              username: intern.username,
              email: intern.email,
            },
            status: record?.status || "absent",
            activeSeconds: record?.activeSeconds || 0,
            markedAt: record?.markedAt || null,
            updatedBy: record?.updatedBy || null,
            isNewRecord: !record,
          };
        });

        setAttendanceData(merged);
      } else {
        // Default: Organization-wide daily view
        const res = await getAttendanceByDate(selectedDate);
        setAttendanceData(res.data.data.attendance || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load attendance records.");
    } finally {
      setLoading(false);
    }
  }, [selectedBatch, selectedDate]);

  // Initial loads
  useEffect(() => {
    if (isIntern) {
      fetchInternHistory();
    } else {
      fetchBatchesList();
    }
  }, [isIntern, fetchInternHistory, fetchBatchesList]);

  // Fetch grid whenever date or batch changes
  useEffect(() => {
    if (!isIntern) {
      fetchGridAttendance();
    }
  }, [isIntern, fetchGridAttendance]);

  // Handle manual status toggling
  const handleToggleStatus = async (item) => {
    const newStatus = item.status === "present" ? "absent" : "present";
    setActionLoadingId(item._id);
    setActionError("");
    try {
      await updateAttendance(item.intern._id, selectedDate, newStatus);
      // Reload current grid view
      setAttendanceData((prev) => prev.map((i) => (i._id === item._id ? { ...i, status: newStatus } : i)));
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to update attendance.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter local records by search query
  const filteredData = attendanceData.filter((item) => {
    const name = item.intern?.username?.toLowerCase() || "";
    const email = item.intern?.email?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  // --- INTERN RENDER VIEW ---
  if (isIntern) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">My Attendance</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review your daily activity log and active time count in the portal.
            </p>
          </div>
          <Button onClick={fetchInternHistory} size="sm" variant="outline" className="cursor-pointer gap-1.5">
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>

        {/* stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Tracked Days
              </CardTitle>
              <Calendar className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{internStats.totalDays}</div>
              <p className="text-xs text-muted-foreground mt-1">Days logged in the app</p>
            </CardContent>
          </Card>

          <Card className="bg-card border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Present Days
              </CardTitle>
              <CheckCircle2 className="size-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{internStats.presentDays}</div>
              <p className="text-xs text-muted-foreground mt-1">Active for 15+ mins of those days</p>
            </CardContent>
          </Card>

          <Card className="bg-card border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Attendance Rate
              </CardTitle>
              <Award className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{internStats.percentage}%</span>
                <Badge
                  variant={Number(internStats.percentage) >= 75 ? "active" : "inactive"}
                  className="text-[10px] py-0 px-1.5"
                >
                  {Number(internStats.percentage) >= 75 ? "Good" : "Low"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Required benchmark: 75%</p>
            </CardContent>
          </Card>
        </div>

        {/* history logs */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : error ? (
          <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-lg text-destructive text-sm text-center">
            {error}
          </div>
        ) : internLogs.length === 0 ? (
          <div className="text-center py-20 border border-dashed rounded-lg bg-accent/5">
            <Clock size={36} className="mx-auto text-muted-foreground mb-3 opacity-60 animate-pulse" />
            <p className="text-sm text-muted-foreground font-medium">No attendance logs recorded yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start working on the portal. Your time counts once your tab remains active.
            </p>
          </div>
        ) : (
          <div className="border rounded-md bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Active Duration</TableHead>
                  <TableHead>Time Present</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {internLogs.map((log) => (
                  <TableRow key={log.date} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{formatDate(log.date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Clock size={13} className="text-muted-foreground" />
                        {formatDuration(log.activeSeconds)}
                      </div>
                    </TableCell>
                    <TableCell>{log.markedAt ? formatTime(log.markedAt) : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={log.status === "present" ? "active" : "inactive"}
                        className="font-semibold text-xs px-2.5 py-0.5"
                      >
                        {log.status === "present" ? "Present" : "Absent"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  }

  // --- MENTOR / ADMIN RENDER VIEW ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Attendance Records</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track daily active time thresholds and manage overrides for batch interns.
          </p>
        </div>
        <Button onClick={fetchGridAttendance} size="sm" variant="outline" className="cursor-pointer gap-1.5">
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="bg-card shadow-sm border">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end flex-wrap">
            {/* Batch Select */}
            <div className="space-y-2 w-full sm:w-[250px]">
              <Label className="text-xs">Select Batch</Label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Batch" />
                </SelectTrigger>
                <SelectContent>
                  {!isMentor && (
                    <SelectItem value="all_colleges_view">All Active Interns (Org-wide)</SelectItem>
                  )}
                  {batches.map((batch) => (
                    <SelectItem key={batch._id} value={batch._id}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Select */}
            <div className="space-y-2 w-full sm:w-[180px]">
              <Label className="text-xs">Date</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Local Search Input */}
            <div className="space-y-2 w-full sm:flex-1 min-w-[200px]">
              <Label className="text-xs">Search Intern</Label>
              <div className="relative">
                <Input
                  placeholder="Search intern name or email..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="pl-9 w-full"
                />
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {actionError && (
        <div className="p-3.5 text-sm border border-destructive/20 bg-destructive/10 rounded-lg text-destructive flex items-center justify-between">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError("")}
            className="text-xs hover:underline font-semibold cursor-pointer text-destructive bg-transparent border-none outline-none"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Row */}
      {!loading && !error && filteredData.length > 0 && (
        <div className="flex gap-4 flex-wrap text-sm font-medium text-muted-foreground bg-muted/30 border p-3 rounded-lg px-4 items-center">
          <span className="flex items-center gap-1"><Users size={15} /> Total: <strong className="text-foreground">{filteredData.length}</strong></span>
          <span className="h-4 w-px bg-muted border-r hidden sm:inline" />
          <span className="flex items-center gap-1 text-green-600"><CheckCircle2 size={15} /> Present: <strong>{filteredData.filter(i => i.status === "present").length}</strong></span>
          <span className="h-4 w-px bg-muted border-r hidden sm:inline" />
          <span className="flex items-center gap-1 text-destructive"><XCircle size={15} /> Absent: <strong>{filteredData.filter(i => i.status === "absent").length}</strong></span>
        </div>
      )}

      {/* Grid Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      ) : error ? (
        <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-lg text-destructive text-sm text-center">
          {error}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-lg bg-accent/5">
          <Users size={36} className="mx-auto text-muted-foreground mb-3 opacity-60" />
          <p className="text-sm text-muted-foreground font-medium">No matching attendance logs found.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Ensure the selected batch has active interns, or search using a different keyword.
          </p>
        </div>
      ) : (
        <div className="border rounded-md bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Intern Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Active Duration</TableHead>
                <TableHead>Time Marked</TableHead>
                <TableHead className="text-center">Status</TableHead>
                {canUpdate && <TableHead className="text-right w-[150px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item._id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-foreground">{item.intern?.username}</TableCell>
                  <TableCell className="text-muted-foreground">{item.intern?.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-foreground">
                      <Clock size={13} className="text-muted-foreground" />
                      {formatDuration(item.activeSeconds)}
                    </div>
                  </TableCell>
                  <TableCell>{item.markedAt ? formatTime(item.markedAt) : "—"}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={item.status === "present" ? "active" : "inactive"}
                      className="font-semibold text-xs px-2.5 py-0.5"
                    >
                      {item.status === "present" ? "Present" : "Absent"}
                    </Badge>
                  </TableCell>
                  {canUpdate && (
                    <TableCell className="text-right">
                      <Button
                        variant={item.status === "present" ? "destructive" : "secondary"}
                        size="sm"
                        onClick={() => handleToggleStatus(item)}
                        disabled={actionLoadingId === item._id}
                        className="cursor-pointer"
                      >
                        {actionLoadingId === item._id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : item.status === "present" ? (
                          "Mark Absent"
                        ) : (
                          "Mark Present"
                        )}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;