import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getResourcesByModule,
  getResourceById,
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
import { getAllBatches } from "@/features/batches/batchApi";
import { getModuleById } from "@/features/modules/moduleApi";
import { usePermission } from "@/hooks/usePermission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FileText,
  ClipboardList,
  ChevronRight,X
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
  const [links, setLinks] = useState([{ label: "", link: "" }]);
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
    setLinks([{ label: "", link: "" }]);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = async(resource) => {
    setEditTarget(resource);
    const { data } = await getResourceById(resource._id);
    const fetchedResource = data?.data;
    setFormData({
      title: fetchedResource?.title,
      description: fetchedResource?.description || "",
    });
    setFiles(fetchedResource?.files || []);
     setLinks(
       fetchedResource?.links?.length > 0
         ? fetchedResource.links
         : [{ label: "", link: "" }],
     );
    setFormError("");
    setModalOpen(true);
  };

  const handleAddLink = () =>
    setLinks((prev) => [...prev, { label: "", link: "" }]);
  const handleRemoveLink = (i) =>
    setLinks((prev) => prev.filter((_, idx) => idx !== i));
  const handleLinkChange = (i, field, link) => {
    setLinks((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, [field]: link } : l)),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError("Title is required");
      return;
    }

    const validLinks = links.filter((l) => l.link.trim());

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
      files.filter(file => file instanceof File).forEach((file) => form.append("files", file));
      form.append("links", JSON.stringify(validLinks));
      if (editTarget) {
        const remainingDbFileIds = files.filter(file => !(file instanceof File)).map(file => file._id);
        form.append("remainingFiles", JSON.stringify(remainingDbFileIds));
      }

      let response;
      if (editTarget) {
        response = await updateResource(editTarget._id, form);
      } else {
        response = await createResource(moduleId, form);
      }

      setModalOpen(false);
      if(editTarget){
        setResources((prev) => prev.map((resource) => resource._id === editTarget._id ? response.data.data : resource));
      } else {
        setResources((prev) => [...prev, response.data.data]);
      }
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
      setResources((prev) => prev.filter((r) => r._id !== deleteTarget._id));
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
            return (
              <div
                key={resource._id}
                onClick={() =>
                  navigate(`/programs/modules/${moduleId}/resources/${resource._id}`)
                }
                className="cursor-pointer border rounded-xl hover:scale-102 p-4 hover:border-primary hover:shadow-sm transition-all duration-200 bg-background group"
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
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {resource.filesCount} file
                            {resource.filesCount > 1 ? "s" : ""}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {resource.linksCount} link
                            {resource.linksCount > 1 ? "s" : ""}
                          </Badge>
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
              <Textarea
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
                onChange={(e) =>
                  setFiles((prev) => [...prev, ...Array.from(e.target.files)])
                }
                disabled={formLoading}
                className="text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-border file:text-sm file:bg-background file:text-foreground hover:file:bg-accent cursor-pointer w-full"
              />
              {files.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {files.map((f, i) => (
                    <Badge key={f._id || `new-${i}`} variant="secondary" className="text-xs">
                      {f.name}
                      <button
                        type="button"
                        onClick={() =>
                          setFiles((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        disabled={formLoading}
                      >
                        <X size={12} />
                      </button>
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
                    value={link.label}
                    onChange={(e) =>
                      handleLinkChange(i, "label", e.target.value)
                    }
                    disabled={formLoading}
                    className="flex-1"
                  />
                  <Input
                    placeholder="URL or text"
                    value={link.link}
                    onChange={(e) =>
                      handleLinkChange(i, "link", e.target.value)
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

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// ─── Assignments Section ─────────────────────────────────────────
const AssignmentsSection = ({ moduleId, programId, navigate }) => {
  const { hasPermission } = usePermission();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [batches, setBatches] = useState([]);

  // create/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    totalMarks: "100",
    batch: "",
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

      if (hasPermission("assignment:create") || hasPermission("assignment:update")) {
        const { data: batchesData } = await getAllBatches(programId);
        setBatches(batchesData.data);
      }
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
    setFormData({ title: "", description: "", totalMarks: "100", batch: "none", dueDate: "" });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (assignment) => {
    setEditTarget(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description || "",
      totalMarks: assignment.totalMarks?.toString() || "100",
      batch: assignment.batch?._id || assignment.batch || "none",
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
      const isNoBatch = formData.batch === "none" || !formData.batch;
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        totalMarks: Number(formData.totalMarks),
        batch: isNoBatch ? null : formData.batch,
        dueDate: isNoBatch ? null : formData.dueDate,
        ...(!editTarget && { module: moduleId }),
      };

      let response;
      if (editTarget) {
       response = await updateAssignment(editTarget._id, payload);
      } else {
        response = await createAssignment(moduleId ,payload);
      }

      setModalOpen(false);
      if(editTarget){
        setAssignments((prev) => prev.map((assignment) => assignment._id === editTarget._id ? response.data.data : assignment));
      } else {
        setAssignments((prev) => [...prev, response.data.data]);
      }
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
      setAssignments((prev) => prev.filter((a) => a._id !== deleteTarget._id));
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
              className="cursor-pointer hover:scale-102 border rounded-xl p-4 hover:border-primary hover:shadow-sm transition-all duration-200 bg-background group w-full"
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
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                      {assignment.createdBy?.username && (
                        <span>
                          Created by: <span className="font-medium text-foreground">{assignment.createdBy.username}</span>
                        </span>
                      )}
                      {assignment.batch?.name && (
                        <>
                          <span className="hidden sm:inline text-muted-foreground/50">•</span>
                          <span>
                            Batch: <span className="font-medium text-foreground">{assignment.batch.name}</span>
                          </span>
                        </>
                      )}
                      {assignment.dueDate && (
                        <>
                          <span className="hidden sm:inline text-muted-foreground/50">•</span>
                          <span>
                            Due: <span className="font-medium text-foreground">{formatDate(assignment.dueDate)}</span>
                          </span>
                        </>
                      )}
                    </div>
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
              <Textarea
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Batch</Label>
                <Select
                  value={formData.batch}
                  onValueChange={(value) =>
                    setFormData((p) => ({
                      ...p,
                      batch: value,
                      dueDate: value === "none" || !value ? "" : p.dueDate,
                    }))
                  }
                  disabled={formLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (No Batch)</SelectItem>
                    {batches.map((batch) => (
                      <SelectItem key={batch._id} value={batch._id}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due-Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, dueDate: e.target.value }))
                  }
                  disabled={formLoading || !formData.batch || formData.batch === "none"}
                />
              </div>
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
  const { programId, moduleId } = useParams();
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
          Back to Modules
        </Button>
      </div>

      {/* Header Details */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{module.name}</h1>
        {module.description && (
          <p className="text-muted-foreground text-sm mt-1">
            {module.description}
          </p>
        )}
      </div>

      <ResourcesSection moduleId={moduleId} navigate={navigate} />

      <div className="border-t" />

      <AssignmentsSection moduleId={moduleId} programId={programId} navigate={navigate} />
    </div>
  );
};

export default ModuleDetailPage;
