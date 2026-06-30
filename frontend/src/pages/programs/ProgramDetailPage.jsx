import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProgramById } from "@/features/programs/programApi";
import {
  getAllBatches,
  createBatch,
  deleteBatch,
  updateBatch,
} from "@/features/batches/batchApi";
import {
  deleteModule,
  updateModule,
  createModule,
  getAllModules,
} from "@/features/modules/moduleApi";
import { getAllUsers } from "@/features/users/userApi";
import { usePermission } from "@/hooks/usePermission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Users,
  Layers,
} from "lucide-react";

// ─── Modules Tab ────────────────────────────────────────────────
const ModulesTab = ({ programId, navigate }) => {
  const { hasPermission } = usePermission();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // create/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    order: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const { data } = await getAllModules(programId);
      setModules(data.data);
    } catch {
      setError("Failed to fetch modules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [programId]);

  const openCreateModal = () => {
    setEditTarget(null);
    setFormData({ name: "", description: "", order: "" });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (module) => {
    setEditTarget(module);
    setFormData({
      name: module.name,
      description: module.description || "",
      order: module.order?.toString() || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.order) {
      setFormError("Name and order are required");
      return;
    }
    setFormLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        order: Number(formData.order),
        ...(!editTarget && { program: programId }),
      };

      if (editTarget) {
        await updateModule(editTarget._id, payload);
      } else {
        await createModule(payload);
      }
      setModalOpen(false);
      fetchModules();
    } catch (err) {
      setFormError(err.response?.data?.message || "Operation failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteModule(deleteTarget._id);
      setDeleteTarget(null);
      fetchModules();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );

  const showActions =
    hasPermission("module:update") || hasPermission("module:delete");
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {modules.length} module{modules.length !== 1 ? "s" : ""} in this
          program
        </p>
        {hasPermission("module:create") && (
          <Button size="sm" onClick={openCreateModal}>
            <Plus size={15} className="mr-2" />
            Add Module
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {modules.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No modules yet. Add one to get started.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Module Name</TableHead>
                <TableHead>Description</TableHead>
                {showActions && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((module) => (
                <TableRow
                  key={module._id}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => navigate(`/modules/${module._id}`)}
                >
                  <TableCell>
                    <Badge variant="outline">#{module.order}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{module.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {module.description || "—"}
                  </TableCell>
                  {showActions && (
                    <TableCell className="text-right">
                      <div
                        className="flex justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {hasPermission("module:update") && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditModal(module)}
                          >
                            <Pencil size={14} />
                          </Button>
                        )}
                        {hasPermission("module:delete") && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteTarget(module)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* create/edit modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setFormData({ name: "", description: "", order: "" });
            setEditTarget(null);
            setFormError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Module" : "Add Module"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {formError && (
              <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md">
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <Label>Module Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. React Fundamentals"
                disabled={formLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="What will interns learn?"
                disabled={formLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input
                type="number"
                min={1}
                value={formData.order}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, order: e.target.value }))
                }
                placeholder="e.g. 1"
                disabled={formLoading}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading && (
                  <Loader2 size={14} className="mr-2 animate-spin" />
                )}
                {formLoading
                  ? "Saving..."
                  : editTarget
                    ? "Save Changes"
                    : "Add Module"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* delete confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Module</AlertDialogTitle>
            <AlertDialogDescription>
              Delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.name}
              </span>
              ? This will fail if resources or assignments exist under this
              module.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading && (
                <Loader2 size={14} className="mr-2 animate-spin" />
              )}
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ─── Batches Tab ────────────────────────────────────────────────
const BatchesTab = ({ programId }) => {
  const { hasPermission } = usePermission();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const { data } = await getAllBatches(programId);
      setBatches(data.data);
    } catch {
      setError("Failed to fetch batches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [programId]);

  const openCreateModal = () => {
    setEditTarget(null);
    setFormData({
      name: "",
      startDate: "",
      endDate: "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (batch) => {
    setEditTarget(batch);
    setFormData({
      name: batch.name,
      startDate: batch.startDate?.split("T")[0] || "",
      endDate: batch.endDate?.split("T")[0] || "",
      mentors: batch.mentors?.map((m) => m._id) || [],
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.startDate) {
      setFormError("Name and start date are required");
      return;
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        setFormError("Invalid date range: start date must be before end date");
        return;
      }
    }
    setFormLoading(true);
    setFormError("");
    try {
      const payload = {
        name: formData.name.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        ...(!editTarget && { program: programId }),
      };

      if (editTarget) {
        await updateBatch(editTarget._id, payload);
      } else {
        await createBatch(payload);
      }
      setModalOpen(false);
      fetchBatches();
    } catch (err) {
      setFormError(err.response?.data?.message || "Operation failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteBatch(deleteTarget._id);
      setDeleteTarget(null);
      fetchBatches();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete batch");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
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

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );

  const showActions =
    hasPermission("batch:update") || hasPermission("batch:delete");
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {batches.length} batch{batches.length !== 1 ? "es" : ""} in this
          program
        </p>
        {hasPermission("batch:create") && (
          <Button size="sm" onClick={openCreateModal}>
            <Plus size={15} className="mr-2" />
            Add Batch
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {batches.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No batches yet. Add one to get started.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                {showActions && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch._id}>
                  <TableCell className="font-medium">{batch.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        statusColors[
                          getBatchStatus(batch.startDate, batch.endDate)
                        ]
                      }
                    >
                      {getBatchStatus(batch.startDate, batch.endDate)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {batch.startDate
                      ? new Date(batch.startDate).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {batch.endDate
                      ? new Date(batch.endDate).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  {showActions && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {hasPermission("batch:update") && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditModal(batch)}
                          >
                            <Pencil size={14} />
                          </Button>
                        )}
                        {hasPermission("batch:delete") && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteTarget(batch)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* create/edit modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setEditTarget(null);
            setFormError("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Batch" : "Add Batch"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {formError && (
              <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label>Batch Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Jan 2026 Batch"
                disabled={formLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, startDate: e.target.value }))
                  }
                  disabled={formLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  End Date{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, endDate: e.target.value }))
                  }
                  disabled={formLoading}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading && (
                  <Loader2 size={14} className="mr-2 animate-spin" />
                )}
                {formLoading
                  ? "Saving..."
                  : editTarget
                    ? "Save Changes"
                    : "Add Batch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* delete confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Batch</AlertDialogTitle>
            <AlertDialogDescription>
              Delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.name}
              </span>
              ? This will fail if interns are assigned to this batch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading && (
                <Loader2 size={14} className="mr-2 animate-spin" />
              )}
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ─── Main ProgramDetailPage ──────────────────────────────────────
const ProgramDetailPage = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const { data } = await getProgramById(programId);
        setProgram(data.data);
      } catch {
        navigate("/programs");
      } finally {
        setLoading(false);
      }
    };
    fetchProgram();
  }, [programId]);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );

  if (!program) return null;

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/programs")}
          className="mt-1"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{program.name}</h1>
          {program.description && (
            <p className="text-muted-foreground text-sm mt-1">
              {program.description}
            </p>
          )}
        </div>
      </div>

      {/* tabs */}
      <Tabs defaultValue="modules">
        <TabsList>
          {hasPermission("module:read") && (
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <Layers size={15} />
              Modules
            </TabsTrigger>
          )}
          {hasPermission("batch:read") && (
            <TabsTrigger value="batches" className="flex items-center gap-2">
              <Users size={15} />
              Batches
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="modules" className="mt-6">
          <ModulesTab programId={programId} navigate={navigate} />
        </TabsContent>

        <TabsContent value="batches" className="mt-6">
          <BatchesTab programId={programId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProgramDetailPage;
