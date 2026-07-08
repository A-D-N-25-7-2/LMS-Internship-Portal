import { useEffect, useState } from "react";
import {
  getAllColleges,
  createCollege,
  updateCollege,
  deleteCollege,
} from "@/features/colleges/collegeApi";
import { usePermission } from "@/hooks/usePermission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2, School, Users } from "lucide-react";

const CollegePage = () => {
  const { hasPermission } = usePermission();

  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create, object = edit
  const [collegeName, setCollegeName] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Delete dialog states
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchColleges = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllColleges();
      setColleges(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch colleges.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  const openCreateModal = () => {
    setEditTarget(null);
    setCollegeName("");
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (college) => {
    setEditTarget(college);
    setCollegeName(college.name);
    setFormError("");
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!collegeName.trim()) {
      setFormError("College name is required.");
      return;
    }

    setFormLoading(true);
    setFormError("");
    try {
      if (editTarget) {
        // Edit Mode
        await updateCollege(editTarget._id, { name: collegeName.trim() });
        await fetchColleges();
      } else {
        // Create Mode
        await createCollege({ name: collegeName.trim() });
        await fetchColleges();
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteCollege(deleteTarget._id);
      await fetchColleges();
      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete college.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Compute stats
  const totalColleges = colleges.length;
  const totalInterns = colleges.reduce((sum, c) => sum + (c.internCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Colleges</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage colleges and track the number of registered interns from each institution.
          </p>
        </div>
        {hasPermission("college:create") && (
          <Button onClick={openCreateModal} className="cursor-pointer gap-2">
            <Plus size={16} /> Add College
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-card shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Institutions
            </CardTitle>
            <School className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalColleges}</div>
            <p className="text-xs text-muted-foreground mt-1">Affiliated colleges in the portal</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Affiliated Interns
            </CardTitle>
            <Users className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInterns}</div>
            <p className="text-xs text-muted-foreground mt-1">Interns linked to registered colleges</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      ) : error ? (
        <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-lg text-destructive text-sm text-center">
          {error}
        </div>
      ) : colleges.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-lg bg-accent/5">
          <School size={36} className="mx-auto text-muted-foreground mb-3 opacity-60" />
          <p className="text-sm text-muted-foreground font-medium">No colleges found.</p>
          {hasPermission("college:create") && (
            <Button onClick={openCreateModal} variant="outline" className="mt-4 cursor-pointer gap-2">
              <Plus size={16} /> Create your first college
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>College Name</TableHead>
                <TableHead>Intern Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colleges.map((college) => (
                <TableRow key={college._id}>
                  <TableCell className="font-medium">{college.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {college.internCount || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {hasPermission("college:update") && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditModal(college)}
                          title="Edit College"
                        >
                          <Pencil size={15} />
                        </Button>
                      )}
                      {hasPermission("college:delete") && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteTarget(college)}
                          title="Delete College"
                        >
                          <Trash2 size={15} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit College Modal Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit College" : "Add New College"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="college-name">College Name</Label>
              <Input
                id="college-name"
                placeholder="e.g. Stanford University"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                disabled={formLoading}
                className="col-span-3"
              />
            </div>

            {formError && (
              <p className="text-xs text-destructive border border-destructive/20 bg-destructive/10 p-2.5 rounded-lg">
                {formError}
              </p>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={formLoading} className="cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading} className="cursor-pointer min-w-[80px]">
                {formLoading ? <Loader2 size={14} className="animate-spin" /> : editTarget ? "Save Changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete College</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>? 
              This action cannot be undone. Any interns currently mapped to this college will have their college association removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading} className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubmit}
              disabled={deleteLoading}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer min-w-[80px]"
            >
              {deleteLoading ? <Loader2 size={14} className="animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CollegePage;
