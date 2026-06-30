import { useEffect, useState } from "react";
import {
  getAllUsers,
  createUser,
  updateUser,
  toggleUserActive,
  deleteUser,
  getAllRoles,
  getAllBatches,
  getAllPrograms,
} from "@/features/users/userApi";
import { usePermission } from "@/hooks/usePermission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, Plus, UserX, UserCheck, Trash2, Pencil } from "lucide-react";

const initialForm = {
  username: "",
  email: "",
  password: "",
  role: "",
  program: [],
  batch: "",
  mentorBatches: [],
};

const UsersPage = () => {
  const { hasPermission } = usePermission();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [batches, setBatches] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // create/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // toggle loading per user
  const [togglingId, setTogglingId] = useState(null);

  // fetch users + roles
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, rolesRes, batchesRes, programRes] = await Promise.all([
        getAllUsers(),
        getAllRoles(),
        getAllBatches(),
        getAllPrograms(),
      ]);
      setUsers(usersRes.data.data);
      setRoles(rolesRes.data.data);
      setBatches(batchesRes.data.data);
      setPrograms(programRes.data.data);
    } catch {
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  //getting role id using role name
  const getRoleId = (name) => roles.find((role) => role.name === name)?._id;

  // handle form input change
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError("");
  };

  // handle role select
  const handleRoleSelect = (value) => {
    setFormData((prev) => ({ ...prev, role: value }));
    setFormError("");
  };

  // handle batch select
  const handleBatchSelect = (value) => {
    setFormData((prev) => ({ ...prev, batch: value }));
    setFormError("");
  };

  // handle mentor batches select
  const handleMentorBatchSelect = (value) => {
    setFormData((prev) => {
      if (prev.mentorBatches.includes(value)) return prev; // avoid duplicates
      return { ...prev, mentorBatches: [...prev.mentorBatches, value] };
    });
  };

  //handle mentor batches delete
  const handleMentorBatchDelete = (value) => {
    setFormData((prev) => ({
      ...prev,
      mentorBatches: prev.mentorBatches.filter((id) => id !== value),
    }));
  };

  // handle mentor batches select
  const handleProgramSelect = (value) => {
    setFormData((prev) => {
      if (prev.program.includes(value)) return prev; // avoid duplicates
      return { ...prev, program: [...prev.program, value] };
    });
  };

  //handle mentor batches delete
  const handleProgramDelete = (value) => {
    setFormData((prev) => ({
      ...prev,
      program: prev.program.filter((id) => id !== value),
    }));
  };

  // open create modal
  const openCreateModal = () => {
    setEditTarget(null);
    setFormData(initialForm);
    setFormError("");
    setModalOpen(true);
  };

  // open edit modal
  const openEditModal = (user) => {
    setEditTarget(user);
    setFormData({
      username: user.username,
      role: user.role?._id,
      program: user.program?.map((p) => p._id) || [],
      batch: user.batch?._id || `${user.role.name === "Intern" ? "None" : ""}`,
      mentorBatches: user.mentorBatches?.map((b) => b._id) || [],
    });
    setFormError("");
    setModalOpen(true);
  };

  // create/edit user submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editTarget && (!formData.username.trim() || !formData.role)) {
      setFormError("All fields are required");
      return;
    }

    if (
      !editTarget &&
      (!formData.username.trim() ||
        !formData.email.trim() ||
        !formData.password.trim() ||
        !formData.role)
    ) {
      setFormError("All fields are required");
      return;
    }

    setFormLoading(true);
    setFormError("");
    if(formData.batch === "None"){
      formData.batch = "";
    }
    if(formData.batch !== ""){
      formData.program = [];
    }
    try {
      if (!editTarget) {
        await createUser(formData);
      } else {
        const { email, password, ...editData } = formData;
        await updateUser(editTarget._id, editData);
      }
      setModalOpen(false);
      setFormData(initialForm);
      fetchData(); // refresh list
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          (editTarget ? "Failed to edit user" : "Failed to create user"),
      );
    } finally {
      setFormLoading(false);
    }
  };

  // toggle active/inactive
  const handleToggleActive = async (_id) => {
    setTogglingId(_id);
    try {
      await toggleUserActive(_id);
      fetchData();
    } catch (err) {
      console.log(err);
    } finally {
      setTogglingId(null);
    }
  };

  // delete user
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteUser(deleteTarget._id);
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      console.log(error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const showActions = hasPermission("user:update") || hasPermission("user:delete")
  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage all users and their roles
          </p>
        </div>

        {hasPermission("user:create") && (
          <Button onClick={openCreateModal}>
            <Plus size={16} className="mr-2" />
            Create User
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
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No users found. Create one to get started.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Status</TableHead>
                {showActions &&
                <TableHead className="text-right">Actions</TableHead>
}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.role?.name || "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.batch?.name || "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "active" : "inactive"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  {showActions &&
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* toggle active */}
                      {hasPermission("user:update") &&
                        !user.role?.isSystemRole && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditModal(user)}
                            title="Edit user"
                          >
                            <Pencil size={15} />
                          </Button>
                        )}

                      {/* toggle active */}
                      {hasPermission("user:update") &&
                        !user.role?.isSystemRole && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleToggleActive(user._id)}
                            disabled={togglingId === user._id}
                            title={user.isActive ? "Deactivate" : "Activate"}
                          >
                            {togglingId === user._id ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : user.isActive ? (
                              <UserX size={15} className="text-destructive" />
                            ) : (
                              <UserCheck size={15} className="text-green-500" />
                            )}
                          </Button>
                        )}

                      {/* delete */}
                      {hasPermission("user:delete") &&
                        !user.role?.isSystemRole && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteTarget(user)}
                            title="Delete user"
                          >
                            <Trash2 size={15} className="text-destructive" />
                          </Button>
                        )}
                      {user.role?.isSystemRole && (
                        <span className="text-xs text-muted-foreground pr-2">
                          Protected
                        </span>
                      )}
                    </div>
                  </TableCell>
              }
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* create/edit user modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setFormData(initialForm);
            setFormError("");
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
              {editTarget ? `Edit User Details` : "Create New User"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {formError && (
              <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md">
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                name="username"
                placeholder="e.g. john_doe"
                value={formData.username}
                onChange={handleChange}
                disabled={formLoading}
              />
            </div>
            {!editTarget && (
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={formLoading}
                />
              </div>
            )}

            {!editTarget && (
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  name="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={formLoading}
                />
              </div>
            )}
            <div className="flex justify-between">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={handleRoleSelect}
                  disabled={formLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role._id} value={role._id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.role === getRoleId("Intern") && (
                <div className="space-y-2">
                  <Label>Batch</Label>
                  <Select
                    value={formData.batch}
                    onValueChange={handleBatchSelect}
                    disabled={formLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a Batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={"None"}>None</SelectItem>
                      {batches.map((batch) => (
                        <SelectItem key={batch._id} value={batch._id}>
                          {batch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {formData.role === getRoleId("Mentor") && (
              <div className="space-y-2">
                <Label>Mentor Batches</Label>
                <Select
                  value=""
                  onValueChange={handleMentorBatchSelect}
                  disabled={formLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add a batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches
                      .filter((b) => !formData.mentorBatches.includes(b._id))
                      .map((batch) => (
                        <SelectItem key={batch._id} value={batch._id}>
                          {batch.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {/* Show selected batches as removable badges */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.mentorBatches.map((id) => {
                    const batch = batches.find((b) => b._id === id);
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="cursor-pointer gap-1"
                      >
                        {batch?.name}
                        <span
                          onClick={() => handleMentorBatchDelete(id)}
                          className="ml-1 hover:text-destructive"
                        >
                          ✕
                        </span>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
 
            {(formData.role === getRoleId("Intern") && formData.batch === "None") && (
              <div className="space-y-2">
                <Label>Programs</Label>
                <Select
                  value=""
                  onValueChange={handleProgramSelect}
                  disabled={formLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add a program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs
                      .filter((p) => !formData.program.includes(p._id))
                      .map((program) => (
                        <SelectItem key={program._id} value={program._id}>
                          {program.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {/* Show selected programs as removable badges */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.program.map((id) => {
                    const program = programs.find((p) => p._id === id);
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="cursor-pointer gap-1"
                      >
                        {program?.name}
                        <span
                          onClick={() => handleProgramDelete(id)}
                          className="ml-1 hover:text-destructive"
                        >
                          ✕
                        </span>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
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
                    ? "Editing..."
                    : "Creating..."
                  : editTarget
                    ? "Edit User"
                    : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* delete confirm dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.username}
              </span>
              ? This action cannot be undone.
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

export default UsersPage;
