import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44, apiErrorMessage } from "@/api/base44Client";
import { safeRedirectPath } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, User } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/LanguageContext";

const inputClass = "pl-11 h-14 rounded-2xl bg-muted/30 border-none";
const iconClass = "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground";

export default function Register() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirectPath(searchParams.get("redirect"));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError(t("password_too_short"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("passwords_mismatch"));
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password, full_name: name });
      setShowOtp(true);
      toast({ title: t("code_sent"), description: t("check_inbox") });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (otpCode.length < 6) return;
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      toast({ title: t("success"), description: t("email_verified") });
      window.location.href = redirectTo;
    } catch (err) {
      setError(apiErrorMessage(err));
      setOtpCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: t("new_code_sent"), description: t("check_inbox") });
    } catch (err) {
      toast({ title: t("resend_failed"), description: apiErrorMessage(err), variant: "destructive" });
    }
  };

  if (showOtp) {
    return (
      <AuthLayout icon={Mail} title={t("verify_email")} subtitle={t("code_sent_to", { email })}>
        {error && (
          <div role="alert" className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center font-medium">
            {error}
          </div>
        )}
        <form onSubmit={handleVerify}>
          <div className="flex justify-center mb-8">
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={setOtpCode}
              autoFocus
              autoComplete="one-time-code"
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <InputOTPSlot key={i} index={i} className="w-12 h-14 text-xl font-bold border-2 rounded-xl" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button
            type="submit"
            className="w-full h-14 font-bold rounded-2xl bg-primary text-white text-lg shadow-xl shadow-primary/20"
            disabled={loading || otpCode.length < 6}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                {t("verifying")}
              </>
            ) : (
              t("verify_account")
            )}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          {t("no_code")}{" "}
          <button type="button" onClick={handleResend} className="text-primary font-bold hover:underline">
            {t("resend")}
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title={t("create_account_title")}
      subtitle={t("register_subtitle")}
      footer={
        <>
          {t("have_account")}{" "}
          <Link to={`/login${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`} className="text-primary font-bold hover:underline">
            {t("log_in")}
          </Link>
        </>
      }
    >
      {error && (
        <div role="alert" className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">{t("full_name")}</Label>
          <div className="relative">
            <User className={iconClass} aria-hidden="true" />
            <Input
              id="name"
              autoComplete="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              maxLength={100}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <div className="relative">
            <Mail className={iconClass} aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <div className="relative">
            <Lock className={iconClass} aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              minLength={8}
              maxLength={128}
              aria-describedby="password-hint"
              required
            />
          </div>
          <p id="password-hint" className="text-xs text-muted-foreground">{t("password_hint")}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">{t("confirm_password")}</Label>
          <div className="relative">
            <Lock className={iconClass} aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-14 font-bold rounded-2xl bg-primary text-white text-lg shadow-xl shadow-primary/20 mt-4" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
              {t("creating_account")}
            </>
          ) : (
            t("create_account")
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
