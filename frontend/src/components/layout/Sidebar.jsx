import { NavLink } from "react-router-dom";
import { usePermission } from "@/hooks/usePermission";
import {
  LayoutDashboard,
  Users,
  Shield,
  BookOpen,
  CalendarCheck,
  User,
  X,
  School,
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
    label: "Colleges",
    path: "/colleges",
    icon: School,
    permission: "college:read",
  },
  {
    label: "Attendance",
    path: "/attendance",
    icon: CalendarCheck,
    permission: "attendance:read",
  },
  { label: "Profile", path: "/profile", icon: User, permission: null },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { hasPermission } = usePermission();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r flex flex-col transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* logo */}
        <div className="px-6 py-5 border-b flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">LMS Portal</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Internship Management
            </p>
          </div>
          {/* Close Menu Button on Mobile */}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground lg:hidden"
            title="Close Menu"
          >
            <X size={18} />
          </button>
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
                onClick={() => setIsOpen(false)}
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
    </>
  );
};

export default Sidebar;
