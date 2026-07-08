import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { heartbeat } from "@/features/attendance/attendanceApi";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user || user.role?.name !== "Intern") return;

    let lastActivityTime = Date.now();
    const IDLE_TIMEOUT_MS = 60 * 1000;

    const updateActivity = () => {
      lastActivityTime = Date.now();
    };

    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    activityEvents.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    const sendHeartbeat = async () => {
      const isIdle = Date.now() - lastActivityTime > IDLE_TIMEOUT_MS;
      if (document.visibilityState === "visible" && !isIdle) {
        try {
          await heartbeat();
        } catch (err) {
          console.error("Attendance heartbeat failed:", err);
        }
      }
    };

    // Initial heartbeat
    sendHeartbeat();

    // Accumulate active seconds every 30s
    const interval = setInterval(sendHeartbeat, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [user]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-10">
          <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        </div>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
