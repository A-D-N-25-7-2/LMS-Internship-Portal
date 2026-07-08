import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import UsersPage from "./pages/users/UsersPage";
import RolesPage from "./pages/roles/RolesPage";
import ProgramsPage from "./pages/programs/ProgramsPage";
import BatchInternsPage from "./pages/batches/BatchInternsPage";
import AttendancePage from "./pages/attendance/AttendancePage";
import ProfilePage from "./pages/profile/ProfilePage";
import ProgramDetailPage from "./pages/programs/ProgramDetailPage";
import ModuleDetailPage from "./pages/modules/ModuleDetailPage";
import ResourceDetailPage from "./pages/resources/ResourceDetailPage";
import AssignmentDetailPage from "./pages/assignments/AssignmentDetailPage";
import CollegePage from "./pages/colleges/CollegePage";
import { getCurrentUser, setCredentials, logout } from "./features/auth/authSlice";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await getCurrentUser();
        const { user, permissions } = res.data.data;
        dispatch(setCredentials({ user, permissions }));
      } catch {
        dispatch(logout());
      } finally {
        setAuthChecked(true);
      }
    };
    initAuth();
  }, [dispatch]);

   if (!authChecked) {
     return (
       <div className="flex h-screen items-center justify-center">
         <Loader2 className="size-6 animate-spin text-muted-foreground" />
       </div>
     );
   }
 
  return (
    <BrowserRouter>
      <Routes>
        {/* public route */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage />
            )
          }
        />

        {/* protected routes - all inside Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />

          <Route
            path="users"
            element={
              <ProtectedRoute permission="user:read">
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="roles"
            element={
              <ProtectedRoute permission="role:read">
                <RolesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="programs"
            element={
              <ProtectedRoute permission="program:read">
                <ProgramsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="colleges"
            element={
              <ProtectedRoute permission="college:read">
                <CollegePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="programs/:programId"
            element={
              <ProtectedRoute permission="program:read">
                <ProgramDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="programs/:programId/modules/:moduleId"
            element={
              <ProtectedRoute permission="module:read">
                <ModuleDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/programs/modules/:moduleId/resources/:resourceId"
            element={
              <ProtectedRoute permission="resource:read">
                <ResourceDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/modules/:moduleId/assignments/:assignmentId"
            element={
              <ProtectedRoute permission="assignment:read">
                <AssignmentDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="programs/:programId/batches/:batchId"
            element={
              <ProtectedRoute permission="batch:read">
                <BatchInternsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="attendance"
            element={
              <ProtectedRoute permission="attendance:read">
                <AttendancePage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;