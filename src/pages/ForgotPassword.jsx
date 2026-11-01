import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, KeyRound } from "lucide-react";
import { base44, apiErrorMessage } from "@/api/base44Client";
import AuthLayout from "@/components/AuthLayout";
import { useLanguage } from "@/lib/LanguageContext";

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await base44.auth.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={KeyRound}
      title={t("reset_title")}
      subtitle={t("reset_subtitle")}
      footer={<Link to="/login" className="inline-flex items-center gap-1 font-semibold text-ember-orange hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{t("back_to_login")}</Link>}
    >
      {sent ? (
        <p className="text-center text-[15px]" role="status">{t("reset_sent")}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div role="alert" className="rounded-[10px] bg-ember-red/10 p-3 text-[14px] text-ember-red">{error}</div>}
          <div>
            <label htmlFor="email" className="mb-2 block pl-6 text-[14px] font-semibold text-ember-navy">{t("email")}</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-black/50" aria-hidden="true" />
              <input id="email" type="email" autoComplete="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" className="input-pill border-[#CFCFCF] bg-[#F6F6F6] pl-14 focus:bg-white" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-orange h-[57px] w-full text-[18px]">
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />{t("sending")}</> : t("send_reset_link")}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
