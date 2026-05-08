import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "../../components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../../components/ui/input-otp";
import { toast } from "sonner";
import { Toaster } from "../../components/ui/sonner";
import { auth, asApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";

const phoneOk = (p) => /^\+91[6-9]\d{9}$/.test(p);
const normalisePhone = (raw) => {
  const cleaned = (raw || "").replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+91")) return cleaned;
  if (cleaned.startsWith("91") && cleaned.length === 12) return `+${cleaned}`;
  if (/^[6-9]\d{9}$/.test(cleaned)) return `+91${cleaned}`;
  return cleaned;
};

export default function Login() {
  const [step, setStep] = useState("phone"); // 'phone' | 'otp'
  const [phone, setPhone] = useState("");
  const [requestId, setRequestId] = useState(null);
  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const intervalRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { completeLogin } = useAuth();
  const from = location.state?.from || "/dashboard";

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const startCountdown = (seconds) => {
    setSecondsLeft(seconds);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(intervalRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const sendOtp = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const normalised = normalisePhone(phone);
    if (!phoneOk(normalised)) {
      toast.error("Enter a valid Indian mobile number");
      return;
    }
    setPhone(normalised);
    setSending(true);
    try {
      const res = await auth.sendOtp(normalised);
      setRequestId(res.request_id);
      startCountdown(res.expires_in || 300);
      setStep("otp");
      setOtp("");
      toast.success("OTP sent", { description: `A 6-digit code is on its way to ${normalised}` });
    } catch (err) {
      const e = asApiError(err);
      const map = {
        INVALID_PHONE: "That phone number isn't valid",
        RATE_LIMITED: "Too many attempts. Wait a minute and try again.",
        SMS_PROVIDER_DOWN: "SMS service is briefly down. Try again shortly.",
      };
      toast.error(map[e.code] || e.message);
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async (codeMaybe) => {
    const code = codeMaybe ?? otp;
    if (code.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setVerifying(true);
    try {
      const res = await auth.verifyOtp(requestId, phone, code);
      completeLogin(res.access_token, res.user);
      toast.success(res.is_new_user ? "Welcome to Slotu!" : "Welcome back");
      navigate(from === "/login" ? "/dashboard" : from, { replace: true });
    } catch (err) {
      const e = asApiError(err);
      const map = {
        OTP_INVALID: "Wrong code. Try again.",
        OTP_EXPIRED: "Code expired. Resend a new one.",
        OTP_TOO_MANY_ATTEMPTS: "Too many attempts. Request a fresh code.",
      };
      toast.error(map[e.code] || e.message);
      if (e.code === "OTP_EXPIRED" || e.code === "OTP_TOO_MANY_ATTEMPTS") {
        setStep("phone");
        setOtp("");
      } else {
        setOtp("");
      }
    } finally {
      setVerifying(false);
    }
  };

  // auto-verify when 6 digits entered
  useEffect(() => {
    if (otp.length === 6 && !verifying) verifyOtp(otp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 radial-fade pointer-events-none" />
      <div className="absolute inset-0 dotted-grid opacity-30 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

      <Link to="/" data-testid="login-back-home" className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-500 hover:text-emerald-400 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to home
      </Link>

      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-10">
          <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center text-emerald-950">
            <Shield className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-zinc-50">slotu</span>
        </Link>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-7 md:p-9" data-testid="login-card">
          {step === "phone" ? (
            <form onSubmit={sendOtp} data-testid="login-phone-form">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-3">
                Step 1 of 2
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tighter">
                Sign in or create your account
              </h1>
              <p className="mt-3 text-zinc-400 text-sm">
                We'll send a 6-digit code to your Indian mobile. No passwords, no spam.
              </p>

              <label className="mt-7 block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-2">
                Mobile number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md bg-zinc-950 border border-r-0 border-zinc-800 text-zinc-400 font-mono text-sm">
                  +91
                </span>
                <Input
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="98765 43210"
                  value={phone.startsWith("+91") ? phone.slice(3) : phone}
                  onChange={(e) => setPhone(normalisePhone(e.target.value))}
                  className="rounded-l-none bg-zinc-950 border-zinc-800 focus:border-emerald-500 focus-visible:ring-emerald-500/20 h-11 text-zinc-100 font-mono"
                  data-testid="login-phone-input"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                data-testid="login-send-otp"
                className="mt-7 w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-emerald-950 px-6 py-3.5 text-base font-semibold transition-all"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {sending ? "Sending OTP…" : "Send OTP"}
                {!sending && <ArrowRight className="h-4 w-4" />}
              </button>

              <p className="mt-5 text-[11px] text-zinc-500 text-center font-mono">
                By continuing you agree to our{" "}
                <Link to="/terms" className="text-zinc-300 hover:text-emerald-400 underline-offset-2 hover:underline">Terms</Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-zinc-300 hover:text-emerald-400 underline-offset-2 hover:underline">Privacy</Link>.
              </p>
            </form>
          ) : (
            <div data-testid="login-otp-form">
              <button
                type="button"
                onClick={() => { setStep("phone"); setOtp(""); }}
                className="text-xs font-mono uppercase tracking-widest text-zinc-500 hover:text-emerald-400 inline-flex items-center gap-2 mb-3"
                data-testid="login-otp-back"
              >
                <ArrowLeft className="h-3 w-3" />
                Change number
              </button>

              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-3">
                Step 2 of 2
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tighter">
                Enter the 6-digit code
              </h1>
              <p className="mt-3 text-zinc-400 text-sm">
                Code sent to <span className="text-zinc-100 font-mono">{phone}</span>
              </p>

              <div className="mt-7">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  data-testid="login-otp-input"
                  containerClassName="justify-between"
                >
                  <InputOTPGroup className="gap-2 w-full">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="h-12 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 text-lg font-mono text-zinc-100 first:rounded-l-lg last:rounded-r-lg"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <button
                type="button"
                onClick={() => verifyOtp()}
                disabled={verifying || otp.length !== 6}
                data-testid="login-verify-otp"
                className="mt-7 w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-emerald-950 px-6 py-3.5 text-base font-semibold transition-all"
              >
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {verifying ? "Verifying…" : "Verify & continue"}
              </button>

              <div className="mt-5 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500">
                  {secondsLeft > 0
                    ? <>Expires in <span className="text-zinc-200">{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}</span></>
                    : "Code expired"}
                </span>
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={secondsLeft > 240 || sending}
                  className="text-emerald-400 hover:text-emerald-300 disabled:text-zinc-600 disabled:cursor-not-allowed uppercase tracking-widest"
                  data-testid="login-resend-otp"
                >
                  {sending ? "Sending…" : "Resend"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Toaster theme="dark" position="top-center" />
    </div>
  );
}
