"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, KeyRound, Loader2, UserRound } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import { cardClass, inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";

type Account = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
};

export default function AccountPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    fetch("/api/account")
      .then((response) => response.json())
      .then((data) => {
        if (data.user) {
          setAccount(data.user);
          setName(data.user.name || "");
          setPhone(data.user.phone || "");
        }
      });
  }, []);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setProfileError(data.error || "مش قادرين نحفظ البيانات");
        return;
      }
      setProfileMessage("تم حفظ بيانات الحساب.");
    } catch {
      setProfileError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    if (newPassword !== confirmPassword) {
      setPasswordError("كلمتا المرور غير متطابقتين.");
      return;
    }
    setSavingPassword(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setPasswordError(data.error || "مش قادرين نغيّر كلمة المرور");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("تم تغيير كلمة المرور بنجاح.");
    } catch {
      setPasswordError("مشكلة في الاتصال، جرّب تاني.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <PageHeader
        backHref="/dashboard/stores"
        backLabel="كل المتاجر"
        eyebrow="حسابك"
        title="بيانات الحساب والأمان"
        subtitle="عدّل اسمك ورقمك، وغيّر كلمة المرور في أي وقت."
        icon={<UserRound className="h-6 w-6" />}
        action={
          <Link href="/dashboard/stores" className={secondaryBtn}>
            رجوع
          </Link>
        }
      />

      <div className="grid max-w-4xl gap-5 lg:grid-cols-2">
        <section className={`${cardClass} p-6`}>
          <h2 className="flex items-center gap-2 font-extrabold text-foreground">
            <UserRound className="h-4 w-4 text-primary" />
            البيانات الشخصية
          </h2>
          <p className="mt-1 text-[11px] text-muted">{account?.email}</p>

          <form onSubmit={saveProfile} className="mt-5 space-y-4">
            <div>
              <label className={labelClass}>الاسم</label>
              <input value={name} onChange={(event) => setName(event.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>رقم الموبايل / واتساب</label>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="01xxxxxxxxx"
                className={inputClass}
                dir="ltr"
              />
            </div>
            <div>
              <label className={labelClass}>البريد الإلكتروني</label>
              <input value={account?.email || ""} disabled className={`${inputClass} opacity-70`} dir="ltr" />
              <p className="mt-1 text-[10px] text-muted">البريد مربوط بالحساب. تواصل مع الدعم لو محتاج تغييره.</p>
            </div>

            {profileError && (
              <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
                {profileError}
              </div>
            )}
            {profileMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {profileMessage}
              </div>
            )}

            <button type="submit" disabled={savingProfile} className={`${primaryBtn} w-full justify-center`}>
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {savingProfile ? "بنحفظ..." : "حفظ البيانات"}
            </button>
          </form>
        </section>

        <section className={`${cardClass} p-6`}>
          <h2 className="flex items-center gap-2 font-extrabold text-foreground">
            <KeyRound className="h-4 w-4 text-primary" />
            تغيير كلمة المرور
          </h2>
          <p className="mt-1 text-[11px] text-muted">استخدم كلمة مرور قوية ومختلفة عن أي موقع تاني.</p>

          <form onSubmit={savePassword} className="mt-5 space-y-4">
            <div>
              <label className={labelClass}>كلمة المرور الحالية</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                className={inputClass}
                dir="ltr"
              />
            </div>
            <div>
              <label className={labelClass}>كلمة المرور الجديدة</label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={6}
                className={inputClass}
                dir="ltr"
              />
            </div>
            <div>
              <label className={labelClass}>تأكيد كلمة المرور</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={6}
                className={inputClass}
                dir="ltr"
              />
            </div>

            {passwordError && (
              <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
                {passwordError}
              </div>
            )}
            {passwordMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {passwordMessage}
              </div>
            )}

            <button type="submit" disabled={savingPassword} className={`${primaryBtn} w-full justify-center`}>
              {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {savingPassword ? "بنغيّر..." : "تغيير كلمة المرور"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
