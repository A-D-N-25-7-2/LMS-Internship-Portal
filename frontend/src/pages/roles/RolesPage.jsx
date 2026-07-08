import { useEffect, useState } from "react";
import {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
} from "@/features/roles/roleApi";
import { getAllPermissions } from "@/features/permissions/permissionApi";
import { usePermission } from "@/hooks/usePermission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Loader2, Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { useSelector } from "react-redux";

const RolesPage = () => {
  const { hasPermission } = usePermission();
  const user = useSelector((state) => state.auth.user);

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]); // flat list
  const [groupedPermissions, setGroupedPermissions] = useState({}); // grouped by resource
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // create/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create, object = edit
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]); // array of permission _ids
  const [isSystemRole, setIsSystemRole] = useState(false);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // fetch roles + permissions
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [rolesRes, permsRes] = await Promise.all([
        getAllRoles(),
        getAllPermissions(),
      ]);

      setRoles(rolesRes.data.data);

      const perms = permsRes.data.data;
      setPermissions(perms);

      // group permissions by resource
      // e.g. { user: [...], role: [...], program: [...] }
      const grouped = perms.reduce((acc, perm) => {
        if (!acc[perm.resource]) acc[perm.resource] = [];
        acc[perm.resource].push(perm);
        return acc;
      }, {});
      setGroupedPermissions(grouped);
    } catch {
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // open create modal
  const openCreateModal = () => {
    setEditTarget(null);
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissions([]);
    setFormError("");
    setModalOpen(true);
  };

  // open edit modal
  const openEditModal = (role) => {
    setEditTarget(role);
    setRoleName(role.name);
    setRoleDescription(role.description);
    setSelectedPermissions(role.permissions.map((p) => p._id));
    setIsSystemRole(role.isSystemRole || false);
    setFormError("");
    setModalOpen(true);
  };

  // toggle individual permission checkbox
  const togglePermission = (permId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId],
    );
  };

  // toggle all permissions in a resource group
  const toggleResourceGroup = (resource) => {
    const resourcePermIds = groupedPermissions[resource].map((p) => p._id);
    const allSelected = resourcePermIds.every((id) =>
      selectedPermissions.includes(id),
    );

    if (allSelected) {
      // deselect all in this group
      setSelectedPermissions((prev) =>
        prev.filter((id) => !resourcePermIds.includes(id)),
      );
    } else {
      // select all in this group
      setSelectedPermissions((prev) => [
        ...prev,
        ...resourcePermIds.filter((id) => !prev.includes(id)),
      ]);
    }
  };

  // submit create/edit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!roleName.trim()) {
      setFormError("Role name is required");
      return;
    }
    if (selectedPermissions.length === 0) {
      setFormError("At least one permission must be selected");
      return;
    }

    setFormLoading(true);
    setFormError("");

    try {
      let response;
      if (editTarget) {
        response = await updateRole(editTarget._id, {
          name: roleName.trim(),
          description: roleDescription.trim(),
          permissions: selectedPermissions,
          isSystemRole: isSystemRole,
        });
        setRoles((prev) => prev.map((role) => role._id === editTarget._id ? response.data.data : role));
      } else {
        response = await createRole({
          name: roleName.trim(),
          description: roleDescription.trim(),
          permissions: selectedPermissions,
          isSystemRole: isSystemRole,
        });
        setRoles((prev) => [...prev, response.data.data]);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.message || "Operation failed");
    } finally {
      setFormLoading(false);
    }
  };

  // delete role
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteRole(deleteTarget._id);
      setDeleteTarget(null);
      setRoles((prev) => prev.filter((role) => role._id !== deleteTarget._id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete role");
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
          <h1 className="text-2xl font-bold text-foreground">Roles</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage roles and their permissions
          </p>
        </div>

        {hasPermission("role:create") && (
          <Button onClick={openCreateModal}>
            <Plus size={16} className="mr-2" />
            Create Role
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
      ) : roles.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No roles found. Create one to get started.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <ShieldCheck
                        size={15}
                        className="text-muted-foreground"
                      />
                      {role.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {role.permissions?.slice(0, 3).map((p) => (
                        <Badge
                          key={p._id}
                          variant="outline"
                          className="text-xs"
                        >
                          {p.key}
                        </Badge>
                      ))}
                      {role.permissions?.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{role.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {role.isSystemRole ? (
                      <Badge variant="default">System</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* edit - blocked for system roles */}
                      {((hasPermission("role:update") && !role.isSystemRole) ||
                        user?.role?.name === "Super Admin") && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditModal(role)}
                          title="Edit role"
                        >
                          <Pencil size={15} />
                        </Button>
                      )}

                      {/* delete - blocked for system roles */}
                      {((hasPermission("role:delete") && !role.isSystemRole) ||
                        user?.role?.name === "Super Admin") && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteTarget(role)}
                          title="Delete role"
                        >
                          <Trash2 size={15} className="text-destructive" />
                        </Button>
                      )}

                      {/* system role - no actions */}
                      {role.isSystemRole &&
                        user.role.name !== "Super Admin" && (
                          <span className="text-xs text-muted-foreground pr-2">
                            Protected
                          </span>
                        )}
                    </div>
                  </TableCell>
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
            setRoleName("");
            setSelectedPermissions([]);
            setFormError("");
            setEditTarget(null);
          }
        }}
      >
        <DialogContent
          onOpenAutoFocus={(e) => {
            e.preventDefault();
          }}
          className="max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {editTarget ? `Edit Role: ${editTarget.name}` : "Create New Role"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            {formError && (
              <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md">
                {formError}
              </div>
            )}
            <div className = "flex gap-4">
              {/* role name */}
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input
                  placeholder="e.g. Mentor, Content Manager"
                  value={roleName}
                  onChange={(e) => {
                    setRoleName(e.target.value);
                    setFormError("");
                  }}
                  disabled={formLoading}
                />
              </div>

              {/* System Role Toggle */}
              {user.role.name === "Super Admin" && (
              <div className="space-y-2 items-center flex flex-col">
                <Label>System Role</Label>
                <Switch
                  checked={isSystemRole}
                  onCheckedChange={(checked) => {
                    setIsSystemRole(checked);
                    setFormError("");
                  }}
                  disabled={formLoading}
                />
              </div>
              )}
            </div>
            {/* Description */}
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="You can write about the role here.."
                value={roleDescription}
                onChange={(e) => {
                  setRoleDescription(e.target.value);
                  setFormError("");
                }}
                disabled={formLoading}
              />
            </div>
            <Separator />

            {/* permissions - grouped by resource */}
            <div className="space-y-4">
              <Label>
                Permissions
                <span className="text-muted-foreground font-normal ml-2">
                  ({selectedPermissions.length} selected)
                </span>
              </Label>

              {Object.entries(groupedPermissions).map(([resource, perms]) => {
                const allSelected = perms.every((p) =>
                  selectedPermissions.includes(p._id),
                );
                const someSelected = perms.some((p) =>
                  selectedPermissions.includes(p._id),
                );

                return (
                  <div key={resource} className="space-y-2">
                    {/* resource group header - select all toggle */}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`group-${resource}`}
                        checked={allSelected}
                        ref={(el) => {
                          if (el)
                            el.indeterminate = someSelected && !allSelected;
                        }}
                        onCheckedChange={() => toggleResourceGroup(resource)}
                        disabled={formLoading}
                      />
                      <label
                        htmlFor={`group-${resource}`}
                        className="text-sm font-semibold capitalize cursor-pointer text-foreground"
                      >
                        {resource}
                      </label>
                    </div>

                    {/* individual permissions in this group */}
                    <div className="ml-6 grid grid-cols-2 gap-2">
                      {perms.map((perm) => (
                        <div key={perm._id} className="flex items-center gap-2">
                          <Checkbox
                            id={perm._id}
                            checked={selectedPermissions.includes(perm._id)}
                            onCheckedChange={() => togglePermission(perm._id)}
                            disabled={formLoading}
                          />
                          <label
                            htmlFor={perm._id}
                            className="text-sm text-muted-foreground cursor-pointer"
                          >
                            {perm.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
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
                    : "Create Role"}
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
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.name}
              </span>
              ? Any users assigned this role will lose their permissions.
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

export default RolesPage;
