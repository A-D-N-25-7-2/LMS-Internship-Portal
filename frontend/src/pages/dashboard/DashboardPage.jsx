import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { usePermission } from "@/hooks/usePermission";
import { getDashboardData, getInternDashboardData, getMentorDashboardData } from "@/features/dashboard/dashboardApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  Users,
  Shield,
  Calendar,
  GraduationCap,
  ArrowRight,
  Loader2,
  Clock,
  Briefcase,
  Layers,
} from "lucide-react";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const currentUser = useSelector((state) => state.auth.user);

  const [stats, setStats] = useState({
    programsCount: 0,
    batchesCount: 0,
    internsCount: 0,
    mentorsCount: 0,
  });
  const [batches, setBatches] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError("");
      try {
        if(currentUser?.role?.name !== "Intern" && currentUser?.role?.name !== "Mentor") {
          const dashboardRes = await getDashboardData();
          const { totalPrograms, totalBatches, totalActiveInterns, totalMentors, recentBatches } = dashboardRes.data.data;
          setStats({ programsCount: totalPrograms, batchesCount: totalBatches, internsCount: totalActiveInterns, mentorsCount: totalMentors });
          setBatches(recentBatches);
        }
        if(currentUser?.role?.name === "Intern") {
          const internDashboardRes = await getInternDashboardData();
          const { program, batch } = internDashboardRes.data.data;
          const programArray = Array.isArray(program) ? program : (program ? [program] : []);
          setPrograms(programArray);
          setBatches(batch ? [batch] : []);
        }
        if(currentUser?.role?.name === "Mentor") {
          const mentorDashboardRes = await getMentorDashboardData();
          const { mentorBatches, totalActiveInterns } = mentorDashboardRes.data.data;
          setBatches(mentorBatches || []);
          setStats((prev) => ({ ...prev, internsCount: totalActiveInterns }));
        }
      } catch (err) {
        setError("Failed to fetch dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser?._id, currentUser?.role?.name]);

  const getBatchStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);

    if (now < start) return "upcoming";
    if (!endDate) return "ongoing";

    const end = new Date(endDate);
    if (now > end) return "completed";

    return "ongoing";
  };

  const statusColors = {
    upcoming: "secondary",
    ongoing: "default",
    completed: "outline",
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }


  const isNotAInternOrMentor = currentUser?.role?.name !== "Intern" && currentUser?.role?.name !== "Mentor";
  const isMentor = currentUser?.role?.name === "Mentor";
  const isIntern = currentUser?.role?.name === "Intern";

  const goToProgramDetails = hasPermission("program:read") && hasPermission("batch:read");
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-1.5">
          Welcome back, <span className="font-semibold text-foreground">{currentUser?.username || "User"}</span>
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* ─── OTHER USERS VIEW ─────────────────────────────────────── */}
      {isNotAInternOrMentor && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div
              onClick={() => navigate("/programs")}
              className="cursor-pointer border bg-card rounded-xl p-5 hover:border-primary hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Programs
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {stats.programsCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                <BookOpen size={20} />
              </div>
            </div>

            <div className="border bg-card rounded-xl p-5 hover:border-primary hover:shadow-md transition-all flex items-center justify-between group">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Total Batches
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {stats.batchesCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                <Layers size={20} />
              </div>
            </div>

            <div
              onClick={() => {hasPermission("user:view") && navigate("/users")}}
              className="cursor-pointer border bg-card rounded-xl p-5 hover:border-primary hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Active Interns
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {stats.internsCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                <Users size={20} />
              </div>
            </div>

            <div
              onClick={() => {hasPermission("user:view") && navigate("/users")}}
              className="cursor-pointer border bg-card rounded-xl p-5 hover:border-primary hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Mentors
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {stats.mentorsCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                <Shield size={20} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Batches Table */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Clock size={18} className="text-primary" />
                  Recent Batches
                </h2>
              </div>
              {batches.length === 0 ? (
                <div className="border border-dashed rounded-xl py-12 text-center text-muted-foreground text-sm bg-card">
                  No batches configured yet.
                </div>
              ) : (
                <div className="rounded-xl border bg-card overflow-x-auto w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch Name</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches.map((batch) => {
                        const status = getBatchStatus(batch.startDate, batch.endDate);
                        return (
                          <TableRow
                            key={batch._id}
                            className="cursor-pointer hover:bg-accent/50"
                            onClick={() =>{
                              goToProgramDetails &&
                              navigate(
                                `/programs/${batch.program?._id || batch.program}/batches/${batch._id}`
                              )
                            }}
                          >
                            <TableCell className="font-semibold text-foreground">
                              {batch.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {batch.program?.name || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusColors[status]}>
                                {status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Quick Actions Panel */}
            {(hasPermission("user:read") || hasPermission("program:read") || hasPermission("role:read")) && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground">Quick Actions</h2>
              <div className="border bg-card rounded-xl p-6 shadow-sm space-y-3.5">
                {hasPermission("user:read") && (
                <Button
                  onClick={() => navigate("/users")}
                  className="w-full justify-between font-medium group"
                >
                  Manage Users
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Button>
                )}

                {hasPermission("program:read") && (
                <Button
                  onClick={() => navigate("/programs")}
                  variant="secondary"
                  className="w-full justify-between font-medium group"
                >
                  Manage Programs
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Button>
                )}

                {hasPermission("role:read") && (
                <Button
                  onClick={() => navigate("/roles")}
                  variant="outline"
                  className="w-full justify-between font-medium group"
                >
                  Roles & Permissions
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Button>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MENTOR VIEW ───────────────────────────────────────────── */}
      {isMentor && (
        <div className="space-y-8">
          {/* Mentor Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="border bg-card rounded-xl p-5 hover:shadow-md transition-all flex items-center justify-between group">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  My Assigned Batches
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {batches?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                <Briefcase size={20} />
              </div>
            </div>

            <div className="border bg-card rounded-xl p-5 hover:shadow-md transition-all flex items-center justify-between group">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  My Active Interns
                </p>
                <p className="text-3xl font-extrabold text-foreground mt-1">
                  {stats.internsCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                <Users size={20} />
              </div>
            </div>
          </div>

          {/* Mentor Batches List */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              My Batches
            </h2>
            {(!batches || batches.length === 0) ? (
              <div className="border border-dashed rounded-xl py-12 text-center text-muted-foreground text-sm bg-card">
                You are not currently assigned to mentor any batches.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {batches.map((batch) => (
                  <div
                    key={batch._id}
                    onClick={() =>
                      navigate(`/programs/${batch.program?._id || batch.program}/batches/${batch._id}`)
                    }
                    className="cursor-pointer border bg-card rounded-xl p-5 hover:border-primary hover:shadow-md transition-all flex flex-col justify-between h-36"
                  >
                    <div>
                      <h3 className="font-semibold text-foreground text-base truncate">
                        {batch.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click to view intern list & details.
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-xs text-primary font-medium flex items-center gap-1">
                        View cohort
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── INTERN VIEW ───────────────────────────────────────────── */}
      {isIntern && (
        <div className="space-y-6 sm:space-y-8">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">My Programs</h2>
            {!programs || programs.length === 0 ? (
              <div className="border border-dashed rounded-xl py-12 text-center text-muted-foreground text-sm bg-card">
                You are not currently enrolled in any programs. Please contact your coordinator.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {programs.map((prog) => {
                  const currentBatch = batches[0];
                  const hasBatchForThisProg =
                    currentBatch &&
                    (currentBatch.program === prog._id ||
                      currentBatch.program?._id === prog._id);

                  return (
                    <div
                      key={prog._id}
                      className="border bg-card rounded-xl p-5 hover:border-primary hover:shadow-md transition-all flex flex-col justify-between h-44"
                    >
                      <div className="space-y-2">
                        <Badge variant="outline">Program</Badge>
                        <h3 className="font-semibold text-foreground text-base truncate">
                          {prog.name}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Layers size={14} className="text-primary shrink-0" />
                          Batch:{" "}
                          <span className="font-medium text-foreground">
                            {hasBatchForThisProg ? currentBatch.name : "—"}
                          </span>
                        </p>
                      </div>

                      <Button
                        onClick={() => navigate(`/programs/${prog._id}`)}
                        className="w-full font-medium justify-between group mt-4"
                        size="sm"
                      >
                        View Modules
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Shortcuts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                onClick={() => navigate("/attendance")}
                className="cursor-pointer border bg-card rounded-xl p-5 hover:border-primary hover:shadow-md transition-all flex items-center justify-between group"
              >
                <div>
                  <h3 className="font-semibold text-foreground">Attendance</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mark/view attendance records.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                  <Calendar size={18} />
                </div>
              </div>

              <div
                onClick={() => navigate("/profile")}
                className="cursor-pointer border bg-card rounded-xl p-5 hover:border-primary hover:shadow-md transition-all flex items-center justify-between group"
              >
                <div>
                  <h3 className="font-semibold text-foreground">My Profile</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    View and update account details.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                  <Users size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
