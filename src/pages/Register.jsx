import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";

export default function Register() {
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
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
      toast({
        title: "Code sent!",
        description: "Please check your email inbox.",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      toast({
        title: "Success!",
        description: "Your email has been verified.",
      });
      window.location.href = "/";
    } catch (err) {
      setError(err.response?.data?.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.register({ email, password });
      toast({
        title: "New code sent",
        description: "Check your email for the new code.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to resend code",
        variant: "destructive"
      });
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  if (showOtp) {
    return (
        <AuthLayout
            icon={Mail}
            title="Verify your email"
            subtitle={`We sent a code to ${email}`}
        >
          {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center font-medium">
                {error}
              </div>
          )}
          <div className="flex justify-center mb-8">
            <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
                autoFocus
                autoComplete="one-time-code"
            >
              <InputOTPGroup className="gap-2">
                <InputOTPSlot index={0} className="w-12 h-14 text-xl font-bold border-2 rounded-xl" />
                <InputOTPSlot index={1} className="w-12 h-14 text-xl font-bold border-2 rounded-xl" />
                <InputOTPSlot index={2} className="w-12 h-14 text-xl font-bold border-2 rounded-xl" />
                <InputOTPSlot index={3} className="w-12 h-14 text-xl font-bold border-2 rounded-xl" />
                <InputOTPSlot index={4} className="w-12 h-14 text-xl font-bold border-2 rounded-xl" />
                <InputOTPSlot index={5} className="w-12 h-14 text-xl font-bold border-2 rounded-xl" />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button
              className="w-full h-14 font-bold rounded-2xl bg-primary text-white text-lg shadow-xl shadow-primary/20"
              onClick={handleVerify}
              disabled={loading || otpCode.length < 6}
          >
            {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verifying...
                </>
            ) : (
                "Verify Account"
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Didn't receive the code?{" "}
            <button onClick={handleResend} className="text-primary font-bold hover:underline">
              Resend
            </button>
          </p>
        </AuthLayout>
    );
  }

  return (
      <AuthLayout
          icon={UserPlus}
          title="Create your account"
          subtitle="Sign up to get started"
          footer={
            <>
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Log in
              </Link>
            </>
          }
      >
        <Button
            variant="outline"
            className="w-full h-12 text-sm font-bold mb-6 rounded-xl border-2 hover:bg-muted"
            onClick={handleGoogle}
        >
          <GoogleIcon className="w-5 h-5 mr-2" />
          Continue with Google
        </Button>

        <div className="relative mb-8 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <span className="relative bg-card px-4 text-xs text-muted-foreground uppercase font-bold tracking-widest">
          or email
        </span>
        </div>

        {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center font-medium">
              {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-14 rounded-2xl bg-muted/30 border-none"
                  required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-14 rounded-2xl bg-muted/30 border-none"
                  required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-11 h-14 rounded-2xl bg-muted/30 border-none"
                  required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-14 font-bold rounded-2xl bg-primary text-white text-lg shadow-xl shadow-primary/20 mt-4" disabled={loading}>
            {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating account...
                </>
            ) : (
                "Create account"
            )}
          </Button>
        </form>
      </AuthLayout>
  );
}