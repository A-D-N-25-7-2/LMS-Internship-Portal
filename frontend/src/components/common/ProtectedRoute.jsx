import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { usePermission } from "../../hooks/usePermission";

const ProtectedRoute = ({ permission, children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { hasPermission } = usePermission();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
