import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | Bloom" },
      { name: "description", content: "Sign in to book your luxury salon appointment on Bloom." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [method, setMethod] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [demoEmail, setDemoEmail] = useState("lumiere@bloom.in");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Welcome to Bloom!");
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      setOtpSent(true);
      toast.success("Verification code sent to your email!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otpCode) return toast.error("Please enter the verification code");
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode.trim(),
        type: "email",
      });
      if (error) throw error;
      toast.success("Signed in successfully");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Incorrect verification code");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[440px] px-6 py-20 reveal">
      <Link className="inline-flex items-center gap-2 group" to="/">
        <div className="grid h-8 w-8 place-items-center border border-foreground/10 bg-surface-warm text-bronze transition-colors group-hover:border-bronze">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="font-display text-2xl tracking-[-0.02em]">Bloom</span>
      </Link>

      <h1 className="mt-12 font-display text-4xl tracking-[-0.03em] luxury-text-reveal">
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-3 text-[15px] font-light leading-relaxed text-warm-gray luxury-text-reveal reveal-delay-1">
        {mode === "signin"
          ? "Sign in to view your bookings and access the salon dashboard."
          : "Save favourite salons, track bookings, and manage your beauty routine."}
      </p>

      <div className="luxury-text-reveal reveal-delay-2">
        {/* --- HACKATHON JUDGE BUTTON --- */}
        <button
          onClick={async () => {
            setBusy(true);
            try {
              const { error } = await supabase.auth.signInWithPassword({
                email: "judge@bloom.in",
                password: "Hackathon123!",
              });
              if (error) throw error;
              toast.success("Welcome, Judge!");
              navigate({ to: "/dashboard" });
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Authentication failed");
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
          className="mt-8 flex w-full items-center justify-center gap-3 bg-bronze/10 border border-bronze/30 text-bronze px-5 py-3.5 text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-bronze hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className="h-4 w-4" /> Log in as Hackathon Judge
        </button>

        {/* --- DYNAMIC DEMO OWNER LOGINS --- */}
        <div className="mt-4 border border-bronze/20 bg-bronze/5 p-4 space-y-3">
          <div className="text-[9px] uppercase tracking-[0.25em] text-bronze font-bold text-center">
            Salon-Specific Demo Logins
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <Select value={demoEmail} onValueChange={setDemoEmail}>
                <SelectTrigger className="w-full rounded-none border border-foreground/10 bg-background px-3 py-2 text-[12px] h-9 text-left font-sans shadow-none focus:ring-0 focus:border-bronze">
                  <SelectValue placeholder="Select a salon..." />
                </SelectTrigger>
                <SelectContent className="rounded-none border border-foreground/10 bg-background shadow-lift">
                  <SelectItem
                    value="lumiere@bloom.in"
                    className="text-xs py-2 cursor-pointer focus:bg-bronze/5 focus:text-bronze"
                  >
                    Lumière Atelier (Indiranagar)
                  </SelectItem>
                  <SelectItem
                    value="maison@bloom.in"
                    className="text-xs py-2 cursor-pointer focus:bg-bronze/5 focus:text-bronze"
                  >
                    Maison de Beauté (Koramangala)
                  </SelectItem>
                  <SelectItem
                    value="emerald@bloom.in"
                    className="text-xs py-2 cursor-pointer focus:bg-bronze/5 focus:text-bronze"
                  >
                    Emerald Nail & Beauty Bar (HSR)
                  </SelectItem>
                  <SelectItem
                    value="vermilion@bloom.in"
                    className="text-xs py-2 cursor-pointer focus:bg-bronze/5 focus:text-bronze"
                  >
                    Vermilion Bridal (Jayanagar)
                  </SelectItem>
                  <SelectItem
                    value="forge@bloom.in"
                    className="text-xs py-2 cursor-pointer focus:bg-bronze/5 focus:text-bronze"
                  >
                    Forge Men's Lounge (Whitefield)
                  </SelectItem>
                  <SelectItem
                    value="aranya@bloom.in"
                    className="text-xs py-2 cursor-pointer focus:bg-bronze/5 focus:text-bronze"
                  >
                    Aranya Ayurveda Spa (JP Nagar)
                  </SelectItem>
                  <SelectItem
                    value="noir@bloom.in"
                    className="text-xs py-2 cursor-pointer focus:bg-bronze/5 focus:text-bronze"
                  >
                    Noir Hair Studio (MG Road)
                  </SelectItem>
                  <SelectItem
                    value="rose@bloom.in"
                    className="text-xs py-2 cursor-pointer focus:bg-bronze/5 focus:text-bronze"
                  >
                    Rose Petal Lounge (Kalyan Nagar)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button
              onClick={async () => {
                setBusy(true);
                try {
                  const { error } = await supabase.auth.signInWithPassword({
                    email: demoEmail,
                    password: "Hackathon123!",
                  });
                  if (error) throw error;
                  toast.success(`Welcome, Salon Owner!`);
                  navigate({ to: "/dashboard" });
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Authentication failed");
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
              className="bg-bronze text-white px-4 py-2 h-9 text-[10px] uppercase tracking-wider font-semibold hover:bg-foreground transition disabled:opacity-50 cursor-pointer"
            >
              Login
            </button>
          </div>
          <p className="text-[8px] text-warm-gray text-center uppercase tracking-wider">
            Test isolated salon view · Maps to a single salon
          </p>
        </div>

        <div className="my-8 flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-light-gray font-medium">
          <span className="h-px flex-1 bg-foreground/10" />
          or
          <span className="h-px flex-1 bg-foreground/10" />
        </div>

        {mode === "signin" && (
          <div className="mt-6 flex border-b border-foreground/10">
            <button
              type="button"
              onClick={() => {
                setMethod("password");
                setOtpSent(false);
              }}
              className={`flex-1 pb-3 text-center text-[10px] uppercase tracking-[0.2em] font-medium border-b transition-colors duration-300 ${
                method === "password"
                  ? "border-bronze text-foreground"
                  : "border-transparent text-warm-gray hover:text-foreground"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setMethod("otp")}
              className={`flex-1 pb-3 text-center text-[10px] uppercase tracking-[0.2em] font-medium border-b transition-colors duration-300 ${
                method === "otp"
                  ? "border-bronze text-foreground"
                  : "border-transparent text-warm-gray hover:text-foreground"
              }`}
            >
              OTP Code
            </button>
          </div>
        )}

        {mode === "signin" && method === "otp" ? (
          <div className="mt-8 space-y-6">
            {!otpSent ? (
              <form onSubmit={sendOtp} className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-[0.15em] font-medium text-warm-gray">
                    Email address
                  </span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-foreground/10 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-bronze transition-colors"
                    placeholder="you@email.com"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-foreground px-5 py-4 text-[11px] uppercase tracking-[0.2em] font-medium text-background hover:bg-bronze transition-colors disabled:opacity-50"
                >
                  {busy ? "Please wait…" : "Send verification code"}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-5">
                <div className="border border-foreground/10 bg-surface-warm p-4 flex items-center justify-between text-[13px]">
                  <div>
                    <span className="text-[11px] uppercase tracking-[0.1em] text-warm-gray block mb-1">
                      Sending code to
                    </span>
                    <span className="font-medium text-foreground">{email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode("");
                    }}
                    className="text-[10px] uppercase tracking-[0.15em] text-bronze hover:text-foreground transition-colors"
                  >
                    Change
                  </button>
                </div>

                <label className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-[0.15em] font-medium text-warm-gray">
                    6-digit code
                  </span>
                  <input
                    required
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full border border-foreground/10 bg-transparent px-4 py-3 outline-none focus:border-bronze transition-colors text-center tracking-[0.75em] text-2xl font-light"
                    placeholder="••••••"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy || otpCode.length < 6}
                  className="w-full bg-foreground px-5 py-4 text-[11px] uppercase tracking-[0.2em] font-medium text-background hover:bg-bronze transition-colors disabled:opacity-50"
                >
                  {busy ? "Verifying…" : "Verify & Sign in"}
                </button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-5">
            {mode === "signup" && (
              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.15em] font-medium text-warm-gray">
                  Full name
                </span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-foreground/10 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-bronze transition-colors"
                  placeholder="Ananya Rao"
                />
              </label>
            )}
            <label className="block">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.15em] font-medium text-warm-gray">
                Email
              </span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-foreground/10 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-bronze transition-colors"
                placeholder="you@email.com"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.15em] font-medium text-warm-gray">
                Password
              </span>
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-foreground/10 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-bronze transition-colors"
                placeholder="••••••••"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="mt-4 w-full bg-foreground px-5 py-4 text-[11px] uppercase tracking-[0.2em] font-medium text-background hover:bg-bronze transition-colors disabled:opacity-50"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-[13px] text-warm-gray">
          {mode === "signin" ? "New to Bloom?" : "Already have an account?"}{" "}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="font-medium text-foreground border-b border-foreground/30 hover:border-bronze hover:text-bronze transition-colors pb-0.5"
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
