/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { resolveSalonImage, type Salon } from "@/lib/salons";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Store,
  User as UserIcon,
  Settings,
  MessageSquare,
  Trash2,
  Plus,
  Sliders,
  Image as ImageIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as UiCalendar } from "@/components/ui/calendar";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | Bloom" }] }),
  component: Dashboard,
});

type Booking = {
  id: string;
  salon_id: string;
  service_name: string;
  service_price: number;
  booking_date: string;
  booking_time: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  notes: string | null;
  created_at: string;
  payment_status?: string;
  payment_method?: string | null;
  payment_id?: string | null;
  order_id?: string | null;
  advance_paid?: number;
};

type Holiday = {
  id: string;
  salon_id: string;
  holiday_date: string;
  reason: string | null;
  created_at: string;
};

type SpecialRequest = {
  id: string;
  salon_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  preferred_date: string | null;
  message: string;
  status: string;
  created_at: string;
};

const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function Dashboard() {
  const { user, isSalonOwner, roles } = useAuth();
  const [tab, setTab] = useState<"customer" | "owner">("customer");
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [ownedSalons, setOwnedSalons] = useState<Salon[]>([]);
  const [salonBookings, setSalonBookings] = useState<(Booking & { salon_name: string })[]>([]);
  const [allSalons, setAllSalons] = useState<Salon[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [pickSlug, setPickSlug] = useState("");

  // Owner Switcher & Sub-tabs
  const [selectedSalonId, setSelectedSalonId] = useState("");
  const [ownerTab, setOwnerTab] = useState<"bookings" | "requests" | "settings">("bookings");
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [specialRequests, setSpecialRequests] = useState<SpecialRequest[]>([]);

  // Settings State
  const [maxHour, setMaxHour] = useState(1);
  const [maxDay, setMaxDay] = useState(20);
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [localHours, setLocalHours] = useState<Record<string, { open: string; close: string }>>({});

  useEffect(() => {
    if (!user) return;
    // My bookings (as customer)
    supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("booking_date", { ascending: false })
      .then(({ data }) => setMyBookings((data ?? []) as Booking[]));

    // Available salons to claim (no owner yet)
    supabase
      .from("salons")
      .select("*")
      .is("owner_id", null)
      .then(({ data }) => setAllSalons((data ?? []) as unknown as Salon[]));
  }, [user, claiming]);

  // Load owned salons based on role
  useEffect(() => {
    if (!user) return;
    if (roles.includes("admin")) {
      // Super admin / judge sees ALL salons
      supabase
        .from("salons")
        .select("*")
        .then(({ data }) => {
          const list = (data ?? []) as unknown as Salon[];
          setOwnedSalons(list);
          if (list.length > 0 && !selectedSalonId) {
            setSelectedSalonId(list[0].id);
          }
        });
    } else {
      // Normal owners see only their owned salons
      supabase
        .from("salons")
        .select("*")
        .eq("owner_id", user.id)
        .then(({ data }) => {
          const list = (data ?? []) as unknown as Salon[];
          setOwnedSalons(list);
          if (list.length > 0 && !selectedSalonId) {
            setSelectedSalonId(list[0].id);
          }
        });
    }
  }, [user, roles, selectedSalonId]);

  // Load bookings, holidays and special requests for owned salons
  useEffect(() => {
    if (!user || ownedSalons.length === 0) {
      setSalonBookings([]);
      setHolidays([]);
      setSpecialRequests([]);
      return;
    }
    const ids = ownedSalons.map((s) => s.id);

    // 1. Fetch bookings
    supabase
      .from("bookings")
      .select("*")
      .in("salon_id", ids)
      .order("booking_date", { ascending: true })
      .then(({ data }) => {
        const enriched = (data ?? []).map((b) => ({
          ...(b as Booking),
          salon_name: ownedSalons.find((s) => s.id === b.salon_id)?.name ?? "",
        }));
        setSalonBookings(enriched);
      });

    // 2. Fetch holidays
    supabase
      .from("salon_holidays")
      .select("*")
      .in("salon_id", ids)
      .order("holiday_date", { ascending: true })
      .then(({ data }) => setHolidays((data ?? []) as Holiday[]));

    // 3. Fetch special requests
    supabase
      .from("special_requests")
      .select("*")
      .in("salon_id", ids)
      .order("created_at", { ascending: false })
      .then(({ data }) => setSpecialRequests((data ?? []) as SpecialRequest[]));
  }, [user, ownedSalons]);

  // Populate capacities and operating hours when selected salon changes
  const activeSalon = useMemo(() => {
    return ownedSalons.find((s) => s.id === selectedSalonId);
  }, [ownedSalons, selectedSalonId]);

  useEffect(() => {
    if (activeSalon) {
      setMaxHour(activeSalon.max_bookings_per_hour ?? 1);
      setMaxDay(activeSalon.max_bookings_per_day ?? 20);
      if (activeSalon.operating_hours) {
        setLocalHours(activeSalon.operating_hours);
      } else {
        const defaults: Record<string, { open: string; close: string }> = {};
        weekdays.forEach((day) => {
          defaults[day] = { open: "09:00", close: "18:00" };
        });
        setLocalHours(defaults);
      }
    }
  }, [activeSalon]);

  useEffect(() => {
    if (isSalonOwner) setTab("owner");
  }, [isSalonOwner]);

  const claimSalon = async (slug: string) => {
    if (!user || !slug) return;
    setClaiming(true);
    try {
      if (!roles.includes("salon_owner")) {
        const { error: roleErr } = await supabase
          .from("user_roles")
          .insert({ user_id: user.id, role: "salon_owner" });
        if (roleErr && !roleErr.message.includes("duplicate")) throw roleErr;
      }
      const { error: salonErr, data } = await supabase
        .from("salons")
        .update({ owner_id: user.id })
        .eq("slug", slug)
        .is("owner_id", null)
        .select()
        .maybeSingle();
      if (salonErr) throw salonErr;
      if (!data) {
        toast.error("This salon is already claimed.");
        return;
      }
      toast.success(`You now manage ${data.name}!`);
      setPickSlug("");
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't claim salon");
    } finally {
      setClaiming(false);
    }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      toast.error("Couldn't update booking");
      return;
    }
    toast.success(`Booking marked ${status}`);
    setSalonBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  };

  const updateRequestStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("special_requests").update({ status }).eq("id", id);
    if (error) {
      toast.error("Failed to update request");
      return;
    }
    toast.success(`Request marked ${status}`);
    setSpecialRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  // Settings Savers
  const saveCapacities = async () => {
    if (!activeSalon) return;
    setSavingSettings(true);
    const { error } = await supabase
      .from("salons")
      .update({
        max_bookings_per_hour: maxHour,
        max_bookings_per_day: maxDay,
      } as any)
      .eq("id", activeSalon.id);

    setSavingSettings(false);
    if (error) {
      toast.error("Failed to save capacity settings");
    } else {
      toast.success("Capacity settings saved!");
      setOwnedSalons((prev) =>
        prev.map((s) =>
          s.id === activeSalon.id
            ? { ...s, max_bookings_per_hour: maxHour, max_bookings_per_day: maxDay }
            : s,
        ),
      );
    }
  };

  const handleHourChange = (day: string, field: "open" | "close", val: string) => {
    setLocalHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: val,
      },
    }));
  };

  const saveOperatingHours = async () => {
    if (!activeSalon) return;
    setSavingSettings(true);
    const { error } = await supabase
      .from("salons")
      .update({ operating_hours: localHours } as any)
      .eq("id", activeSalon.id);

    setSavingSettings(false);
    if (error) {
      toast.error("Failed to save operating hours");
    } else {
      toast.success("Operating hours saved!");
      setOwnedSalons((prev) =>
        prev.map((s) => (s.id === activeSalon.id ? { ...s, operating_hours: localHours } : s)),
      );
    }
  };

  const addHoliday = async () => {
    if (!activeSalon || !newHolidayDate) return;
    const { data, error } = await supabase
      .from("salon_holidays")
      .insert({
        salon_id: activeSalon.id,
        holiday_date: newHolidayDate,
        reason: "Closed",
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add holiday date");
    } else {
      toast.success("Closed date added!");
      setHolidays((prev) => [...prev, data as Holiday]);
      setNewHolidayDate("");
    }
  };

  const removeHoliday = async (id: string) => {
    const { error } = await supabase.from("salon_holidays").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove holiday");
    } else {
      toast.success("Closed date removed");
      setHolidays((prev) => prev.filter((h) => h.id !== id));
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const activeSalonBookings = salonBookings.filter((b) => b.salon_id === selectedSalonId);
  const activeSalonRequests = specialRequests.filter((r) => r.salon_id === selectedSalonId);
  const activeSalonHolidays = holidays.filter((h) => h.salon_id === selectedSalonId);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-primary">Dashboard</div>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            Hi {user?.user_metadata?.full_name ?? user?.email?.split("@")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
        >
          Sign out
        </button>
      </div>

      <div className="mt-8 inline-flex rounded-full border border-border bg-card p-1">
        <TabBtn active={tab === "customer"} onClick={() => setTab("customer")}>
          <UserIcon className="h-3.5 w-3.5" /> My bookings
        </TabBtn>
        <TabBtn active={tab === "owner"} onClick={() => setTab("owner")}>
          <Store className="h-3.5 w-3.5" /> Salon owner
        </TabBtn>
      </div>

      {tab === "customer" && (
        <section className="mt-8">
          {myBookings.length === 0 ? (
            <EmptyState
              title="No bookings yet"
              body="Browse Bloom's curated luxury salons and book your first appointment."
              cta={
                <Link to="/browse" className="btn-primary">
                  Browse salons
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4">
              {myBookings.map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "owner" && (
        <section className="mt-8 space-y-6">
          {ownedSalons.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-8">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Onboard your salon
              </div>
              <h2 className="mt-2 font-display text-2xl">Claim your salon listing</h2>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                Bloom seeds the city's top studios. Pick yours to start managing bookings, services
                and availability.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Select value={pickSlug} onValueChange={setPickSlug}>
                  <SelectTrigger className="min-w-[260px] rounded-none border border-border bg-background px-3 py-2.5 text-sm h-[42px] text-left font-sans shadow-none focus:ring-0 focus:border-bronze">
                    <SelectValue placeholder="Select a salon…" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border border-foreground/10 bg-background shadow-lift">
                    {allSalons.map((s) => (
                      <SelectItem
                        key={s.id}
                        value={s.slug}
                        className="text-sm py-2 cursor-pointer focus:bg-bronze/5 focus:text-bronze rounded-none"
                      >
                        {s.name} · {s.neighborhood}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  onClick={() => claimSalon(pickSlug)}
                  disabled={!pickSlug || claiming}
                  className="btn-primary disabled:opacity-50 cursor-pointer"
                >
                  {claiming ? "Claiming…" : "Claim salon"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* SALON SWITCHER DROPDOWN */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border border-foreground/10 bg-surface-warm p-6 mb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-bronze font-bold">
                    Currently Managing
                  </span>
                  <div className="mt-2 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Store className="h-5 w-5 text-bronze" />
                    <Select value={selectedSalonId} onValueChange={setSelectedSalonId}>
                      <SelectTrigger className="w-auto min-w-[280px] font-display text-xl sm:text-2xl bg-transparent border-none shadow-none focus:ring-0 hover:text-bronze transition-colors p-0 justify-start gap-2 h-auto text-foreground font-semibold">
                        <SelectValue placeholder="Select a salon..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ownedSalons.map((s) => (
                          <SelectItem key={s.id} value={s.id} className="font-sans text-sm py-2">
                            {s.name} ({s.neighborhood})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {activeSalon && (
                  <Link
                    to="/salons/$slug"
                    params={{ slug: activeSalon.slug }}
                    className="inline-flex items-center gap-2 border border-foreground/15 bg-background px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] font-semibold hover:border-bronze hover:text-bronze transition-all"
                  >
                    View public page →
                  </Link>
                )}
              </div>

              {/* STATS PANEL */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <Stat
                  label="Upcoming Bookings"
                  value={activeSalonBookings
                    .filter((b) => b.status === "pending" || b.status === "confirmed")
                    .length.toString()}
                />
                <Stat
                  label="Special Requests"
                  value={activeSalonRequests.filter((r) => r.status !== "closed").length.toString()}
                />
                <Stat
                  label="Total est. revenue"
                  value={`₹${activeSalonBookings
                    .filter((b) => b.status !== "cancelled")
                    .reduce((s, b) => s + b.service_price, 0)
                    .toLocaleString("en-IN")}`}
                />
              </div>

              {/* SUB-TABS SELECTOR */}
              <div className="flex border-b border-foreground/10 mt-8">
                <button
                  onClick={() => setOwnerTab("bookings")}
                  className={`pb-3 text-[10px] uppercase tracking-[0.2em] font-semibold border-b-2 mr-8 flex items-center gap-2 cursor-pointer transition ${
                    ownerTab === "bookings"
                      ? "border-bronze text-foreground"
                      : "border-transparent text-warm-gray hover:text-foreground"
                  }`}
                >
                  <Calendar className="h-4 w-4" /> Bookings
                </button>
                <button
                  onClick={() => setOwnerTab("requests")}
                  className={`pb-3 text-[10px] uppercase tracking-[0.2em] font-semibold border-b-2 mr-8 flex items-center gap-2 cursor-pointer transition ${
                    ownerTab === "requests"
                      ? "border-bronze text-foreground"
                      : "border-transparent text-warm-gray hover:text-foreground"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" /> Special Requests
                </button>
                <button
                  onClick={() => setOwnerTab("settings")}
                  className={`pb-3 text-[10px] uppercase tracking-[0.2em] font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition ${
                    ownerTab === "settings"
                      ? "border-bronze text-foreground"
                      : "border-transparent text-warm-gray hover:text-foreground"
                  }`}
                >
                  <Settings className="h-4 w-4" /> Settings
                </button>
              </div>

              {/* TAB CONTENT: BOOKINGS */}
              {ownerTab === "bookings" && (
                <div className="border border-foreground/10 bg-background overflow-hidden mt-6">
                  {activeSalonBookings.length === 0 ? (
                    <div className="p-10 text-center text-sm text-warm-gray">
                      No bookings yet for this salon.
                    </div>
                  ) : (
                    <div className="divide-y divide-foreground/6">
                      {activeSalonBookings.map((b) => (
                        <div
                          key={b.id}
                          className="flex flex-wrap items-center gap-4 p-5 hover:bg-surface-warm/50 transition"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[15px]">{b.service_name}</div>
                            <div className="text-xs text-warm-gray mt-1 flex flex-wrap items-center gap-1.5">
                              <span>
                                Guest:{" "}
                                <span className="font-medium text-foreground">
                                  {b.customer_name}
                                </span>{" "}
                                · {b.customer_phone}
                              </span>
                              {b.advance_paid && b.advance_paid > 0 ? (
                                <span className="text-bronze font-bold bg-bronze/5 border border-bronze/10 px-1.5 py-0.5 rounded-none uppercase tracking-wider text-[8px]">
                                  Paid Deposit: ₹{b.advance_paid} ({b.payment_method})
                                </span>
                              ) : null}
                            </div>
                            {b.notes && (
                              <div className="mt-2 text-xs italic text-warm-gray bg-surface-warm p-2 border border-foreground/5 max-w-lg">
                                "{b.notes}"
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-[13px]">
                              {formatDate(b.booking_date)}
                            </div>
                            <div className="text-xs text-warm-gray mt-0.5">{b.booking_time}</div>
                          </div>
                          <div className="font-display text-lg px-4">
                            ₹{b.service_price.toLocaleString("en-IN")}
                          </div>
                          <div className="flex items-center gap-3">
                            <StatusPill status={b.status} />
                            {(b.status === "pending" || b.status === "pending_payment") && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => updateBookingStatus(b.id, "confirmed")}
                                  className="rounded-none bg-foreground px-3 py-1.5 text-[9px] uppercase tracking-wider font-semibold text-background hover:bg-bronze transition cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => updateBookingStatus(b.id, "cancelled")}
                                  className="rounded-none border border-foreground/10 px-3 py-1.5 text-[9px] uppercase tracking-wider font-semibold hover:border-red-600 hover:text-red-600 transition cursor-pointer"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: SPECIAL REQUESTS */}
              {ownerTab === "requests" && (
                <div className="border border-foreground/10 bg-background overflow-hidden mt-6">
                  {activeSalonRequests.length === 0 ? (
                    <div className="p-10 text-center text-sm text-warm-gray">
                      No special requests for this salon.
                    </div>
                  ) : (
                    <div className="divide-y divide-foreground/6">
                      {activeSalonRequests.map((r) => (
                        <div
                          key={r.id}
                          className="p-5 hover:bg-surface-warm/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[15px]">{r.customer_name}</span>
                              <span className="text-[9px] uppercase tracking-wider bg-bronze/10 text-bronze px-2 py-0.5 font-bold">
                                {r.status}
                              </span>
                            </div>
                            <div className="text-xs text-warm-gray">
                              Phone: {r.customer_phone}{" "}
                              {r.customer_email && `· Email: ${r.customer_email}`}
                            </div>
                            {r.preferred_date && (
                              <div className="text-xs text-foreground/80 flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-bronze" /> Preferred:{" "}
                                {formatDate(r.preferred_date)}
                              </div>
                            )}
                            <p className="text-[13px] bg-surface-warm p-3 border border-foreground/5 max-w-2xl italic text-foreground mt-2">
                              "{r.message}"
                            </p>
                          </div>
                          {r.status !== "closed" && (
                            <div className="flex gap-2 self-start sm:self-center">
                              {r.status === "new" && (
                                <button
                                  onClick={() => updateRequestStatus(r.id, "contacted")}
                                  className="rounded-none bg-foreground px-3.5 py-2 text-[9px] uppercase tracking-wider font-semibold text-background hover:bg-bronze transition cursor-pointer"
                                >
                                  Mark Contacted
                                </button>
                              )}
                              <button
                                onClick={() => updateRequestStatus(r.id, "closed")}
                                className="rounded-none border border-foreground/15 px-3.5 py-2 text-[9px] uppercase tracking-wider font-semibold hover:border-foreground transition cursor-pointer"
                              >
                                Close Request
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: SETTINGS */}
              {ownerTab === "settings" && activeSalon && (
                <div className="grid gap-6 md:grid-cols-2 mt-6">
                  {/* CAPACITIES & GENERAL */}
                  <div className="border border-foreground/10 p-6 bg-surface-warm space-y-6">
                    <h3 className="font-display text-xl border-b border-foreground/5 pb-2">
                      Booking Capacity Limits
                    </h3>

                    <div className="space-y-4">
                      <label className="block">
                        <span className="mb-2 block text-[10px] uppercase tracking-wider font-semibold text-warm-gray">
                          Max Bookings Per Time Slot (Hour)
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={maxHour}
                          onChange={(e) => setMaxHour(parseInt(e.target.value) || 1)}
                          className="w-full border border-foreground/10 bg-background px-4 py-2.5 text-[14px] outline-none focus:border-bronze"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-[10px] uppercase tracking-wider font-semibold text-warm-gray">
                          Max Bookings Per Day
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={maxDay}
                          onChange={(e) => setMaxDay(parseInt(e.target.value) || 20)}
                          className="w-full border border-foreground/10 bg-background px-4 py-2.5 text-[14px] outline-none focus:border-bronze"
                        />
                      </label>
                    </div>

                    <button
                      onClick={saveCapacities}
                      disabled={savingSettings}
                      className="w-full bg-foreground text-background py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-bronze transition cursor-pointer disabled:opacity-40"
                    >
                      {savingSettings ? "Saving..." : "Save Capacity Limits"}
                    </button>
                  </div>

                  {/* HOLIDAYS MANAGER */}
                  <div className="border border-foreground/10 p-6 bg-surface-warm space-y-6">
                    <h3 className="font-display text-xl border-b border-foreground/5 pb-2">
                      Salon Holiday Dates
                    </h3>

                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex-1 text-left bg-background border border-foreground/10 px-4 py-2.5 text-[13px] outline-none focus:border-bronze rounded-none cursor-pointer flex justify-between items-center hover:border-foreground/30 transition-colors">
                            <span className="text-foreground">
                              {newHolidayDate
                                ? new Date(newHolidayDate + "T00:00:00").toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )
                                : "Select a date..."}
                            </span>
                            <Calendar className="h-4 w-4 text-warm-gray" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 rounded-none border border-foreground/10 bg-background shadow-lift"
                          align="start"
                        >
                          <UiCalendar
                            mode="single"
                            selected={
                              newHolidayDate ? new Date(newHolidayDate + "T00:00:00") : undefined
                            }
                            onSelect={(date) => {
                              if (date) {
                                const yyyy = date.getFullYear();
                                const mm = String(date.getMonth() + 1).padStart(2, "0");
                                const dd = String(date.getDate()).padStart(2, "0");
                                setNewHolidayDate(`${yyyy}-${mm}-${dd}`);
                              } else {
                                setNewHolidayDate("");
                              }
                            }}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return date < today;
                            }}
                            className="rounded-none border-0"
                          />
                        </PopoverContent>
                      </Popover>
                      <button
                        onClick={addHoliday}
                        className="bg-foreground text-background px-4 py-2 text-[10px] uppercase tracking-[0.1em] font-bold hover:bg-bronze transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" /> Add Date
                      </button>
                    </div>

                    <div className="max-h-[220px] overflow-y-auto border border-foreground/5 bg-background p-3">
                      {activeSalonHolidays.length === 0 ? (
                        <div className="text-center text-xs text-warm-gray py-8">
                          No holidays scheduled.
                        </div>
                      ) : (
                        <ul className="divide-y divide-foreground/5">
                          {activeSalonHolidays.map((h) => (
                            <li
                              key={h.id}
                              className="flex justify-between items-center py-2 text-sm"
                            >
                              <span className="font-medium">{formatDate(h.holiday_date)}</span>
                              <button
                                onClick={() => removeHoliday(h.id)}
                                className="text-red-500 hover:text-red-700 p-1 cursor-pointer transition"
                                title="Remove Holiday"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* OPERATING HOURS */}
                  <div className="border border-foreground/10 p-6 bg-surface-warm space-y-6 md:col-span-2">
                    <h3 className="font-display text-xl border-b border-foreground/5 pb-2">
                      Weekly Operating Hours
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {weekdays.map((day) => {
                        const dayHours = localHours[day] || { open: "09:00", close: "18:00" };
                        return (
                          <div
                            key={day}
                            className="border border-foreground/5 bg-background p-4 flex flex-col justify-between"
                          >
                            <span className="text-[10px] uppercase tracking-wider font-bold text-bronze capitalize block mb-2">
                              {day}
                            </span>
                            <div className="flex gap-2">
                              <label className="flex-1 block">
                                <span className="text-[8px] uppercase text-warm-gray block mb-1">
                                  Open
                                </span>
                                <input
                                  type="time"
                                  value={dayHours.open}
                                  onChange={(e) => handleHourChange(day, "open", e.target.value)}
                                  className="w-full border border-foreground/10 bg-surface-warm px-2 py-1 text-xs outline-none focus:border-bronze"
                                />
                              </label>
                              <label className="flex-1 block">
                                <span className="text-[8px] uppercase text-warm-gray block mb-1">
                                  Close
                                </span>
                                <input
                                  type="time"
                                  value={dayHours.close}
                                  onChange={(e) => handleHourChange(day, "close", e.target.value)}
                                  className="w-full border border-foreground/10 bg-surface-warm px-2 py-1 text-xs outline-none focus:border-bronze"
                                />
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={saveOperatingHours}
                      disabled={savingSettings}
                      className="bg-foreground text-background w-full py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-bronze transition cursor-pointer disabled:opacity-40"
                    >
                      {savingSettings ? "Saving Hours..." : "Save Operating Hours"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <style>{`
        .btn-primary { display:inline-flex; align-items:center; gap:8px; border-radius:9999px; background:var(--color-foreground); color:var(--color-background); padding:10px 20px; font-size:14px; font-weight:500; }
      `}</style>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition ${
        active ? "bg-foreground text-background" : "text-foreground/70 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ title, body, cta }: { title: string; body: string; cta: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent">
        <Calendar className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-display text-xl">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <div className="mt-5">{cta}</div>
    </div>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex-1 min-w-0">
        <div className="font-medium">{booking.service_name}</div>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(booking.booking_date)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {booking.booking_time}
          </span>
        </div>
      </div>
      <div className="font-display text-lg">₹{booking.service_price.toLocaleString("en-IN")}</div>
      <StatusPill status={booking.status} />
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    pending_payment: "bg-orange-100 text-orange-800",
    confirmed: "bg-emerald/15 text-emerald",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-foreground/10 text-foreground",
  };
  const label = status === "pending_payment" ? "pending deposit" : status;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${styles[status] ?? styles.pending}`}
    >
      {status === "confirmed" && <CheckCircle2 className="h-3 w-3" />}
      {label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl">{value}</div>
    </div>
  );
}

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
}
