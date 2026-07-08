import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getBatchById, getAllInternsByBatch } from "@/features/batches/batchApi";
import { toggleUserActive } from "@/features/users/userApi";
import { usePermission } from "@/hooks/usePermission";
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
  ArrowLeft,
  Loader2,
  UserX,
  UserCheck,
  Users,
  Calendar,
  GraduationCap,
} from "lucide-react";

const BatchInternsPage = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const currentUser = useSelector((state) => state.auth.user);

  const [batch, setBatch] = useState(null);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    const fetchBatchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [batchRes, internsRes] = await Promise.all([
          getBatchById(batchId),
          getAllInternsByBatch(batchId),
        ]);
        setBatch(batchRes.data.data);
        setInterns(internsRes.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load batch details.");
      } finally {
        setLoading(false);
      }
    };

    fetchBatchData();
  }, [batchId]);

  const handleToggleActive = async (userId) => {
    setTogglingId(userId);
    try {
      await toggleUserActive(userId);
      setInterns((prev) =>
        prev.map((intern) =>
          intern._id === userId
            ? { ...intern, isActive: !intern.isActive }
            : intern
        )
      );
    } catch {
      // Quietly fail or handle error if needed
    } finally {
      setTogglingId(null);
    }
  };

  const statusColors = {
    upcoming: "secondary",
    ongoing: "default",
    completed: "outline",
  };

  const getBatchStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);

    if (now < start) return "upcoming";
    if (!endDate) return "ongoing";

    const end = new Date(endDate);
    if (now > end) return "completed";

    return "ongoing";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} className="mr-1" />
          Back
        </Button>
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (!batch) return null;

  const batchStatus = getBatchStatus(batch.startDate, batch.endDate);
  const showActions =
    hasPermission("intern:update");

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="-ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} className="mr-1.5" />
          Back
        </Button>
      </div>

      {/* Header Details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-foreground">
              {batch.name}
            </h1>
            <Badge variant={statusColors[batchStatus]}>{batchStatus}</Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1.5">
            <GraduationCap size={16} className="text-primary" />
            Program: {batch.program?.name || "—"}
          </p>
        </div>

        {/* Dates */}
        <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-4 sm:gap-6 border rounded-xl p-4 bg-card shadow-sm text-sm w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Start Date</p>
              <p className="font-medium text-foreground">
                {batch.startDate
                  ? new Date(batch.startDate).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
          <div className="hidden sm:block h-8 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">End Date</p>
              <p className="font-medium text-foreground">
                {batch.endDate
                  ? new Date(batch.endDate).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interns Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Interns</h2>
          <Badge variant="secondary" className="text-xs">
            {interns.length}
          </Badge>
        </div>

        {interns.length === 0 ? (
          <div className="border border-dashed rounded-xl py-12 text-center text-muted-foreground text-sm">
            No interns currently assigned to this batch.
          </div>
        ) : (
          <div className="rounded-md border bg-card overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  {showActions && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {interns.map((intern) => (
                  <TableRow key={intern._id}>
                    <TableCell className="font-medium">
                      {intern.username}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {intern.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={intern.isActive ? "active" : "inactive"}>
                        {intern.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {showActions && (
                      <TableCell className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleToggleActive(intern._id)}
                          disabled={togglingId === intern._id}
                          title={intern.isActive ? "Deactivate" : "Activate"}
                        >
                          {togglingId === intern._id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : intern.isActive ? (
                            <UserX size={15} className="text-destructive" />
                          ) : (
                            <UserCheck size={15} className="text-green-500" />
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
    </div>
  );
};

export default BatchInternsPage;
