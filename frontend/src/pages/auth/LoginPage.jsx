import { useState,} from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { setCredentials } from "@/features/auth/authSlice";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Moon, Sun, Monitor, Loader2, Eye, EyeOff } from "lucide-react";

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);


  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(""); // clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/auth/login", formData);
      const permissions = data.data.user.role.permissions.map((p) => p.key);
      dispatch(
        setCredentials({
          user: data.data.user,
          permissions: permissions || [],
        }),
      );
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* theme toggle - top right */}
      <button
        onClick={cycleTheme}
        className="absolute top-4 right-4 p-2 rounded-md hover:bg-accent transition-colors text-foreground"
      >
        {theme === "light" && <Sun size={18} />}
        {theme === "dark" && <Moon size={18} />}
        {theme === "system" && <Monitor size={18} />}
      </button>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">LMS Portal</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* error message */}
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {/* password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* submit */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
