import { useEffect, useState } from "react";
import {
  getAllPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
} from "@/features/programs/programApi";
import { usePermission } from "@/hooks/usePermission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Layers, CalendarDays } from "lucide-react";
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
import { Loader2, Plus, Pencil, Trash2, LibraryBig } from "lucide-react";

const initialForm = { name: "", description: "" };

const ProgramsPage = () => {
  const { hasPermission } = usePermission();
  const navigate = useNavigate();

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPrograms = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await getAllPrograms();
      setPrograms(data.data);
    } catch {
      setError("Failed to fetch programs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const openCreateModal = () => {
    setEditTarget(null);
    setFormData(initialForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (program) => {
    setEditTarget(program);
    setFormData({ name: program.name, description: program.description || "" });
    setFormError("");
    setModalOpen(true);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Program name is required");
      return;
    }
    setFormLoading(true);
    setFormError("");
    try {
      if (editTarget) {
        await updateProgram(editTarget._id, formData);
      } else {
        await createProgram(formData);
      }
      setModalOpen(false);
      fetchPrograms();
    } catch (err) {
      setFormError(err.response?.data?.message || "Operation failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteProgram(deleteTarget._id);
      setDeleteTarget(null);
      fetchPrograms();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete program");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Programs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Internship programs
          </p>
        </div>
        {hasPermission("program:create") && (
          <Button onClick={openCreateModal}>
            <Plus size={16} className="mr-2" />
            Create Program
          </Button>
        )}
      </div>

      {/* error */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No programs found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((program) => {
            return (
              <Card
                key={program._id}
                onClick={() => {
                  if (
                    hasPermission("batch:read") ||
                    hasPermission("module:read")
                  ) {
                    navigate(`/programs/${program._id}`);
                  }
                }}
                className="cursor-pointer hover:shadow-md transition-all duration-200 group"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors trunk line-clamp-1">
                      {program.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      {/* edit - programs */}
                      {hasPermission("program:update") && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(program);
                          }}
                          title="Edit program"
                        >
                          <Pencil size={15} />
                        </Button>
                      )}

                      {/* delete - programs */}
                      {hasPermission("program:delete") && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(program);
                          }}
                          title="Delete program"
                        >
                          <Trash2 size={15} className="text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 ">
                  {/* Stats row */}
                  <div>
                    <p className="text-sm text-muted-foreground trunk line-clamp-2 ">
                      {program.description}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-sm text-foreground">
                      <LibraryBig className="w-4 h-4" />
                      <span>
                        <span className="font-medium text-foreground">
                          {program.moduleCount}
                        </span>{" "}
                        {program.moduleCount === 1 ? "Module" : "Modules"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-foreground">
                      <Users className="w-4 h-4" />
                      <span>
                        <span className="font-medium text-foreground">
                          {program.internCount}
                        </span>{" "}
                        {program.internCount === 1 ? "Intern" : "Interns"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-foreground">
                      <Layers className="w-4 h-4" />
                      <span>
                        <span className="font-medium text-foreground">
                          {program.batchCount}
                        </span>{" "}
                        {program.batchCount === 1 ? "Batch" : "Batches"}
                      </span>
                    </div>
                  </div>

                  {/* Created at */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>
                      Created{" "}
                      {new Date(program.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* create/edit modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setFormData(initialForm);
            setFormError("");
            setEditTarget(null);
          }
        }}
      >
        <DialogContent
          onOpenAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Program" : "Create Program"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {formError && (
              <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label>Program Name</Label>
              <Input
                name="name"
                placeholder="e.g. Full Stack Web Development"
                value={formData.name}
                onChange={handleChange}
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
              <Textarea
                name="description"
                placeholder="Brief description of the program"
                value={formData.description}
                onChange={handleChange}
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
                  <Loader2 size={15} className="mr-2 animate-spin" />
                )}
                {formLoading
                  ? editTarget
                    ? "Saving..."
                    : "Creating..."
                  : editTarget
                    ? "Save Changes"
                    : "Create Program"}
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
            <AlertDialogTitle>Delete Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.name}
              </span>
              ? This will fail if modules or batches exist under this program.
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

export default ProgramsPage;
