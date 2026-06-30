import { NavLink } from "react-router-dom";
import { usePermission } from "@/hooks/usePermission";
import {
  LayoutDashboard,
  Users,
  Shield,
  BookOpen,
  Layers,
  Grid,
  FileText,
  ClipboardList,
  Upload,
  CalendarCheck,
  TrendingUp,
  User,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    permission: null,
  },
  { label: "Users", path: "/users", icon: Users, permission: "user:read" },
  { label: "Roles", path: "/roles", icon: Shield, permission: "role:read" },
  {
    label: "Programs",
    path: "/programs",
    icon: BookOpen,
    permission: "program:read",
  },
  {
    label: "Batches",
    path: "/batches",
    icon: Layers,
    permission: "batch:read",
  },
  { label: "Modules", path: "/modules", icon: Grid, permission: "module:read" },
  {
    label: "Resources",
    path: "/resources",
    icon: FileText,
    permission: "resource:read",
  },
  {
    label: "Assignments",
    path: "/assignments",
    icon: ClipboardList,
    permission: "assignment:read",
  },
  {
    label: "Submissions",
    path: "/submissions",
    icon: Upload,
    permission: "submission:read",
  },
  {
    label: "Attendance",
    path: "/attendance",
    icon: CalendarCheck,
    permission: "attendance:read",
  },
  { label: "Profile", path: "/profile", icon: User, permission: null },
];

const Sidebar = () => {
  const { hasPermission } = usePermission();

  return (
    <aside className="w-64 min-h-screen bg-background border-r flex flex-col">
      {/* logo */}
      <div className="px-6 py-5 border-b">
        <h1 className="text-lg font-bold text-foreground">LMS Portal</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Internship Management
        </p>
      </div>

      {/* nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems
          .filter(
            (item) =>
              item.permission === null || hasPermission(item.permission),
          )
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
