import { usePermission } from "@/hooks/usePermission";

const PermissionGuard = ({ permission, children }) => {
  const { hasPermission } = usePermission();

  if (!hasPermission(permission)) return null;

  return children;
};

export default PermissionGuard;
