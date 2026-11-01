import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

/** Shell for login / register / password pages: Ember logo, kit-style card. */
export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  const { t } = useLanguage();
  return (
    <main className="flex min-h-screen items-center justify-center bg-ember-section px-4 py-10">
      <div className="w-full max-w-[480px]">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" aria-label="Ember — home"><img src="/brand/ember-logo.svg" alt="Ember" className="h-[40px] w-auto" /></Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-black/60 hover:text-ember-orange">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />{t("back_to_home")}
          </Link>
        </div>
        <div className="overflow-hidden rounded-card border border-black bg-[#F9F9F9]">
          <div className="flex items-center gap-4 bg-ember-navy px-5 py-6 text-white sm:px-8 sm:py-7">
            <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-ember-orange" aria-hidden="true">
              <Icon className="h-6 w-6 text-white" />
            </span>
            <div className="min-w-0">
              <h1 className="break-words text-[22px] font-bold leading-tight sm:text-[24px]">{title}</h1>
              {subtitle && <p className="mt-1 text-[14px] text-white/75">{subtitle}</p>}
            </div>
          </div>
          <div className="p-8">{children}</div>
        </div>
        {footer && <p className="mt-6 text-center text-[15px] text-black/70">{footer}</p>}
      </div>
    </main>
  );
}
