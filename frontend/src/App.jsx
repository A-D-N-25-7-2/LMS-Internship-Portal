import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import UsersPage from "./pages/users/UsersPage";
import RolesPage from "./pages/roles/RolesPage";
import ProgramsPage from "./pages/programs/ProgramsPage";
import BatchesPage from "./pages/batches/BatchesPage";
import ModulesPage from "./pages/modules/ModulesPage";
import ResourcesPage from "./pages/resources/ResourcesPage";
import AssignmentsPage from "./pages/assignments/AssignmentsPage";
import SubmissionsPage from "./pages/submissions/SubmissionsPage";
import AttendancePage from "./pages/attendance/AttendancePage";
import ProfilePage from "./pages/profile/ProfilePage";
import ProgramDetailPage from "./pages/programs/ProgramDetailPage";
import ModuleDetailPage from "./pages/modules/ModuleDetailPage";
import { getCurrentUser, setCredentials } from "./features/auth/authSlice";
import { useEffect } from "react";

const App = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

 
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
            path="batches"
            element={
              <ProtectedRoute permission="batch:read">
                <BatchesPage />
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
            path="modules/:moduleId"
            element={
              <ProtectedRoute permission="module:read">
                <ModuleDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="resources"
            element={
              <ProtectedRoute permission="resource:read">
                <ResourcesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="assignments"
            element={
              <ProtectedRoute permission="assignment:read">
                <AssignmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="submissions"
            element={
              <ProtectedRoute permission="submission:read">
                <SubmissionsPage />
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