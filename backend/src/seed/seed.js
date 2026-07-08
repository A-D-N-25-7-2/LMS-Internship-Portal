import { Permission } from "../models/permission.models.js";
import { Role } from "../models/role.models.js";
import { User } from "../models/user.models.js";

const permissionsList = [
  { key: "user:create", resource: "user", label: "Create User" },
  { key: "user:read", resource: "user", label: "View Users" },
  { key: "user:update", resource: "user", label: "Update User" },
  { key: "user:delete", resource: "user", label: "Delete User" },
  { key: "role:create", resource: "role", label: "Create Role" },
  { key: "role:read", resource: "role", label: "View Roles" },
  { key: "role:update", resource: "role", label: "Update Role" },
  { key: "role:delete", resource: "role", label: "Delete Role" },
  { key: "program:create", resource: "program", label: "Create Program" },
  { key: "program:read", resource: "program", label: "View Programs" },
  { key: "program:update", resource: "program", label: "Update Program" },
  { key: "program:delete", resource: "program", label: "Delete Program" },
  { key: "batch:create", resource: "batch", label: "Create Batch" },
  { key: "batch:read", resource: "batch", label: "View Batches" },
  { key: "batch:update", resource: "batch", label: "Update Batch" },
  { key: "batch:delete", resource: "batch", label: "Delete Batch" },
  { key: "resource:create", resource: "resource", label: "Create Resource" },
  { key: "resource:read", resource: "resource", label: "View Resources" },
  { key: "resource:update", resource: "resource", label: "Update Resource" },
  { key: "resource:delete", resource: "resource", label: "Delete Resource" },
  {
    key: "assignment:create",
    resource: "assignment",
    label: "Create Assignment",
  },
  { key: "assignment:read", resource: "assignment", label: "View Assignments" },
  {
    key: "assignment:update",
    resource: "assignment",
    label: "Update Assignment",
  },
  {
    key: "assignment:delete",
    resource: "assignment",
    label: "Delete Assignment",
  },
  { key: "module:create", resource: "module", label: "Create Module" },
  { key: "module:read", resource: "module", label: "View Modules" },
  { key: "module:update", resource: "module", label: "Update Module" },
  { key: "module:delete", resource: "module", label: "Delete Module" },
  { key: "attendance:read", resource: "attendance", label: "View Attendance" },
  {
    key: "attendance:update",
    resource: "attendance",
    label: "Update Attendance",
  },
  {
    key: "submission:create",
    resource: "submission",
    label: "Create Submission",
  },
  { key: "submission:read", resource: "submission", label: "View Submission" },
  {
    key: "submission:update",
    resource: "submission",
    label: "Update Submission",
  },
  { key: "submission:delete", resource: "submission", label: "Delete Submission" },
  { key: "submission:grade", resource: "submission", label: "Grade Submission" },
  {key: "email:update" , resource: "email", label: "Update Email"},
  {key: "intern:update" , resource: "intern", label: "Update Intern"},
  {key: "college:create", resource: "college", label: "Create College"},
  {key: "college:read", resource: "college", label: "View College"},
  {key: "college:update", resource: "college", label: "Update College"},
  {key: "college:delete", resource: "college", label: "Delete College"},
];

const internPermissionsList = [
  {key: "assignment:read", resource: "assignment", label: "View Assignments"},
  {key: "program:read", resource: "program", label: "View Programs"},
  {key: "resource:read", resource: "resource", label: "View Resources"},
  {key: "module:read", resource: "module", label: "View Modules"},
  {key: "submission:create", resource: "submission", label: "Create Submission"},
  {key: "submission:update", resource: "submission", label: "Update Submission"},
  {key: "attendance:read", resource: "attendance", label: "View Attendance"},
];

const mentorPermissionsList = [
  {key: "assignment:create", resource: "assignment", label: "Create Assignment"},
  {key: "assignment:read", resource: "assignment", label: "View Assignments"},
  {key: "assignment:update", resource: "assignment", label: "Update Assignment"},
  {key: "assignment:delete", resource: "assignment", label: "Delete Assignment"},
  {key: "batch:read", resource: "batch", label: "View Batches"},
  {key: "intern:update", resource: "intern", label: "Update Intern"},
  {key: "module:read", resource: "module", label: "View Modules"},
  {key: "program:read", resource: "program", label: "View Programs"},
  {key: "resource:read", resource: "resource", label: "View Resources"},
  {key: "submission:read", resource: "submission", label: "View Submission"},
  {key: "submission:grade", resource: "submission", label: "Grade Submission"},
  {key: "submission:delete", resource: "submission", label: "Delete Submission"},
  {key: "attendance:read", resource: "attendance", label: "View Attendance"},
  {key: "attendance:update", resource: "attendance", label: "Update Attendance"},
];

export const seedDatabase = async () => {

  const createdPermissions = [];
  const internPermissions = [];
  const mentorPermissions = [];

  for (const perm of permissionsList) {
    const existing = await Permission.findOneAndUpdate(
      { key: perm.key },
      perm,
      { upsert: true, returnDocument: "after" },
    );
    createdPermissions.push(existing._id);
  }

  const superAdminRole = await Role.findOneAndUpdate(
    { name: "Super Admin" },
    {
      name: "Super Admin",
      description: "Full system access - cannot be modified",
      permissions: createdPermissions,
      isSystemRole: true,
    },
    { upsert: true, returnDocument: "after" },
  );

  for (const perm of internPermissionsList) {
    const existing = await Permission.findOneAndUpdate(
      { key: perm.key },
      perm,
      { upsert: true, returnDocument: "after" },
    );
    internPermissions.push(existing._id);
  }

  for (const perm of mentorPermissionsList) {
    const existing = await Permission.findOneAndUpdate(
      { key: perm.key },
      perm,
      { upsert: true, returnDocument: "after" },
    );
    mentorPermissions.push(existing._id);
  }
  
  await Role.findOneAndUpdate(
    { name: "Intern" },
    {
      name: "Intern",
      description: "Internship Portal",
      permissions: internPermissions,
      isSystemRole: false,
    },
    { upsert: true, returnDocument: "after" },
  );

  await Role.findOneAndUpdate(
    { name: "Mentor" },
    {
      name: "Mentor",
      description: "Mentor for the interns",
      permissions: mentorPermissions,
      isSystemRole: false,
    },
    { upsert: true, returnDocument: "after" },
  );

  const existingSuperAdmin = await User.findOne({ role: superAdminRole._id });
  if (!existingSuperAdmin) {
    await User.create({
      username: process.env.SUPER_ADMIN_USERNAME,
      email: process.env.SUPER_ADMIN_EMAIL,
      password: process.env.SUPER_ADMIN_PASSWORD,
      role: superAdminRole._id,
    });
    console.log("Super Admin created.");
  }

  console.log("Seeding complete.");
};
