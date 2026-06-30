import { useSelector } from "react-redux";

export const usePermission = () => {
  const permissions = useSelector((state) => state.auth.permissions);

  const hasPermission = (permission) => {
    if (!permission) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (...perms) =>
    perms.some((p) => permissions.includes(p));

  const hasAllPermissions = (...perms) =>
    perms.every((p) => permissions.includes(p));

  return { hasPermission, hasAnyPermission, hasAllPermissions };
};
