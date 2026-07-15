"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { RequireAuth } from "@/components/account/RequireAuth";
import { useAuthStore } from "@/store/authStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

function ProfileContent() {
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!user) return null;

  function handleSaveDetails() {
    login({ ...user!, name, phone, email: email || null, updatedAt: new Date().toISOString() });
    toast.success("Profile updated");
  }

  function handleUpdatePassword() {
    if (!currentPassword) {
      toast.error("Enter your current password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated");
  }

  return (
    <div className="mx-auto max-w-[1000px] px-4 pt-5 pb-14 sm:px-8 sm:pt-8">
      <div className="mb-1.5 text-[13px] text-muted-light">
        <Link href="/account">Account</Link> / <span className="text-ink">My Profile</span>
      </div>
      <h1 className="mb-5.5 text-2xl font-extrabold sm:text-[26px]">My Profile</h1>

      <div className="flex flex-wrap gap-6">
        <div className="min-w-[280px] flex-1 basis-[340px] rounded-[18px] border border-border-pink-light bg-white p-5.5">
          <h2 className="mb-3.5 text-[15px] font-bold">Personal Details</h2>
          <div className="flex flex-col gap-3">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input type="email" value={email ?? ""} onChange={(e) => setEmail(e.target.value)} />
            <Button variant="primary" onClick={handleSaveDetails}>
              Save Changes
            </Button>
          </div>
        </div>

        <div className="min-w-[280px] flex-1 basis-[340px] rounded-[18px] border border-border-pink-light bg-white p-5.5">
          <h2 className="mb-3.5 text-[15px] font-bold">Change Password</h2>
          <div className="flex flex-col gap-3">
            <Input type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            <Input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <Input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            <Button variant="secondary" onClick={handleUpdatePassword}>
              Update Password
            </Button>
          </div>
        </div>
      </div>

      <button type="button" onClick={logout} className="mt-6 text-[13.5px] font-bold text-muted-light">
        Log Out
      </button>
    </div>
  );
}
