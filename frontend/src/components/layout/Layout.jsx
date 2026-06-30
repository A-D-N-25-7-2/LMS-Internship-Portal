import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-background">
      {/* sidebar */}
      <aside className="h-screen sticky top-0 shrink-0">
        <Sidebar />
      </aside>

      {/* main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-10">
          <Navbar />
        </div>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
