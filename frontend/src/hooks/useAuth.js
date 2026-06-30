import { useSelector } from "react-redux";

export const useAuth = () => {
  const { user, isAuthenticated, permissions } = useSelector(
    (state) => state.auth,
  );
  return { user, isAuthenticated, permissions };
};
