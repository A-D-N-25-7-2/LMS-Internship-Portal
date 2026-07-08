import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useAuth } from "@/hooks/useAuth";
import {
  setCredentials,
  getCurrentUser,
  updateAccountDetails,
  changeCurrentPassword,
  removeAvatar,
} from "@/features/auth/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Camera, X } from "lucide-react";

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

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // profile form
  const [username, setUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const fileInputRef = useRef(null);

  // password form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getCurrentUser();
      const { user: fetchedUser, permissions } = res.data.data;
      dispatch(setCredentials({ user: fetchedUser, permissions }));
      setUsername(fetchedUser.username || "");
      setAvatarPreview(getAvatarDataUrl(fetchedUser.avatar));
    } catch {
      setError("Failed to load profile. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setProfileSuccess("");
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (!username.trim()) {
      setProfileError("Username cannot be empty.");
      return;
    }

    const formData = new FormData();
    formData.append("username", username.trim());
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    setProfileLoading(true);
    try {
      const res = await updateAccountDetails(formData);
      const updatedUser = res.data.data;
      dispatch(
        setCredentials({
          user: { ...user, ...updatedUser },
          permissions: user?.role?.permissions?.map((p) => p.key) || [],
        }),
      );
      setProfileSuccess("Profile updated successfully.");
      setAvatarFile(null);
    } catch (err) {
      setProfileError(
        err?.response?.data?.message || "Failed to update profile.",
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!oldPassword.trim() || !newPassword.trim()) {
      setPasswordError("Both old and new password are required.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      await changeCurrentPassword({ oldPassword, newPassword });
      setPasswordSuccess("Password changed successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(
        err?.response?.data?.message || "Failed to change password.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try{
      setProfileLoading(true)
      await removeAvatar();
      dispatch(
        setCredentials({
          user: { ...user, avatar: null },
          permissions: user?.role?.permissions?.map((p) => p.key) || [],
        }),
      );
      setAvatarPreview(null);
      setAvatarFile(null);
    }
    catch(err){
      console.log(err);
    }
    finally{
      setProfileLoading(false);
    }
  };

  const handleCancelOrRemoveAvatar = async () => {
    if (avatarFile) {
      setAvatarFile(null);
      setAvatarPreview(getAvatarDataUrl(user?.avatar));
    } else {
      await handleRemoveAvatar();
    }
  };

  const batchName = user?.batch?.name;
  const programs = Array.isArray(user?.program) ? user.program : [];
  const mentorBatches = Array.isArray(user?.mentorBatches)
    ? user.mentorBatches
    : [];

  return (
    <div className=" space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account details and password.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center gap-4">
              <div className="relative">
                <div className="relative group flex size-16 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="size-full object-cover hover:opacity-75 rounded-full"
                    />
                  ) : (
                    <span className="text-2xl">{user?.username?.[0]?.toUpperCase()}</span>
                  )}
                  {(avatarPreview && (!profileLoading)) && (
                    <button
                      title="Remove Avatar"
                      type="button"
                      className="absolute cursor-pointer rounded-full -top-1 -right-1 active:scale-60 transition-all duration-200 bg-secondary text-secondary-foreground text-xs font-bold p-1 opacity-0 group-hover:opacity-100" 
                      onClick={() => {
                        handleCancelOrRemoveAvatar();
                      }}
                    >
                      <X size={12}/>
                    </button>
                  )}
                </div>

                <div className="absolute -bottom-1 -right-1  flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"
                    aria-label="Change avatar"
                  >
                    <Camera className="size-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <p className="text-xs text-muted-foreground text-wrap">
                    Choose the avatar and save changes.
                  </p>
                </div>
              </div>
              <div className="flex-1">
                <CardTitle>{user?.username}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {user?.role?.name && (
                    <Badge variant="secondary">{user.role.name}</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="profile">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile details</CardTitle>
                  <CardDescription>
                    Update your username and profile photo.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          setProfileError("");
                        }}
                        placeholder="Your name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user?.email || ""} disabled />
                      <p className="text-xs text-muted-foreground">
                        Email can be only changed by administrators.
                      </p>
                    </div>

                    {batchName && (
                      <div className="space-y-1.5">
                        <Label>Batch</Label>
                        <Input value={batchName} disabled />
                        <p className="text-xs text-muted-foreground">
                          Batch is assigned by an administrator and cannot be
                          changed here.
                        </p>
                      </div>
                    )}

                    {mentorBatches.length > 0 && (
                      <div className="space-y-1.5">
                        <Label>
                          Mentor Batch{mentorBatches.length > 1 ? "es" : ""}
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                          {mentorBatches.map((b) => (
                            <Badge key={b._id || b} variant="outline">
                              {b.name || b}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Batch{mentorBatches.length > 1 ? "es" : ""} you mentor{" "}
                          {mentorBatches.length > 1 ? "are" : "is"} assigned by
                          an administrator and cannot be changed here.
                        </p>
                      </div>
                    )}

                    {programs.length > 0 && (
                      <div className="space-y-1.5">
                        <Label>Program{programs.length > 1 ? "s" : ""}</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {programs.map((p) => (
                            <Badge key={p._id || p} variant="outline">
                              {p.name || p}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Program{programs.length > 1 ? "s are" : " is"}{" "}
                          assigned by an administrator and cannot be changed
                          here.
                        </p>
                      </div>
                    )}

                    {profileError && (
                      <p className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md">
                        {profileError}
                      </p>
                    )}
                    {profileSuccess && (
                      <p className="bg-active/10 text-active text-sm px-4 py-3 rounded-md">
                        {profileSuccess}
                      </p>
                    )}

                    <div className="flex justify-end">
                      <Button type="submit" disabled={profileLoading}>
                        {profileLoading && (
                          <Loader2 className="size-4 animate-spin" />
                        )}
                        Save changes
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Change password</CardTitle>
                  <CardDescription>
                    Choose a strong password you don't use elsewhere.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="oldPassword">Current password</Label>
                      <Input
                        id="oldPassword"
                        type="password"
                        value={oldPassword}
                        onChange={(e) => {
                          setOldPassword(e.target.value);
                          setPasswordError("");
                        }}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-1.5">
                      <Label htmlFor="newPassword">New password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setPasswordError("");
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword">
                        Confirm new password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setPasswordError("");
                        }}
                      />
                    </div>

                    {passwordError && (
                      <p className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md">
                        {passwordError}
                      </p>
                    )}
                    {passwordSuccess && (
                      <p className="bg-active/10 text-active text-sm px-4 py-3 rounded-md">
                        {passwordSuccess}
                      </p>
                    )}

                    <div className="flex justify-end">
                      <Button type="submit" disabled={passwordLoading}>
                        {passwordLoading && (
                          <Loader2 className="size-4 animate-spin" />
                        )}
                        Update password
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
