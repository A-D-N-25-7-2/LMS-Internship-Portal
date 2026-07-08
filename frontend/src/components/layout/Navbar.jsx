import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { logout } from "@/features/auth/authSlice";
import api from "@/services/api";
import { Sun, Moon, Monitor, LogOut, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const getAvatarDataUrl = (avatar) => {
  if (!avatar?.data) return null;

  const rawData = avatar.data;
  let bytes;

  if (rawData instanceof Uint8Array) {
    bytes = rawData;
  } else if (Array.isArray(rawData)) {
    bytes = new Uint8Array(rawData);
  } else if (rawData?.type === "Buffer" && Array.isArray(rawData?.data)) {
    bytes = new Uint8Array(rawData.data);
  } else if (rawData?.data && Array.isArray(rawData.data)) {
    bytes = new Uint8Array(rawData.data);
  } else {
    return null;
  }

  if (!bytes?.length) return null;

  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return `data:${avatar.contentType || "image/jpeg"};base64,${btoa(binary)}`;
};

const Navbar = ({ onMenuClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    setAvatarPreview(getAvatarDataUrl(user?.avatar) || null);
  }, [user?.avatar]);

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // logout anyway even if request fails
    } finally {
      dispatch(logout());
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="h-14 border-b bg-background px-4 sm:px-6 flex items-center justify-between">
      {/* left - page context / mobile menu toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground lg:hidden"
          title="Open Menu"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* right - theme toggle + user info + logout */}
      <div className="flex items-center gap-3">
        {/* theme toggle */}
        {mounted && (
          <button
            onClick={cycleTheme}
            className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            title={`Theme: ${theme}`}
          >
            {theme === "light" && <Sun size={17} />}
            {theme === "dark" && <Moon size={17} />}
            {theme === "system" && <Monitor size={17} />}
          </button>
        )}

        {/* user info */}
        <div className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              user?.username?.[0]?.toUpperCase() || <User size={14} />
            )}
          </div>
          <span className="text-foreground font-medium hidden sm:block">
            {user?.username || "User"}
          </span>
        </div>

        {/* logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut size={16} />
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
