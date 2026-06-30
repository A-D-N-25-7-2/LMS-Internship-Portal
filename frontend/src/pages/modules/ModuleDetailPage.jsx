import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getResourcesByModule,
  createResource,
  updateResource,
  deleteResource,
} from "@/features/resources/resourceApi";
import {
  getAssignmentsByModule,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "@/features/assignments/assignmentApi";
import { getModuleById } from "@/features/modules/moduleApi";
import { usePermission } from "@/hooks/usePermission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  ClipboardList,
  Link,
  File,
  ChevronRight,
} from "lucide-react";

// ─── Resources Section ───────────────────────────────────────────
const ResourcesSection = ({ moduleId, navigate }) => {
  const { hasPermission } = usePermission();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // create/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([{ name: "", value: "" }]);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const { data } = await getResourcesByModule(moduleId);
      setResources(data.data);
    } catch {
      setError("Failed to fetch resources.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [moduleId]);

  const openCreateModal = () => {
    setEditTarget(null);
    setFormData({ title: "", description: "" });
    setFiles([]);
    setLinks([{ name: "", value: "" }]);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (resource) => {
    setEditTarget(resource);
    setFormData({
      title: resource.title,
      description: resource.description || "",
    });
    setFiles([]);
    setLinks(
      resource.links?.length > 0 ? resource.links : [{ name: "", value: "" }],
    );
    setFormError("");
    setModalOpen(true);
  };

  const handleAddLink = () =>
    setLinks((prev) => [...prev, { name: "", value: "" }]);
  const handleRemoveLink = (i) =>
    setLinks((prev) => prev.filter((_, idx) => idx !== i));
  const handleLinkChange = (i, field, value) => {
    setLinks((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError("Title is required");
      return;
    }

    const validLinks = links.filter((l) => l.value.trim());

    if (!editTarget && files.length === 0 && validLinks.length === 0) {
      setFormError("At least one file or link is required");
      return;
    }

    setFormLoading(true);
    setFormError("");

    try {
      const form = new FormData();
      form.append("title", formData.title.trim());
      form.append("description", formData.description.trim());
      if (!editTarget) form.append("module", moduleId);
      files.forEach((file) => form.append("files", file));
      form.append("links", JSON.stringify(validLinks));

      if (editTarget) {
        await updateResource(editTarget._id, form);
      } else {
        await createResource(form);
      }

      setModalOpen(false);
      fetchResources();
    } catch (err) {
      setFormError(err.response?.data?.message || "Operation failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteResource(deleteTarget._id);
      setDeleteTarget(null);
      fetchResources();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete resource");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-muted-foreground" size={26} />
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Resources</h2>
          <Badge variant="secondary" className="text-xs">
            {resources.length}
          </Badge>
        </div>
        {hasPermission("resource:create") && (
          <Button size="sm" onClick={openCreateModal}>
            <Plus size={14} className="mr-1.5" />
            Add Resource
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {resources.length === 0 ? (
        <div className="border border-dashed rounded-xl py-12 text-center text-muted-foreground text-sm">
          No resources yet.
          {hasPermission("resource:create") && " Add one to get started."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {resources.map((resource) => {
            const hasFiles = resource.files?.length > 0;
            const hasLinks = resource.links?.length > 0;

            return (
              <div
                key={resource._id}
                onClick={() =>
                  navigate(`/modules/${moduleId}/resources/${resource._id}`)
                }
                className="cursor-pointer border rounded-xl p-4 hover:border-primary hover:shadow-sm transition-all bg-background group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {resource.title}
                      </p>
                      {resource.description && (
                        <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">
                          {resource.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {hasFiles && (
                          <Badge variant="secondary" className="text-xs">
                            {resource.files.length} file
                            {resource.files.length > 1 ? "s" : ""}
                          </Badge>
                        )}
                        {hasLinks && (
                          <Badge variant="outline" className="text-xs">
                            {resource.links.length} link
                            {resource.links.length > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {hasPermission("resource:update") && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditModal(resource)}
                      >
                        <Pencil size={14} />
                      </Button>
                    )}
                    {hasPermission("resource:delete") && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteTarget(resource)}
                      >
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* create/edit modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Resource" : "Add Resource"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {formError && (
              <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="e.g. React Hooks Guide"
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
                placeholder="Brief description"
                disabled={formLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Files{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <input
                type="file"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files))}
                disabled={formLoading}
                className="text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-border file:text-sm file:bg-background file:text-foreground hover:file:bg-accent cursor-pointer w-full"
              />
              {files.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {files.map((f, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {f.name}
                    </Badge>
                  ))}
                </div>
              )}
              {editTarget && (
                <p className="text-xs text-muted-foreground">
                  Uploading new files will add to existing ones.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Links{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="text-xs text-primary hover:underline"
                  disabled={formLoading}
                >
                  + Add link
                </button>
              </div>
              {links.map((link, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Input
                    placeholder="Label"
                    value={link.name}
                    onChange={(e) =>
                      handleLinkChange(i, "name", e.target.value)
                    }
                    disabled={formLoading}
                    className="flex-1"
                  />
                  <Input
                    placeholder="URL or text"
                    value={link.value}
                    onChange={(e) =>
                      handleLinkChange(i, "value", e.target.value)
                    }
                    disabled={formLoading}
                    className="flex-1"
                  />
                  {links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(i)}
                      className="text-destructive mt-2"
                      disabled={formLoading}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
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
                    : "Add Resource"}
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
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.title}
              </span>
              ? This cannot be undone.
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
    </section>
  );
};

// ─── Assignments Section ─────────────────────────────────────────
const AssignmentsSection = ({ moduleId, navigate }) => {
  const { hasPermission } = usePermission();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // create/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    totalMarks: "100",
    dueDate: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data } = await getAssignmentsByModule(moduleId);
      setAssignments(data.data);
      setError("");
    } catch {
      setError("Failed to fetch assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [moduleId]);

  const openCreateModal = () => {
    setEditTarget(null);
    setFormData({ title: "", description: "", totalMarks: "100", dueDate: "" });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (assignment) => {
    setEditTarget(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description || "",
      totalMarks: assignment.totalMarks?.toString() || "100",
      dueDate: assignment.dueDate?.split("T")[0] || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError("Title is required");
      return;
    }
    if (!formData.totalMarks || Number(formData.totalMarks) <= 0) {
      setFormError("Total marks must be greater than 0");
      return;
    }

    setFormLoading(true);
    setFormError("");

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        totalMarks: Number(formData.totalMarks),
        dueDate: formData.dueDate,
        ...(!editTarget && { module: moduleId }),
      };

      if (editTarget) {
        await updateAssignment(editTarget._id, payload);
      } else {
        await createAssignment(moduleId ,payload);
      }

      setModalOpen(false);
      fetchAssignments();
    } catch (err) {
      setFormError(err.response?.data?.message || "Operation failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteAssignment(deleteTarget._id);
      setDeleteTarget(null);
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete assignment");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-muted-foreground" size={26} />
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList size={18} className="text-orange-500" />
          <h2 className="text-lg font-semibold text-foreground">Assignments</h2>
          <Badge variant="secondary" className="text-xs">
            {assignments.length}
          </Badge>
        </div>
        {hasPermission("assignment:create") && (
          <Button size="sm" onClick={openCreateModal}>
            <Plus size={14} className="mr-1.5" />
            Create Assignment
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="border border-dashed rounded-xl py-12 text-center text-muted-foreground text-sm">
          No assignments yet.
          {hasPermission("assignment:create") && " Create one to get started."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {assignments.map((assignment) => (
            <div
              key={assignment._id}
              onClick={() =>
                navigate(`/modules/${moduleId}/assignments/${assignment._id}`)
              }
              className="cursor-pointer border rounded-xl p-4 hover:border-primary hover:shadow-sm transition-all bg-background group w-full"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                    <ClipboardList size={16} className="text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {assignment.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">Total Marks</p>
                    <p className="text-sm font-semibold text-foreground">
                      {assignment.totalMarks}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-muted-foreground group-hover:text-foreground transition-colors"
                  />
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {hasPermission("assignment:update") && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditModal(assignment)}
                      >
                        <Pencil size={14} />
                      </Button>
                    )}
                    {hasPermission("assignment:delete") && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteTarget(assignment)}
                      >
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* create/edit modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Assignment" : "Create Assignment"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {formError && (
              <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="e.g. Build a REST API"
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
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Describe the assignment requirements..."
                disabled={formLoading}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>
                due Date{" "}
              </Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, dueDate: e.target.value }))
                }
                disabled={formLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Total Marks</Label>
              <Input
                type="number"
                min={1}
                value={formData.totalMarks}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, totalMarks: e.target.value }))
                }
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
                    : "Create Assignment"}
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
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.title}
              </span>
              ? This will also delete all submissions for this assignment.
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
    </section>
  );
};

// ─── Main ModuleDetailPage ───────────────────────────────────────
const ModuleDetailPage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();

  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModule = async () => {
      try {
        const { data } = await getModuleById(moduleId);
        setModule(data.data);
      } catch {
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchModule();
  }, [moduleId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  if (!module) return null;

  return (
    <div className="space-y-8">
      {/* header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mt-1"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{module.name}</h1>
          {module.description && (
            <p className="text-muted-foreground text-sm mt-1">
              {module.description}
            </p>
          )}
        </div>
      </div>

      <ResourcesSection moduleId={moduleId} navigate={navigate} />

      <div className="border-t" />

      <AssignmentsSection moduleId={moduleId} navigate={navigate} />
    </div>
  );
};

export default ModuleDetailPage;
