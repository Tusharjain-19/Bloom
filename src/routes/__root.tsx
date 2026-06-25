import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, useMemo, type ReactNode } from "react";
import { toast } from "sonner";
import { Sparkles, X, Send, Loader2, Check, Clock } from "lucide-react";
import { type Salon, type SalonService } from "@/lib/salons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as UiCalendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";

import appCss from "@/styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { reportAppError } from "@/lib/error-reporting";
import { HackathonTour } from "@/components/HackathonTour";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-medium">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-none bg-primary px-6 py-3 text-xs uppercase tracking-widest font-medium text-primary-foreground hover:bg-bronze transition-colors"
          >
            Back to discovery
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportAppError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl">Something didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Try again or head back to the homepage.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-none bg-primary px-6 py-3 text-xs uppercase tracking-widest font-medium text-primary-foreground hover:bg-bronze transition-colors cursor-pointer"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-none border border-border bg-background px-6 py-3 text-xs uppercase tracking-widest font-medium hover:bg-surface-warm transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Bloom | Bangalore's Luxury Salon Booking" },
      {
        name: "description",
        content:
          "Discover and book Bangalore's best luxury salons. Exclusive discovery, real-time slots, verified reviews.",
      },
      { property: "og:title", content: "Bloom | Bangalore's Luxury Salon Booking" },
      {
        property: "og:description",
        content: "Exclusive discovery and booking for Bangalore's top luxury salons.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);
  const [staffRole, setStaffRole] = useState<"admin" | "salon_owner" | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadRoles = async (uid: string | undefined) => {
      if (!uid) return setStaffRole(null);
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      const roles = (data ?? []).map((r) => r.role as string);
      if (roles.includes("admin")) setStaffRole("admin");
      else if (roles.includes("salon_owner")) setStaffRole("salon_owner");
      else setStaffRole(null);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSignedIn(!!sess);
      loadRoles(sess?.user?.id);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      loadRoles(data.session?.user?.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out: " + error.message);
    } else {
      toast.success("Signed out successfully");
      window.location.href = "/";
    }
  };

  return (
    <>
      <header className="sticky top-4 z-40 mx-auto w-[calc(100%-2rem)] max-w-[1200px] bg-background/85 backdrop-blur-lg border border-foreground/8 shadow-soft rounded-full transition-all duration-300 mb-2">
        <div className="flex h-16 items-center justify-between px-6 md:px-8">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-display text-lg font-semibold tracking-[0.3em] text-foreground transition-colors duration-300 group-hover:text-bronze">
              BLOOM
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {!staffRole && (
              <Link
                to="/browse"
                activeProps={{ className: "luxury-link-active" }}
                className="luxury-link text-[10px] uppercase tracking-[0.2em] font-semibold text-warm-gray hover:text-bronze"
              >
                Browse
              </Link>
            )}

            {!staffRole && (
              <Link
                to="/list-your-salon"
                activeProps={{ className: "luxury-link-active" }}
                className="luxury-link text-[10px] uppercase tracking-[0.2em] font-semibold text-warm-gray hover:text-bronze"
              >
                List Salon
              </Link>
            )}

            {signedIn ? (
              <>
                {!staffRole && (
                  <Link
                    to="/dashboard"
                    activeProps={{ className: "luxury-link-active" }}
                    className="luxury-link text-[10px] uppercase tracking-[0.2em] font-semibold text-warm-gray hover:text-bronze"
                  >
                    Dashboard
                  </Link>
                )}
                {staffRole === "admin" && (
                  <Link
                    to="/admin/hq"
                    activeProps={{ className: "luxury-link-active" }}
                    className="luxury-link text-[10px] uppercase tracking-[0.2em] font-semibold text-warm-gray hover:text-bronze"
                  >
                    HQ Admin
                  </Link>
                )}
                {staffRole && (
                  <Link
                    to="/admin/salons"
                    activeProps={{ className: "luxury-link-active" }}
                    className="luxury-link text-[10px] uppercase tracking-[0.2em] font-semibold text-warm-gray hover:text-bronze"
                  >
                    Salon Admin
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="text-[10px] uppercase tracking-[0.2em] font-semibold text-warm-gray hover:text-bronze transition-colors duration-300 cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                activeProps={{ className: "luxury-link-active" }}
                className="luxury-link text-[10px] uppercase tracking-[0.2em] font-semibold text-warm-gray hover:text-bronze"
              >
                Sign In
              </Link>
            )}
          </nav>

          {/* Book Experience CTA */}
          {!staffRole && (
            <div className="hidden md:block">
              <Link
                to="/browse"
                className="border border-foreground/10 px-5 py-2 text-[9px] uppercase tracking-[0.2em] font-bold hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-300 rounded-full"
              >
                Book Now
              </Link>
            </div>
          )}

          {/* Hamburger Mobile Toggle */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col justify-center items-center gap-1.5 w-6 h-6 md:hidden focus:outline-none cursor-pointer"
            aria-label="Toggle Menu"
          >
            <span className="w-4.5 h-0.5 bg-foreground rounded-full" />
            <span className="w-4.5 h-0.5 bg-foreground rounded-full" />
            <span className="w-4.5 h-0.5 bg-foreground rounded-full" />
          </button>
        </div>
      </header>

      {/* Backdrop for Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/15 backdrop-blur-xs transition-opacity duration-300 md:hidden"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-[300px] bg-[#fafaf8] border-l border-foreground/5 p-8 flex flex-col justify-between shadow-2xl transition-transform duration-500 ease-in-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div>
          <div className="flex items-center justify-between border-b border-foreground/5 pb-6 mb-8">
            <span className="font-display text-lg tracking-[0.2em] text-foreground">BLOOM</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-warm-gray hover:text-foreground text-[10px] uppercase tracking-[0.15em] font-medium"
            >
              Close
            </button>
          </div>
          <nav className="flex flex-col gap-6">
            {!staffRole && (
              <Link
                to="/browse"
                onClick={() => setMobileMenuOpen(false)}
                className="font-display text-2xl text-foreground hover:text-bronze transition-colors"
              >
                Browse Directory
              </Link>
            )}
            {!staffRole && (
              <Link
                to="/list-your-salon"
                onClick={() => setMobileMenuOpen(false)}
                className="font-display text-2xl text-foreground hover:text-bronze transition-colors"
              >
                List Your Salon
              </Link>
            )}
            {signedIn ? (
              <>
                {!staffRole && (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-display text-2xl text-foreground hover:text-bronze transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                {staffRole === "admin" && (
                  <Link
                    to="/admin/hq"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-display text-2xl text-foreground hover:text-bronze transition-colors"
                  >
                    HQ Admin
                  </Link>
                )}
                {staffRole && (
                  <Link
                    to="/admin/salons"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-display text-2xl text-foreground hover:text-bronze transition-colors"
                  >
                    Salon Admin
                  </Link>
                )}
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="font-display text-2xl text-foreground hover:text-bronze transition-colors"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>

        <div className="border-t border-foreground/5 pt-8">
          {signedIn ? (
            <button
              onClick={() => {
                handleSignOut();
                setMobileMenuOpen(false);
              }}
              className="w-full bg-[#1a1a1a] text-white py-3.5 text-xs uppercase tracking-[0.2em] font-medium hover:bg-bronze transition-colors duration-300"
            >
              Sign Out
            </button>
          ) : (
            <Link
              to="/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full bg-[#1a1a1a] text-white text-center py-3.5 text-xs uppercase tracking-[0.2em] font-medium hover:bg-bronze transition-colors duration-300"
            >
              Sign In
            </Link>
          )}
          <p className="mt-4 text-[9px] text-center text-light-gray uppercase tracking-[0.2em]">
            Bloom Concierge · Bengaluru
          </p>
        </div>
      </div>
    </>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-0 border-t border-foreground/4 bg-surface-warm text-[#1a1a1a]">
      <div className="mx-auto max-w-[1200px] px-6 md:px-8 py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5 mb-16">
          {/* Logo & Vision */}
          <div className="lg:col-span-2 space-y-4">
            <span className="font-display text-2xl tracking-[0.25em] text-foreground">BLOOM</span>
            <p className="max-w-sm text-[12px] leading-relaxed tracking-wide text-warm-gray font-light">
              Bangalore's premium wellness discovery and real-time reservation platform. Curating
              the city's finest beauty, skin, and styling spaces for an unparalleled client
              experience.
            </p>
          </div>

          {/* Column 2: Explore */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-bronze mb-5">
              Explore
            </h4>
            <ul className="space-y-3.5">
              <li>
                <Link
                  to="/browse"
                  className="luxury-link text-[11px] uppercase tracking-[0.15em] font-medium text-warm-gray hover:text-bronze"
                >
                  Browse Directory
                </Link>
              </li>
              <li>
                <Link
                  to="/list-your-salon"
                  className="luxury-link text-[11px] uppercase tracking-[0.15em] font-medium text-warm-gray hover:text-bronze"
                >
                  List Your Salon
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  className="luxury-link text-[11px] uppercase tracking-[0.15em] font-medium text-warm-gray hover:text-bronze"
                >
                  Client Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Support */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-bronze mb-5">
              Legal & Info
            </h4>
            <ul className="space-y-3.5">
              <li>
                <Link
                  to="/privacy"
                  className="luxury-link text-[11px] uppercase tracking-[0.15em] font-medium text-warm-gray hover:text-bronze"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="luxury-link text-[11px] uppercase tracking-[0.15em] font-medium text-warm-gray hover:text-bronze"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="luxury-link text-[11px] uppercase tracking-[0.15em] font-medium text-warm-gray hover:text-bronze"
                >
                  Concierge Desk
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Concierge Address */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-bronze mb-5">
              Concierge
            </h4>
            <address className="not-italic text-[11px] leading-relaxed text-warm-gray font-light space-y-2.5">
              <p>12th Main Rd, Indiranagar</p>
              <p>Bengaluru 560038</p>
              <p className="pt-1.5">
                <a href="mailto:concierge@bloom.in" className="hover:text-bronze transition-colors">
                  concierge@bloom.in
                </a>
              </p>
              <p>
                <a href="tel:+918040000000" className="hover:text-bronze transition-colors">
                  +91 80 4000 0000
                </a>
              </p>
            </address>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#1a1a1a]/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-light-gray">
          <div className="text-[10px] uppercase tracking-[0.15em] font-medium">
            © {new Date().getFullYear()} Bloom India. All Rights Reserved.
          </div>
          <div className="text-[9px] uppercase tracking-[0.2em] font-light">
            Designed for Bangalore's finest
          </div>
        </div>
      </div>
    </footer>
  );
}

function HackathonBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#1a1a1a] border-t border-bronze/30 text-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex items-center justify-center gap-4 text-center">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-bronze" />
        <div className="text-[12px] uppercase tracking-widest">
          <span className="font-bold text-bronze">Welcome Judges!</span> · Bloom is built with
          React, Supabase & TanStack. Use the AI Concierge to book, or log in to the Dashboard.
        </div>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-white/60 hover:text-white p-1 cursor-pointer ml-4 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
        <FloatingConcierge />
        <HackathonBanner />
        <HackathonTour />
      </div>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}

interface BotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?:
    | "text"
    | "salon_selector"
    | "service_selector"
    | "date_selector"
    | "time_selector"
    | "details_form"
    | "summary"
    | "booking_success";
  data?: Salon[] | SalonService[];
}

interface ConciergeState {
  stage:
    | "idle"
    | "salon_selection"
    | "service_selection"
    | "date_selection"
    | "time_selection"
    | "details_form"
    | "summary"
    | "booking_success";
  selectedSalon: Salon | null;
  selectedService: SalonService | null;
  selectedDate: string;
  selectedTime: string;
  customerName: string;
  customerPhone: string;
  notes: string;
  matchingSalons: Salon[];
  holidays: string[];
  activeBookings: Array<{ booking_date: string; booking_time: string; status: string }>;
  bookingId?: string;
}

function parseUserInput(inputStr: string, salonsList: Salon[]) {
  const query = inputStr.toLowerCase().trim();

  // 1. Check for specific salon name
  for (const s of salonsList) {
    if (
      query.includes(s.name.toLowerCase()) ||
      (s.slug && query.includes(s.slug.replace(/-/g, " ")))
    ) {
      return { type: "salon_match" as const, salon: s };
    }
  }

  // 2. Check for neighborhoods
  const neighborhoods = [
    "indiranagar",
    "jayanagar",
    "hsr",
    "koramangala",
    "whitefield",
    "sadashivanagar",
    "j.p. nagar",
    "jp nagar",
  ];
  let matchedNeighborhood = "";
  for (const n of neighborhoods) {
    if (query.includes(n)) {
      matchedNeighborhood = n;
      break;
    }
  }

  // 3. Check for specialties
  const specialtyKeywords = [
    { match: /hair|cut|colour|color|balayage|keratin|blow dry|styling/, label: "Hair" },
    { match: /skin|facial|hydra|peel|treatment/, label: "Skin" },
    { match: /nail|pedicure|mani|gel/, label: "Nails" },
    { match: /bridal|airbrush|draping|makeup/, label: "Bridal" },
    { match: /massage|spa|ayurveda|wellness/, label: "Ayurveda" },
  ];
  let matchedSpecialty = "";
  for (const spec of specialtyKeywords) {
    if (spec.match.test(query)) {
      matchedSpecialty = spec.label;
      break;
    }
  }

  if (matchedNeighborhood) {
    const matches = salonsList.filter(
      (s) =>
        s.neighborhood.toLowerCase().includes(matchedNeighborhood) ||
        (matchedNeighborhood === "jp nagar" && s.neighborhood.toLowerCase().includes("j.p. nagar")),
    );
    return {
      type: "filter_match" as const,
      salons: matches,
      criteria: `in ${matchedNeighborhood}`,
    };
  }

  if (matchedSpecialty) {
    const matches = salonsList.filter((s) => {
      const tags = s.specialties.join(" ").toLowerCase();
      if (matchedSpecialty === "Hair") return /hair|cut|colour|color|balayage|keratin/.test(tags);
      if (matchedSpecialty === "Skin") return /skin|facial|hydra|peel/.test(tags);
      if (matchedSpecialty === "Nails") return /nail|pedicure|mani/.test(tags);
      if (matchedSpecialty === "Bridal") return /bridal|airbrush|drap/.test(tags);
      if (matchedSpecialty === "Ayurveda") return /ayurveda|wellness|massage/.test(tags);
      return false;
    });
    return {
      type: "filter_match" as const,
      salons: matches,
      criteria: `specializing in ${matchedSpecialty}`,
    };
  }

  if (/book|appointment|reserve|schedule|list|directory/.test(query)) {
    return { type: "general_booking" as const };
  }

  return { type: "none" as const };
}

function getSalonSlots(salon: Salon) {
  try {
    if (salon.hours && salon.hours.trim().startsWith("{")) {
      const parsed = JSON.parse(salon.hours);
      if (Array.isArray(parsed.slots) && parsed.slots.length > 0) {
        return parsed.slots;
      }
    }
  } catch (e) {
    // ignore
  }
  return ["10:00", "11:00", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30"];
}

function FloatingConcierge() {
  const [isOpen, setIsOpen] = useState(true);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: "initial-msg",
      role: "assistant",
      content:
        "Welcome to the Bloom Concierge. I am your Bengaluru luxury wellness companion. I can help you search, discover, and instantly schedule appointments at exclusive salons in Indiranagar, Jayanagar, HSR Layout, and J.P. Nagar. Type 'book' or ask for recommendations to begin!",
      type: "text",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [botState, setBotState] = useState<ConciergeState>({
    stage: "idle",
    selectedSalon: null,
    selectedService: null,
    selectedDate: "",
    selectedTime: "",
    customerName: "",
    customerPhone: "",
    notes: "",
    matchingSalons: [],
    holidays: [],
    activeBookings: [],
  });

  // Fetch approved salons
  useEffect(() => {
    const fetchSalons = async () => {
      const { data, error } = await supabase
        .from("salons")
        .select("*")
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("rating", { ascending: false });
      if (error) {
        console.error("Error fetching salons for concierge:", error);
      } else if (data) {
        setSalons(data as unknown as Salon[]);
      }
    };
    fetchSalons();
  }, []);

  // Prefill authenticated user name and check role
  const [shouldHideBot, setShouldHideBot] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        setBotState((prev) => ({
          ...prev,
          customerName: data.session.user.user_metadata?.full_name || "",
        }));
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.session.user.id);
        if (roles?.some(r => r.role === "salon_owner" || r.role === "admin")) setShouldHideBot(true);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, sess) => {
      if (sess?.user) {
        setBotState((prev) => ({
          ...prev,
          customerName: sess.user.user_metadata?.full_name || prev.customerName,
        }));
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", sess.user.id);
        if (roles?.some(r => r.role === "salon_owner" || r.role === "admin")) {
          setShouldHideBot(true);
        } else {
          setShouldHideBot(false);
        }
      } else {
        setShouldHideBot(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (shouldHideBot) return null;

  const handleSelectSalon = (salon: Salon) => {
    setBotState((prev) => ({
      ...prev,
      selectedSalon: salon,
      stage: "service_selection",
    }));
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: `Selected Salon: ${salon.name}`,
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Please select a service at ${salon.name}:`,
        type: "service_selector",
        data: salon.services,
      },
    ]);
  };

  const handleSelectService = (service: SalonService) => {
    setBotState((prev) => ({
      ...prev,
      selectedService: service,
      stage: "date_selection",
    }));
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: `Selected Service: ${service.name} (₹${service.price})`,
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Please choose a date for your appointment:",
        type: "date_selector",
      },
    ]);
  };

  const handleSelectDate = async (dateStr: string) => {
    if (!botState.selectedSalon) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from("booking_slots" as any) as any)
        .select("booking_date,booking_time,status")
        .eq("salon_id", botState.selectedSalon.id)
        .neq("status", "cancelled")
        .eq("booking_date", dateStr);

      if (error) throw error;

      const holidays = botState.selectedSalon.salon_holidays || [];
      const activeBookings = data || [];

      setBotState((prev) => ({
        ...prev,
        selectedDate: dateStr,
        holidays,
        activeBookings,
        stage: "time_selection",
      }));

      const formattedDate = new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        weekday: "short",
      });

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: `Selected Date: ${formattedDate}`,
        },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Here are the available time slots for ${formattedDate} at ${botState.selectedSalon?.name}:`,
          type: "time_selector",
        },
      ]);
    } catch (e) {
      console.error("Error loading date availability:", e);
      toast.error("Failed to load availability. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTime = (timeStr: string) => {
    setBotState((prev) => ({
      ...prev,
      selectedTime: timeStr,
      stage: "details_form",
    }));
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: `Selected Time: ${timeStr}`,
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Please provide your contact details to complete the booking:",
        type: "details_form",
      },
    ]);
  };

  const handleDetailsSubmit = (name: string, phone: string, notes: string) => {
    setBotState((prev) => ({
      ...prev,
      customerName: name,
      customerPhone: phone,
      notes: notes,
      stage: "summary",
    }));
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: `Contact Details: ${name} (${phone})${notes ? ` - Notes: ${notes}` : ""}`,
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Please review your appointment summary below and confirm your reservation:",
        type: "summary",
      },
    ]);
  };

  const handleConfirmBooking = async () => {
    if (
      !botState.selectedSalon ||
      !botState.selectedService ||
      !botState.selectedDate ||
      !botState.selectedTime ||
      !botState.customerName ||
      !botState.customerPhone
    ) {
      toast.error("Missing booking details");
      return;
    }

    const bookingId = typeof window !== "undefined" && window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });

    setLoading(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .insert({
          id: bookingId,
          salon_id: botState.selectedSalon.id,
          service_name: botState.selectedService.name,
          service_price: botState.selectedService.price,
          booking_date: botState.selectedDate,
          booking_time: botState.selectedTime,
          customer_name: botState.customerName,
          customer_phone: botState.customerPhone,
          notes: botState.notes || null,
          status: "pending",
        });

      if (error) {
        throw error;
      }

      setBotState((prev) => ({
        ...prev,
        bookingId: bookingId,
        stage: "booking_success",
      }));

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Booking Confirmed! Here are your details:",
          type: "booking_success",
        },
      ]);
      toast.success("Appointment booked successfully!");
    } catch (e) {
      console.error("Booking error:", e);
      toast.error("Failed to complete reservation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setBotState({
      stage: "idle",
      selectedSalon: null,
      selectedService: null,
      selectedDate: "",
      selectedTime: "",
      customerName: botState.customerName,
      customerPhone: "",
      notes: "",
      matchingSalons: [],
      holidays: [],
      activeBookings: [],
    });
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Welcome to the Bloom Concierge. I am your Bengaluru luxury wellness companion. I can help you search, discover, and instantly schedule appointments at exclusive salons in Indiranagar, Jayanagar, HSR Layout, and J.P. Nagar. Type 'book' or ask for recommendations to begin!",
        type: "text",
      },
    ]);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const text = input.trim();
    const userMessage: BotMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setInput("");

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Global reset
    if (/restart|reset|start over/.test(text.toLowerCase())) {
      setBotState({
        stage: "idle",
        selectedSalon: null,
        selectedService: null,
        selectedDate: "",
        selectedTime: "",
        customerName: botState.customerName,
        customerPhone: "",
        notes: "",
        matchingSalons: [],
        holidays: [],
        activeBookings: [],
      });
      setMessages([
        ...updatedMessages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Resetting concierge. How can I help you book your beauty experience today?",
          type: "text",
        },
      ]);
      return;
    }

    // Process state machine in idle stage
    if (botState.stage === "idle") {
      const match = parseUserInput(text, salons);
      if (match.type === "salon_match" && match.salon) {
        setBotState((prev) => ({
          ...prev,
          stage: "service_selection",
          selectedSalon: match.salon,
        }));
        setMessages([
          ...updatedMessages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Ah, ${match.salon.name}! Excellent choice. Which service would you like to book?`,
            type: "service_selector",
            data: match.salon.services,
          },
        ]);
      } else if (match.type === "filter_match" && match.salons.length > 0) {
        setBotState((prev) => ({
          ...prev,
          stage: "salon_selection",
          matchingSalons: match.salons,
        }));
        setMessages([
          ...updatedMessages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `I found ${match.salons.length} luxury salons ${match.criteria}. Please select one from the options below:`,
            type: "salon_selector",
            data: match.salons,
          },
        ]);
      } else if (match.type === "general_booking") {
        setBotState((prev) => ({
          ...prev,
          stage: "salon_selection",
          matchingSalons: salons,
        }));
        setMessages([
          ...updatedMessages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "Let's find the perfect salon for you. Please select from our curated Bangalore partners below:",
            type: "salon_selector",
            data: salons,
          },
        ]);
      } else {
        setMessages([
          ...updatedMessages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "I am the Bloom Concierge, your local Bengaluru luxury wellness companion. I can guide you through booking an appointment, finding salons in your neighborhood (like Indiranagar or Jayanagar), or recommending treatments (like hair styling or facials). To start booking, you can simply type 'book' or ask for a salon recommendation!",
            type: "text",
          },
        ]);
      }
    } else {
      setMessages([
        ...updatedMessages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Please use the widgets above to make your selection, or type 'restart' to start from the beginning.",
          type: "text",
        },
      ]);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-40 bg-foreground text-background flex items-center justify-center gap-2.5 h-14 px-5 rounded-none shadow-xl border border-background/10 hover:bg-bronze transition-colors duration-300 cursor-pointer group"
      >
        <Sparkles className="h-4.5 w-4.5 group-hover:rotate-12 transition-transform duration-300 text-champagne" />
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold">Concierge</span>
      </button>

      {/* Concierge Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-8 z-50 w-full max-w-[380px] sm:max-w-[420px] h-[520px] bg-background border border-foreground/5 flex flex-col justify-between shadow-2xl chat-panel-animate text-foreground">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-foreground/5 p-5 bg-surface-warm">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 bg-bronze animate-pulse" />
              <div>
                <h3 className="font-display text-sm tracking-wide font-medium">Bloom Concierge</h3>
                <p className="text-[9px] text-light-gray uppercase tracking-widest mt-0.5">
                  Bespoke Booking Guide
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-warm-gray hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4 stroke-[1.5]" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs leading-relaxed scrollbar-thin">
            {messages.map((msg, i) => {
              const isLast = i === messages.length - 1;
              return (
                <div
                  key={msg.id || i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 tracking-wide ${
                      msg.role === "user"
                        ? "bg-foreground text-background"
                        : "bg-surface-warm border border-foreground/4 text-foreground font-light"
                    }`}
                  >
                    <div>{msg.content}</div>

                    {/* Render Interactive widgets on latest assistant message */}
                    {isLast && msg.role === "assistant" && (
                      <>
                        {msg.type === "salon_selector" && (
                          <SalonSelectorWidget
                            salons={(msg.data as Salon[]) || botState.matchingSalons}
                            onSelect={handleSelectSalon}
                          />
                        )}
                        {msg.type === "service_selector" && (
                          <ServiceSelectorWidget
                            services={(msg.data as SalonService[]) || []}
                            onSelect={handleSelectService}
                          />
                        )}
                        {msg.type === "date_selector" && (
                          <DateSelectorWidget onSelect={handleSelectDate} />
                        )}
                        {msg.type === "time_selector" && (
                          <TimeSelectorWidget
                            slots={
                              botState.selectedSalon ? getSalonSlots(botState.selectedSalon) : []
                            }
                            onSelect={handleSelectTime}
                            holidays={botState.holidays}
                            activeBookings={botState.activeBookings}
                            selectedDate={botState.selectedDate}
                            salon={botState.selectedSalon}
                          />
                        )}
                        {msg.type === "details_form" && (
                          <DetailsFormWidget
                            initialName={botState.customerName}
                            initialPhone={botState.customerPhone}
                            initialNotes={botState.notes}
                            onSubmit={handleDetailsSubmit}
                          />
                        )}
                        {msg.type === "summary" && (
                          <SummaryWidget
                            state={botState}
                            onConfirm={handleConfirmBooking}
                            onStartOver={handleStartOver}
                            loading={loading}
                          />
                        )}
                        {msg.type === "booking_success" && (
                          <BookingSuccessWidget
                            bookingId={botState.bookingId}
                            state={botState}
                            onStartOver={handleStartOver}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && botState.stage !== "summary" && (
              <div className="flex justify-start">
                <div className="bg-surface-warm border border-foreground/4 p-4 text-warm-gray flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin text-bronze" />
                  <span className="text-[10px] uppercase tracking-widest font-medium">
                    Concierge is processing...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={sendMessage}
            className="border-t border-foreground/5 p-4 flex gap-3 bg-surface-warm"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                botState.stage === "idle"
                  ? "Ask for recommendations, type 'book'..."
                  : "Type 'restart' to reset..."
              }
              className="flex-1 bg-background border border-foreground/8 px-4 py-3 text-xs outline-none focus:border-bronze transition-colors rounded-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-foreground text-background hover:bg-bronze px-4 py-3 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer rounded-none"
            >
              <Send className="h-4.5 w-4.5 text-champagne" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

// ==========================================
// INTERACTIVE WIDGET COMPONENTS FOR CHAT
// ==========================================

function SalonSelectorWidget({
  salons,
  onSelect,
}: {
  salons: Salon[];
  onSelect: (salon: Salon) => void;
}) {
  return (
    <div className="mt-3 space-y-3 max-h-[220px] overflow-y-auto pr-1">
      {salons.map((salon) => (
        <div
          key={salon.id}
          className="border border-foreground/8 p-3 bg-background flex flex-col justify-between gap-2 hover:border-bronze transition-colors"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="font-semibold text-xs text-foreground">{salon.name}</span>
              <span className="text-[10px] text-bronze font-medium">{salon.price_tier}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{salon.neighborhood}</p>
            {salon.tagline && (
              <p className="text-[10px] italic text-foreground/80 mt-1">{salon.tagline}</p>
            )}
            <p className="text-[9px] text-light-gray mt-1 font-light">
              Specialties: {salon.specialties.join(", ")}
            </p>
          </div>
          <button
            onClick={() => onSelect(salon)}
            className="w-full text-center bg-foreground text-background text-[10px] uppercase tracking-wider py-1.5 hover:bg-bronze hover:text-white transition-colors font-medium rounded-none cursor-pointer mt-1"
          >
            Select Salon
          </button>
        </div>
      ))}
    </div>
  );
}

function ServiceSelectorWidget({
  services,
  onSelect,
}: {
  services: SalonService[];
  onSelect: (service: SalonService) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-1">
      {services.map((service, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(service)}
          className="flex justify-between items-center w-full text-left border border-foreground/8 p-2.5 bg-background hover:border-bronze hover:bg-surface-warm transition-all text-xs rounded-none cursor-pointer"
        >
          <span className="font-medium text-foreground">{service.name}</span>
          <span className="text-bronze font-semibold">₹{service.price}</span>
        </button>
      ))}
    </div>
  );
}

function DateSelectorWidget({ onSelect }: { onSelect: (dateStr: string) => void }) {
  const [customDate, setCustomDate] = useState("");

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const tomorrowStr = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }, []);
  const dayAfterStr = useMemo(() => {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    return dayAfter.toISOString().split("T")[0];
  }, []);

  const formatDateLabel = (str: string) => {
    const d = new Date(str);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" });
  };

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onSelect(todayStr)}
          className="w-full text-left border border-foreground/8 p-2 bg-background hover:border-bronze hover:bg-surface-warm transition-all text-xs rounded-none cursor-pointer flex justify-between"
        >
          <span>Today</span>
          <span className="text-muted-foreground">{formatDateLabel(todayStr)}</span>
        </button>
        <button
          onClick={() => onSelect(tomorrowStr)}
          className="w-full text-left border border-foreground/8 p-2 bg-background hover:border-bronze hover:bg-surface-warm transition-all text-xs rounded-none cursor-pointer flex justify-between"
        >
          <span>Tomorrow</span>
          <span className="text-muted-foreground">{formatDateLabel(tomorrowStr)}</span>
        </button>
        <button
          onClick={() => onSelect(dayAfterStr)}
          className="w-full text-left border border-foreground/8 p-2 bg-background hover:border-bronze hover:bg-surface-warm transition-all text-xs rounded-none cursor-pointer flex justify-between"
        >
          <span>Day After</span>
          <span className="text-muted-foreground">{formatDateLabel(dayAfterStr)}</span>
        </button>
      </div>

      <div className="border-t border-foreground/5 pt-3">
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
          Or Choose Custom Date
        </label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex-1 text-left bg-background border border-foreground/8 px-3 py-1.5 text-xs outline-none focus:border-bronze rounded-none cursor-pointer flex justify-between items-center hover:border-foreground/30 transition-colors">
                <span className="text-foreground">
                  {customDate ? formatDateLabel(customDate) : "Pick date..."}
                </span>
                <CalendarIcon className="h-3.5 w-3.5 text-warm-gray" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-none border border-foreground/10 bg-background shadow-lift" align="start">
              <UiCalendar
                mode="single"
                selected={customDate ? new Date(customDate + "T00:00:00") : undefined}
                onSelect={(dateVal) => {
                  if (dateVal) {
                    const yyyy = dateVal.getFullYear();
                    const mm = String(dateVal.getMonth() + 1).padStart(2, "0");
                    const dd = String(dateVal.getDate()).padStart(2, "0");
                    setCustomDate(`${yyyy}-${mm}-${dd}`);
                  } else {
                    setCustomDate("");
                  }
                }}
                disabled={(dateVal) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return dateVal < today;
                }}
                className="rounded-none border-0"
              />
            </PopoverContent>
          </Popover>
          <button
            disabled={!customDate}
            onClick={() => onSelect(customDate)}
            className="bg-foreground text-background hover:bg-bronze hover:text-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider disabled:opacity-40 transition-colors rounded-none cursor-pointer"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function TimeSelectorWidget({
  slots,
  onSelect,
  holidays,
  activeBookings,
  selectedDate,
  salon,
}: {
  slots: string[];
  onSelect: (timeStr: string) => void;
  holidays: string[];
  activeBookings: Array<{ booking_date: string; booking_time: string; status: string }>;
  selectedDate: string;
  salon: Salon | null;
}) {
  const isHoliday = holidays.includes(selectedDate);
  const isFullyBooked = useMemo(() => {
    if (!salon) return false;
    const maxDaily = salon.max_bookings_per_day ?? 20;
    const bookingsOnDate = activeBookings.filter((b) => b.booking_date === selectedDate).length;
    return bookingsOnDate >= maxDaily;
  }, [selectedDate, activeBookings, salon]);

  const selectedDayOfWeek = useMemo(() => {
    if (!selectedDate) return null;
    const d = new Date(selectedDate);
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return days[d.getDay()];
  }, [selectedDate]);

  const activeSlots = useMemo(() => {
    if (!selectedDayOfWeek || !salon?.operating_hours) return slots;
    const oh = salon.operating_hours[selectedDayOfWeek];
    if (!oh || !oh.open || !oh.close) return slots;

    const newSlots: string[] = [];
    const current = new Date(`1970-01-01T${oh.open}:00`);
    const end = new Date(`1970-01-01T${oh.close}:00`);
    while (current < end) {
      newSlots.push(current.toTimeString().slice(0, 5));
      current.setMinutes(current.getMinutes() + 30);
    }
    return newSlots.length > 0 ? newSlots : slots;
  }, [selectedDayOfWeek, salon?.operating_hours, slots]);

  if (isHoliday) {
    return (
      <div className="mt-3 p-3 bg-red-500/5 border border-red-500/20 text-red-500 text-xs">
        Closed due to holiday.
      </div>
    );
  }

  if (isFullyBooked) {
    return (
      <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/20 text-amber-500 text-xs">
        Fully booked on this day.
      </div>
    );
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
      {activeSlots.map((slot) => {
        const capacity = salon?.max_bookings_per_hour ?? 1;
        const bookingsForSlot = activeBookings.filter(
          (b) => b.booking_date === selectedDate && b.booking_time.slice(0, 5) === slot,
        ).length;
        const seatsLeft = Math.max(0, capacity - bookingsForSlot);
        const isAvailable = seatsLeft > 0;

        return (
          <button
            key={slot}
            disabled={!isAvailable}
            onClick={() => onSelect(slot)}
            className={`text-center p-2 border text-xs transition-all rounded-none cursor-pointer flex flex-col justify-center items-center ${
              isAvailable
                ? "border-foreground/8 bg-background hover:border-bronze hover:bg-surface-warm"
                : "border-border bg-muted/20 opacity-40 cursor-not-allowed"
            }`}
          >
            <span className="font-semibold">{slot}</span>
            <span className="text-[9px] mt-0.5">
              {isAvailable ? `${seatsLeft} seats left` : "Fully Booked"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DetailsFormWidget({
  initialName,
  initialPhone,
  initialNotes,
  onSubmit,
}: {
  initialName: string;
  initialPhone: string;
  initialNotes: string;
  onSubmit: (name: string, phone: string, notes: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [notes, setNotes] = useState(initialNotes);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onSubmit(name.trim(), phone.trim(), notes.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 space-y-3 bg-background p-3 border border-foreground/8"
    >
      <div>
        <label className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground block mb-1">
          Full Name *
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full bg-background border border-foreground/8 px-2.5 py-1.5 text-xs outline-none focus:border-bronze rounded-none"
        />
      </div>
      <div>
        <label className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground block mb-1">
          Phone Number *
        </label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter phone number"
          className="w-full bg-background border border-foreground/8 px-2.5 py-1.5 text-xs outline-none focus:border-bronze rounded-none"
        />
      </div>
      <div>
        <label className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground block mb-1">
          Preferences (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any specific requests?"
          className="w-full bg-background border border-foreground/8 px-2.5 py-1.5 text-xs outline-none focus:border-bronze rounded-none resize-none h-12"
        />
      </div>
      <button
        type="submit"
        disabled={!name.trim() || !phone.trim()}
        className="w-full bg-foreground text-background hover:bg-bronze hover:text-white text-[10px] uppercase tracking-wider font-semibold py-2 transition-colors disabled:opacity-40 rounded-none cursor-pointer"
      >
        Continue
      </button>
    </form>
  );
}

function SummaryWidget({
  state,
  onConfirm,
  onStartOver,
  loading,
}: {
  state: ConciergeState;
  onConfirm: () => void;
  onStartOver: () => void;
  loading: boolean;
}) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "long",
    });
  };

  return (
    <div className="mt-3 border border-foreground/8 p-3 bg-background text-xs space-y-3">
      <div className="space-y-1.5 border-b border-foreground/5 pb-2.5">
        <div className="flex justify-between gap-4">
          <span className="text-light-gray uppercase text-[9px] tracking-wider">Salon</span>
          <span className="font-semibold text-foreground text-right">
            {state.selectedSalon?.name}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-light-gray uppercase text-[9px] tracking-wider">Service</span>
          <span className="font-semibold text-foreground text-right">
            {state.selectedService?.name}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-light-gray uppercase text-[9px] tracking-wider">Price</span>
          <span className="font-semibold text-bronze">₹{state.selectedService?.price}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-light-gray uppercase text-[9px] tracking-wider">Date</span>
          <span className="font-semibold text-foreground">{formatDate(state.selectedDate)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-light-gray uppercase text-[9px] tracking-wider">Time</span>
          <span className="font-semibold text-foreground">{state.selectedTime}</span>
        </div>
      </div>

      <div className="space-y-1.5 pb-1">
        <div className="flex justify-between gap-4">
          <span className="text-light-gray uppercase text-[9px] tracking-wider">Client</span>
          <span className="font-semibold text-foreground">{state.customerName}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-light-gray uppercase text-[9px] tracking-wider">Phone</span>
          <span className="font-semibold text-foreground">{state.customerPhone}</span>
        </div>
        {state.notes && (
          <div className="flex flex-col text-[11px] mt-1 pt-1 border-t border-foreground/5">
            <span className="text-light-gray uppercase text-[9px] tracking-wider mb-0.5">
              Notes
            </span>
            <span className="italic text-foreground/80">{state.notes}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onStartOver}
          className="flex-1 border border-border bg-background hover:bg-surface-warm text-[10px] uppercase tracking-wider font-semibold py-2 text-center transition-colors rounded-none cursor-pointer"
        >
          Reset
        </button>
        <button
          disabled={loading}
          onClick={onConfirm}
          className="flex-1 bg-foreground text-background hover:bg-bronze hover:text-white text-[10px] uppercase tracking-wider font-semibold py-2 text-center transition-colors rounded-none cursor-pointer flex justify-center items-center gap-1.5"
        >
          {loading && <Loader2 className="h-3 w-3 animate-spin" />}
          Confirm
        </button>
      </div>
    </div>
  );
}

function BookingSuccessWidget({
  bookingId,
  state,
  onStartOver,
}: {
  bookingId: string | undefined;
  state: ConciergeState;
  onStartOver: () => void;
}) {
  const refCode = bookingId ? `BLM-${bookingId.substring(0, 8).toUpperCase()}` : "BLM-CONFIRMED";
  return (
    <div className="mt-3 border border-emerald/20 p-3 bg-emerald/5 text-xs text-center space-y-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-emerald/10 flex items-center justify-center text-emerald mb-1">
          <Check className="h-4.5 w-4.5" />
        </div>
        <h4 className="font-semibold text-foreground">Appointment Scheduled!</h4>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Confirmed at {state.selectedSalon?.name}.
        </p>
      </div>

      <div className="bg-background border border-foreground/4 p-2 text-center rounded-none">
        <span className="text-[9px] uppercase tracking-wider text-light-gray block">
          Booking Reference
        </span>
        <span className="font-mono text-xs font-bold tracking-wider text-foreground">
          {refCode}
        </span>
      </div>

      <button
        onClick={onStartOver}
        className="w-full bg-foreground text-background hover:bg-bronze hover:text-white text-[10px] uppercase tracking-wider font-semibold py-2 transition-colors rounded-none cursor-pointer"
      >
        Done
      </button>
    </div>
  );
}
