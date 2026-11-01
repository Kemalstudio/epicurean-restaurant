import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import { base44, apiErrorMessage } from "@/api/base44Client";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/LanguageContext";

const inputCls = "input-pill border-[#CFCFCF] bg-[#F6F6F6] pl-14 focus:bg-white";

export default function ResetPassword() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError(t("password_too_short"));
    if (password !== confirm) return setError(t("passwords_mismatch"));
    setLoading(true);
    try {
      await base44.auth.resetPassword(token, password);
      toast({ title: t("password_changed"), description: t("password_changed_desc") });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout icon={AlertTriangle} title={t("reset_invalid_title")} subtitle={t("reset_invalid_desc")}
        footer={<Link to="/forgot-password" className="font-semibold text-ember-orange hover:underline">{t("request_new_link")}</Link>}>
        <p className="text-center text-[15px]">{t("reset_invalid_desc")}</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={Lock} title={t("new_password_title")} subtitle={t("new_password_subtitle")}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div role="alert" className="rounded-[10px] bg-ember-red/10 p-3 text-[14px] text-ember-red">{error}</div>}
        {[["password", t("password"), password, setPassword], ["confirm", t("confirm_password"), confirm, setConfirm]].map(([id, label, value, set]) => (
          <div key={id}>
            <label htmlFor={id} className="mb-2 block pl-6 text-[14px] font-semibold text-ember-navy">{label}</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-black/50" aria-hidden="true" />
              <input id={id} type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={value} onChange={(e) => set(e.target.value)} className={inputCls} />
            </div>
          </div>
        ))}
        <p className="pl-6 text-[13px] text-black/60">{t("password_hint")}</p>
        <button type="submit" disabled={loading} className="btn-orange h-[57px] w-full text-[18px]">
          {loading ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />{t("saving")}</> : t("save_password")}
        </button>
      </form>
    </AuthLayout>
  );
}
