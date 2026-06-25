/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { presetImageKeys, resolveSalonImage, type Salon, type SalonService } from "@/lib/salons";
import { Label } from "@/components/ui/label";
import { createRazorpayQR, checkRazorpayPaymentStatus } from "@/lib/api/payment.functions";
import {
  Plus,
  Store,
  CheckCircle2,
  Clock4,
  XCircle,
  Eye,
  Calendar,
  Inbox,
  Settings as Cog,
  TrendingUp,
  Trash2,
  Image as ImageIcon,
  Printer,
  Check,
  CreditCard,
  QrCode,
  DollarSign,
  Loader2,
} from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as UiCalendar } from "@/components/ui/calendar";

export const Route = createFileRoute("/_authenticated/admin/salons")({
  head: () => ({ meta: [{ title: "Salons panel | Bloom Admin" }] }),
  component: SalonsPanel,
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

type Holiday = { id: string; salon_id: string; holiday_date: string; reason: string | null };
type SpecialReq = {
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

type Tab =
  | "bookings"
  | "profile"
  | "services"
  | "hours"
  | "holidays"
  | "requests"
  | "sales"
  | "billing";

function SalonsPanel() {
  const { user, isAdmin } = useAuth();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!user) return;
    const q = isAdmin
      ? supabase.from("salons").select("*").order("created_at", { ascending: false })
      : supabase
          .from("salons")
          .select("*")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });
    q.then(({ data }) => {
      const list = (data ?? []) as unknown as Salon[];
      setSalons(list);
      if (!activeId && list[0]) setActiveId(list[0].id);
    });
  }, [user, isAdmin, reloadKey, activeId]);

  const active = useMemo(() => salons.find((s) => s.id === activeId) ?? null, [salons, activeId]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-primary">
            <Store className="h-3.5 w-3.5" /> Salons panel
          </div>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            {isAdmin ? "All Bloom salons" : "Your salons"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? "View, edit and manage every listing on the platform."
              : "Submit listings, customize profiles, manage bookings, holidays and special requests."}
          </p>
        </div>
        <Link
          to="/list-your-salon"
          className="inline-flex items-center gap-1.5 rounded-none bg-foreground hover:bg-bronze hover:text-white px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-background transition-colors duration-300"
        >
          <Plus className="h-3.5 w-3.5" /> Submit new salon
        </Link>
      </header>

      {salons.length === 0 ? (
        <div className="rounded-none border border-dashed border-foreground/10 bg-card p-10 text-center">
          <h3 className="font-display text-xl tracking-wide">No salons yet</h3>
          <p className="mt-2 text-xs text-muted-foreground max-w-md mx-auto">
            Submit your first listing. Our HQ team reviews each one before it goes live.
          </p>
          <Link
            to="/list-your-salon"
            className="mt-6 inline-flex items-center gap-1.5 rounded-none bg-foreground hover:bg-bronze hover:text-white px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-background transition-colors duration-300"
          >
            <Plus className="h-3.5 w-3.5" /> Submit your salon
          </Link>
        </div>
      ) : (
        <div className={isAdmin ? "grid gap-6 lg:grid-cols-[260px_1fr]" : "block"}>
          {/* Salon list */}
          {isAdmin && (
            <div className="space-y-2 mb-6 lg:mb-0">
              {salons.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={`flex w-full items-center gap-3 rounded-none border p-3.5 text-left transition-all duration-300 ${
                    activeId === s.id
                      ? "border-bronze bg-card text-foreground"
                      : "border-foreground/8 bg-card/40 hover:bg-card hover:border-foreground/20"
                  }`}
                >
                  <img
                    src={resolveSalonImage(s.image_url)}
                    className="h-12 w-12 rounded-none object-cover border border-foreground/5"
                    alt={s.name}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold uppercase tracking-wider">
                      {s.name}
                    </div>
                    <div className="truncate text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                      {s.neighborhood}
                    </div>
                  </div>
                  <StatusBadge status={s.status ?? "approved"} published={s.published ?? true} />
                </button>
              ))}
            </div>
          )}

          {/* Detail view */}
          {active && <SalonDetail salon={active} onChange={refresh} key={active.id} />}
        </div>
      )}
    </div>
  );
}

function SalonDetail({ salon, onChange }: { salon: Salon; onChange: () => void }) {
  const [tab, setTab] = useState<Tab>("bookings");

  const status = salon.status ?? "approved";
  const approved = status === "approved";

  const tabs: { id: Tab; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
    { id: "bookings", label: "Bookings", icon: <Calendar className="h-3.5 w-3.5" /> },
    {
      id: "profile",
      label: "Profile",
      icon: <ImageIcon className="h-3.5 w-3.5" />,
      disabled: !approved,
    },
    {
      id: "services",
      label: "Services",
      icon: <Cog className="h-3.5 w-3.5" />,
      disabled: !approved,
    },
    {
      id: "hours",
      label: "Hours & capacity",
      icon: <Clock4 className="h-3.5 w-3.5" />,
      disabled: !approved,
    },
    {
      id: "holidays",
      label: "Holidays",
      icon: <XCircle className="h-3.5 w-3.5" />,
      disabled: !approved,
    },
    { id: "requests", label: "Special requests", icon: <Inbox className="h-3.5 w-3.5" /> },
    { id: "sales", label: "Sales", icon: <TrendingUp className="h-3.5 w-3.5" /> },
    {
      id: "billing",
      label: "Billing / POS",
      icon: <Printer className="h-3.5 w-3.5" />,
      disabled: !approved,
    },
  ];

  return (
    <div className="min-w-0 space-y-5">
      {/* Header */}
      <div className="overflow-hidden rounded-none border border-foreground/8 bg-card shadow-none">
        <div className="flex flex-wrap items-center gap-5 p-6">
          <img
            src={resolveSalonImage(salon.image_url)}
            alt={salon.name}
            className="h-16 w-16 rounded-none object-cover border border-foreground/5"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl tracking-wide">{salon.name}</h2>
              <StatusBadge status={status} published={salon.published ?? true} />
            </div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">
              {salon.neighborhood} · {salon.hours}
            </div>
          </div>
          {approved && salon.published && (
            <Link
              to="/salons/$slug"
              params={{ slug: salon.slug }}
              className="inline-flex items-center gap-1.5 rounded-none border border-foreground/15 px-4 py-2 text-[10px] uppercase tracking-widest font-semibold hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-300"
            >
              <Eye className="h-3.5 w-3.5" /> View public page
            </Link>
          )}
        </div>

        {/* Status banner */}
        {status === "pending" && (
          <div className="border-t border-foreground/8 bg-amber-500/5 px-6 py-3 text-xs text-amber-700 font-medium">
            ⏳ Awaiting HQ review. Once approved you'll be able to customize your full profile,
            services and hours.
          </div>
        )}
        {status === "rejected" && (
          <div className="border-t border-foreground/8 bg-red-500/5 px-6 py-3 text-xs text-red-700 font-medium">
            ❌ Rejected: {salon.rejection_reason ?? "Not specified"}. You can submit a new listing.
          </div>
        )}
        {approved && !salon.published && <PublishToggle salon={salon} onChange={onChange} />}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-foreground/10 bg-transparent px-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            disabled={t.disabled}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-3 text-[10px] uppercase tracking-widest font-semibold transition-all duration-300 border-b-2 -mb-[2px] disabled:cursor-not-allowed disabled:opacity-30 ${
              tab === t.id
                ? "border-bronze text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-foreground/10"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-none border border-foreground/8 bg-card p-6 shadow-none">
        {tab === "bookings" && <BookingsTab salonId={salon.id} />}
        {tab === "profile" && approved && <ProfileTab salon={salon} onChange={onChange} />}
        {tab === "services" && approved && <ServicesTab salon={salon} onChange={onChange} />}
        {tab === "hours" && approved && <HoursTab salon={salon} onChange={onChange} />}
        {tab === "holidays" && approved && <HolidaysTab salon={salon} onChange={onChange} />}
        {tab === "requests" && <RequestsTab salonId={salon.id} />}
        {tab === "sales" && <SalesTab salonId={salon.id} />}
        {tab === "billing" && approved && <BillingTab salon={salon} onChange={onChange} />}
      </div>
    </div>
  );
}

// ============== Status badge ==============
function StatusBadge({ status, published }: { status: string; published: boolean }) {
  const map: Record<string, { c: string; t: string; icon: React.ReactNode }> = {
    pending: {
      c: "border-amber-500/20 text-amber-600 bg-amber-500/5",
      t: "Pending",
      icon: <Clock4 className="h-2.5 w-2.5" />,
    },
    approved: published
      ? {
          c: "border-bronze/30 text-bronze bg-bronze/5",
          t: "Live",
          icon: <CheckCircle2 className="h-2.5 w-2.5" />,
        }
      : {
          c: "border-foreground/10 text-muted-foreground bg-foreground/5",
          t: "Draft",
          icon: <CheckCircle2 className="h-2.5 w-2.5" />,
        },
    rejected: {
      c: "border-red-500/20 text-red-600 bg-red-500/5",
      t: "Rejected",
      icon: <XCircle className="h-2.5 w-2.5" />,
    },
  };
  const m = map[status] ?? map.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-none px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${m.c}`}
    >
      {m.icon}
      {m.t}
    </span>
  );
}

// ============== Publish toggle ==============
function PublishToggle({ salon, onChange }: { salon: Salon; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const publish = async () => {
    setBusy(true);
    const { error } = await supabase.from("salons").update({ published: true }).eq("id", salon.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Your salon is now live!");
    onChange();
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/8 bg-bronze/5 px-6 py-4 text-xs">
      <span className="text-bronze font-medium">
        ✅ Approved by HQ. Finish customizing your profile, then publish to go live.
      </span>
      <button
        onClick={publish}
        disabled={busy}
        className="rounded-none bg-bronze hover:bg-foreground hover:text-background text-white px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold transition-all duration-300 disabled:opacity-50"
      >
        {busy ? "Publishing…" : "Publish & go live"}
      </button>
    </div>
  );
}

// ============== Bookings tab ==============
function BookingsTab({ salonId }: { salonId: string }) {
  const [list, setList] = useState<Booking[]>([]);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    supabase
      .from("bookings")
      .select("*")
      .eq("salon_id", salonId)
      .order("booking_date", { ascending: false })
      .order("booking_time", { ascending: true })
      .then(({ data }) => setList((data ?? []) as Booking[]));
  }, [salonId, reload]);

  const update = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`);
    setReload((k) => k + 1);
  };

  if (list.length === 0)
    return <Empty title="No bookings yet" subtitle="Once customers book, they'll appear here." />;

  // Group by date, then by time
  const grouped = list.reduce(
    (acc, b) => {
      if (!acc[b.booking_date]) acc[b.booking_date] = {};
      const time = b.booking_time.slice(0, 5);
      if (!acc[b.booking_date][time]) acc[b.booking_date][time] = [];
      acc[b.booking_date][time].push(b);
      return acc;
    },
    {} as Record<string, Record<string, Booking[]>>,
  );

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([date, timeGroups]) => (
        <div key={date} className="space-y-4">
          <h3 className="font-display text-lg tracking-wide border-b border-foreground/8 pb-2">
            {new Date(date).toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h3>
          <div className="space-y-4">
            {Object.entries(timeGroups).map(([time, bookings]) => (
              <div
                key={time}
                className="rounded-none border border-foreground/8 bg-surface-warm/30 p-5"
              >
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-bronze">
                  <Clock4 className="h-4 w-4" /> {time} ({bookings.length} bookings)
                </div>
                <div className="divide-y divide-foreground/8 border-t border-foreground/8">
                  {bookings.map((b) => (
                    <div
                      key={b.id}
                      className="flex flex-wrap items-center gap-4 py-4 first:pt-4 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold uppercase tracking-wider">
                          {b.service_name}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 flex flex-wrap items-center gap-2">
                          <span>
                            {b.customer_name} · {b.customer_phone}
                          </span>
                          {b.advance_paid && b.advance_paid > 0 ? (
                            <span className="text-bronze font-bold bg-bronze/5 border border-bronze/10 px-1.5 py-0.5 rounded-none uppercase tracking-wider text-[8px]">
                              Paid Deposit: ₹{b.advance_paid} ({b.payment_method})
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="font-display text-sm tracking-wide">
                        ₹{b.service_price.toLocaleString("en-IN")}
                      </div>
                      <BookingStatus status={b.status} />
                      {(b.status === "pending" || b.status === "pending_payment") && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => update(b.id, "confirmed")}
                            className="rounded-none bg-bronze hover:bg-foreground hover:text-background text-white px-4 py-2 text-[9px] uppercase tracking-widest font-bold transition-all duration-300"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => update(b.id, "cancelled")}
                            className="rounded-none border border-foreground/15 hover:bg-red-500 hover:text-white hover:border-red-500 px-4 py-2 text-[9px] uppercase tracking-widest font-bold transition-all duration-300"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {b.status === "confirmed" && (
                        <button
                          onClick={() => update(b.id, "completed")}
                          className="rounded-none border border-foreground/15 hover:bg-foreground hover:text-background px-4 py-2 text-[9px] uppercase tracking-widest font-bold transition-all duration-300"
                        >
                          Mark complete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BookingStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "border-amber-500/20 text-amber-600 bg-amber-500/5",
    pending_payment: "border-orange-500/30 text-orange-600 bg-orange-500/5",
    confirmed: "border-bronze/30 text-bronze bg-bronze/5",
    cancelled: "border-red-500/20 text-red-600 bg-red-500/5",
    completed: "border-foreground/10 text-muted-foreground bg-foreground/5",
  };
  const label = status === "pending_payment" ? "pending deposit" : status;
  return (
    <span
      className={`border rounded-none px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${styles[status] ?? styles.pending}`}
    >
      {label}
    </span>
  );
}

// ============== Profile tab ==============
function ProfileTab({ salon, onChange }: { salon: Salon; onChange: () => void }) {
  const [f, setF] = useState({
    name: salon.name,
    tagline: salon.tagline ?? "",
    description: salon.description,
    neighborhood: salon.neighborhood,
    address: salon.address,
    phone: salon.phone ?? "",
    email: salon.email ?? "",
    instagram: salon.instagram ?? "",
    website: salon.website ?? "",
    price_tier: salon.price_tier,
    specialties: salon.specialties.join(", "),
    image_url: salon.image_url,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("salons")
      .update({
        name: f.name,
        tagline: f.tagline || null,
        description: f.description,
        neighborhood: f.neighborhood,
        address: f.address,
        phone: f.phone || null,
        email: f.email || null,
        instagram: f.instagram || null,
        website: f.website || null,
        price_tier: f.price_tier,
        specialties: f.specialties
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        image_url: f.image_url,
      })
      .eq("id", salon.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    onChange();
  };

  return (
    <div className="space-y-4">
      <Row label="Salon name">
        <Inp value={f.name} onChange={(v) => setF({ ...f, name: v })} />
      </Row>
      <Row label="Tagline">
        <Inp value={f.tagline} onChange={(v) => setF({ ...f, tagline: v })} />
      </Row>
      <Row label="Description">
        <Inp value={f.description} onChange={(v) => setF({ ...f, description: v })} textarea />
      </Row>
      <div className="grid gap-4 sm:grid-cols-2">
        <Row label="Neighborhood">
          <Inp value={f.neighborhood} onChange={(v) => setF({ ...f, neighborhood: v })} />
        </Row>
        <Row label="Price tier">
          <div className="flex gap-2">
            {["₹₹", "₹₹₹", "₹₹₹₹"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setF({ ...f, price_tier: p })}
                className={`rounded-none border px-4 py-2 text-xs font-bold transition-all duration-300 ${f.price_tier === p ? "border-foreground bg-foreground text-background" : "border-foreground/8 bg-card/20 hover:border-foreground/20"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </Row>
      </div>
      <Row label="Address">
        <Inp value={f.address} onChange={(v) => setF({ ...f, address: v })} />
      </Row>
      <div className="grid gap-4 sm:grid-cols-2">
        <Row label="Phone">
          <Inp value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
        </Row>
        <Row label="Email">
          <Inp value={f.email} onChange={(v) => setF({ ...f, email: v })} />
        </Row>
        <Row label="Instagram">
          <Inp value={f.instagram} onChange={(v) => setF({ ...f, instagram: v })} />
        </Row>
        <Row label="Website">
          <Inp value={f.website} onChange={(v) => setF({ ...f, website: v })} />
        </Row>
      </div>
      <Row label="Specialties (comma separated)">
        <Inp value={f.specialties} onChange={(v) => setF({ ...f, specialties: v })} />
      </Row>
      <Row label="Cover image">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {presetImageKeys.map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => setF({ ...f, image_url: k })}
              className={`overflow-hidden rounded-none border-2 transition-all duration-300 ${f.image_url === k ? "border-bronze" : "border-transparent opacity-60 hover:opacity-100"}`}
            >
              <img
                src={resolveSalonImage(k)}
                alt=""
                className="aspect-square w-full object-cover"
              />
            </button>
          ))}
        </div>
      </Row>
      <div className="flex justify-end pt-4">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-none bg-foreground hover:bg-bronze hover:text-white px-6 py-3.5 text-[10px] uppercase tracking-widest font-bold text-background transition-colors duration-300 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>
    </div>
  );
}

// ============== Services tab ==============
function ServicesTab({ salon, onChange }: { salon: Salon; onChange: () => void }) {
  const [list, setList] = useState<SalonService[]>(salon.services ?? []);
  const [draft, setDraft] = useState<SalonService>({ name: "", price: 0, duration: "" });
  const [saving, setSaving] = useState(false);

  const add = () => {
    if (!draft.name || !draft.duration || draft.price <= 0) return toast.error("Fill all fields");
    setList([...list, draft]);
    setDraft({ name: "", price: 0, duration: "" });
  };
  const remove = (i: number) => setList(list.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("salons").update({ services: list }).eq("id", salon.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Services saved");
    onChange();
  };

  return (
    <div className="space-y-4">
      <div className="divide-y divide-foreground/8 rounded-none border border-foreground/8">
        {list.length === 0 && (
          <div className="p-5 text-xs text-muted-foreground uppercase tracking-wider">
            No services yet.
          </div>
        )}
        {list.map((s, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider">{s.name}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                {s.duration}
              </div>
            </div>
            <div className="font-display text-sm tracking-wide">
              ₹{s.price.toLocaleString("en-IN")}
            </div>
            <button
              onClick={() => remove(i)}
              className="text-red-600 hover:text-red-800 transition-colors p-1"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="grid gap-3 rounded-none border border-dashed border-foreground/10 p-4 sm:grid-cols-[1fr_120px_120px_auto]">
        <input
          placeholder="Service name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className="rounded-none border border-foreground/8 bg-background px-3 py-2 text-xs uppercase tracking-wider"
        />
        <input
          placeholder="₹ price"
          type="number"
          value={draft.price || ""}
          onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
          className="rounded-none border border-foreground/8 bg-background px-3 py-2 text-xs uppercase tracking-wider"
        />
        <input
          placeholder="Duration"
          value={draft.duration}
          onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
          className="rounded-none border border-foreground/8 bg-background px-3 py-2 text-xs uppercase tracking-wider"
        />
        <button
          onClick={add}
          className="rounded-none bg-foreground hover:bg-bronze hover:text-white px-5 py-2 text-[10px] uppercase tracking-widest font-bold text-background transition-colors duration-300"
        >
          Add
        </button>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-none bg-foreground hover:bg-bronze hover:text-white px-6 py-3.5 text-[10px] uppercase tracking-widest font-bold text-background transition-colors duration-300 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save services"}
        </button>
      </div>
    </div>
  );
}

// ============== Hours & capacity ==============
function HoursTab({ salon, onChange }: { salon: Salon; onChange: () => void }) {
  const [cap, setCap] = useState(salon.max_bookings_per_hour ?? 1);
  const defaultHours = {
    monday: { open: "09:00", close: "18:00" },
    tuesday: { open: "09:00", close: "18:00" },
    wednesday: { open: "09:00", close: "18:00" },
    thursday: { open: "09:00", close: "18:00" },
    friday: { open: "09:00", close: "18:00" },
    saturday: { open: "09:00", close: "18:00" },
    sunday: { open: "09:00", close: "18:00" },
  };
  const [operatingHours, setOperatingHours] = useState<
    Record<string, { open: string; close: string }>
  >(salon.operating_hours ?? defaultHours);
  const [saving, setSaving] = useState(false);

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("salons")
      .update({
        max_bookings_per_hour: cap,
        operating_hours: operatingHours,
      } as any)
      .eq("id", salon.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Hours and capacities updated successfully");
    onChange();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Row label="Max bookings per hour (Seats)">
          <input
            type="number"
            min={1}
            max={200}
            value={cap}
            onChange={(e) => setCap(Number(e.target.value))}
            className="w-32 rounded-none border border-foreground/8 bg-background px-3 py-2 text-xs uppercase tracking-wider focus:border-bronze outline-none"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Number of available seats for a given time slot.
          </p>
        </Row>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-foreground/8 pb-2">
          Operating Hours
        </h4>
        <div className="grid gap-3">
          {days.map((day) => (
            <div key={day} className="flex items-center gap-4">
              <span className="w-28 text-xs font-semibold uppercase tracking-wider">{day}</span>
              <input
                type="time"
                value={operatingHours[day]?.open || ""}
                onChange={(e) =>
                  setOperatingHours({
                    ...operatingHours,
                    [day]: { ...operatingHours[day], open: e.target.value },
                  })
                }
                className="rounded-none border border-foreground/8 bg-background px-3 py-2 text-xs uppercase tracking-wider focus:border-bronze outline-none"
              />
              <span className="text-xs text-muted-foreground uppercase tracking-widest">to</span>
              <input
                type="time"
                value={operatingHours[day]?.close || ""}
                onChange={(e) =>
                  setOperatingHours({
                    ...operatingHours,
                    [day]: { ...operatingHours[day], close: e.target.value },
                  })
                }
                className="rounded-none border border-foreground/8 bg-background px-3 py-2 text-xs uppercase tracking-wider focus:border-bronze outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-none bg-foreground hover:bg-bronze hover:text-white px-6 py-3.5 text-[10px] uppercase tracking-widest font-bold text-background transition-colors duration-300 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </div>
  );
}

// ============== Holidays ==============
function HolidaysTab({ salon, onChange }: { salon: Salon; onChange: () => void }) {
  const [list, setList] = useState<string[]>(salon.salon_holidays ?? []);
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setList(salon.salon_holidays ?? []);
  }, [salon.salon_holidays]);

  const add = async () => {
    if (!date) return;
    if (list.includes(date)) return toast.error("Date already blocked");

    setSaving(true);
    const updated = [...list, date].sort();
    const { error } = await supabase
      .from("salons")
      .update({ salon_holidays: updated } as any)
      .eq("id", salon.id);

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Holiday added");
    setDate("");
    onChange();
  };

  const remove = async (dateToRemove: string) => {
    setSaving(true);
    const updated = list.filter((d) => d !== dateToRemove);
    const { error } = await supabase
      .from("salons")
      .update({ salon_holidays: updated } as any)
      .eq("id", salon.id);

    setSaving(false);
    if (error) return toast.error(error.message);
    onChange();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-none border border-foreground/8">
        {list.length === 0 && (
          <div className="p-5 text-xs text-muted-foreground uppercase tracking-wider">
            No holidays set.
          </div>
        )}
        <div className="divide-y divide-foreground/8">
          {list.map((h) => (
            <div key={h} className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider">
                  {new Date(h).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
              <button
                onClick={() => remove(h)}
                disabled={saving}
                className="text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 rounded-none border border-dashed border-foreground/10 p-4 sm:grid-cols-[1fr_auto]">
        <Popover>
          <PopoverTrigger asChild>
            <button className="text-left bg-background border border-foreground/8 px-3 py-2.5 text-xs uppercase tracking-wider outline-none focus:border-bronze rounded-none cursor-pointer flex justify-between items-center hover:border-foreground/30 transition-colors">
              <span className="text-foreground">
                {date
                  ? new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Select holiday date..."}
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
              selected={date ? new Date(date + "T00:00:00") : undefined}
              onSelect={(selectedDate) => {
                if (selectedDate) {
                  const yyyy = selectedDate.getFullYear();
                  const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
                  const dd = String(selectedDate.getDate()).padStart(2, "0");
                  setDate(`${yyyy}-${mm}-${dd}`);
                } else {
                  setDate("");
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
          onClick={add}
          disabled={saving}
          className="rounded-none bg-foreground hover:bg-bronze hover:text-white px-5 py-2 text-[10px] uppercase tracking-widest font-bold text-background transition-colors duration-300 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Block date"}
        </button>
      </div>
    </div>
  );
}

// ============== Special requests ==============
function RequestsTab({ salonId }: { salonId: string }) {
  const [list, setList] = useState<SpecialReq[]>([]);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    supabase
      .from("special_requests")
      .select("*")
      .eq("salon_id", salonId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setList((data ?? []) as SpecialReq[]);
      });
  }, [salonId, reload]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("special_requests").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setReload((k) => k + 1);
  };

  if (list.length === 0)
    return (
      <Empty
        title="No special requests"
        subtitle="Custom inquiries from customers will appear here."
      />
    );
  return (
    <div className="space-y-3">
      {list.map((r) => (
        <div
          key={r.id}
          className="rounded-none border border-foreground/8 p-5 bg-card/20 hover:bg-card/40 transition-colors"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider">
                {r.customer_name} · {r.customer_phone}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                {r.customer_email && `${r.customer_email} · `}
                {r.preferred_date &&
                  `Preferred ${new Date(r.preferred_date).toLocaleDateString("en-IN")} · `}
                {new Date(r.created_at).toLocaleString("en-IN")}
              </div>
            </div>
            <span
              className={`border rounded-none px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                r.status === "new"
                  ? "border-amber-500/20 text-amber-600 bg-amber-500/5"
                  : r.status === "contacted"
                    ? "border-bronze/30 text-bronze bg-bronze/5"
                    : "border-foreground/10 text-muted-foreground bg-foreground/5"
              }`}
            >
              {r.status}
            </span>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-xs leading-relaxed text-foreground/80">
            {r.message}
          </p>
          <div className="mt-4 flex gap-2">
            {r.status === "new" && (
              <button
                onClick={() => setStatus(r.id, "contacted")}
                className="rounded-none bg-bronze hover:bg-foreground hover:text-background text-white px-4 py-2 text-[9px] uppercase tracking-widest font-bold transition-all duration-300"
              >
                Mark contacted
              </button>
            )}
            {r.status !== "closed" && (
              <button
                onClick={() => setStatus(r.id, "closed")}
                className="rounded-none border border-foreground/15 hover:bg-foreground hover:text-background px-4 py-2 text-[9px] uppercase tracking-widest font-bold transition-all duration-300"
              >
                Close
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============== Sales ==============
function SalesTab({ salonId }: { salonId: string }) {
  const [list, setList] = useState<Booking[]>([]);
  useEffect(() => {
    supabase
      .from("bookings")
      .select("*")
      .eq("salon_id", salonId)
      .then(({ data }) => {
        setList((data ?? []) as Booking[]);
      });
  }, [salonId]);

  const active = list.filter((b) => b.status !== "cancelled");
  const revenue = active.reduce((s, b) => s + (b.service_price ?? 0), 0);
  const completed = list.filter((b) => b.status === "completed").length;
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = list.filter((b) => b.booking_date === today).length;

  // Last 7 days
  const last7 = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const count = list.filter((b) => b.booking_date === key && b.status !== "cancelled").length;
    return { key, count, label: d.toLocaleDateString("en-IN", { weekday: "short" }) };
  });
  const max = Math.max(1, ...last7.map((x) => x.count));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Bookings" value={list.length.toString()} />
        <Stat label="Completed" value={completed.toString()} />
        <Stat label="Today" value={todayCount.toString()} />
        <Stat label="Est. revenue" value={`₹${revenue.toLocaleString("en-IN")}`} />
      </div>
      <div>
        <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
          Last 7 days
        </div>
        <div className="flex items-end gap-2 h-32">
          {last7.map((d) => (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-none bg-bronze/85 hover:bg-bronze transition-colors duration-300"
                style={{ height: `${(d.count / max) * 100}%`, minHeight: 4 }}
              />
              <div className="text-[10px] text-muted-foreground">{d.label}</div>
              <div className="text-[10px] font-medium">{d.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============== Shared bits ==============
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
function Inp({
  value,
  onChange,
  textarea,
}: {
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  const cls =
    "w-full rounded-none border border-foreground/8 bg-background px-3.5 py-2.5 text-xs uppercase tracking-wider outline-none focus:border-bronze transition-all duration-300";
  return textarea ? (
    <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
  ) : (
    <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-none border border-foreground/8 bg-background p-5 shadow-none">
      <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-display text-2xl tracking-wide">{value}</div>
    </div>
  );
}
function Empty({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="py-10 text-center">
      <div className="font-display text-lg">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
    </div>
  );
}

function BillingTab({ salon, onChange }: { salon: Salon; onChange: () => void }) {
  const [items, setItems] = useState<{ name: string; price: number; qty: number }[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [bookingAmount, setBookingAmount] = useState(salon.booking_amount || 0);
  const [businessDetails, setBusinessDetails] = useState({
    legal_name: salon.business_details?.legal_name || "",
    gst_number: salon.business_details?.gst_number || "",
    upi_id: salon.business_details?.upi_id || "",
    address: salon.business_details?.address || salon.address || "",
  });
  const [collectingPayment, setCollectingPayment] = useState(false);
  const [paidMethod, setPaidMethod] = useState<"cash" | "upi" | "card" | null>(null);

  useEffect(() => {
    if (items.length === 0) setPaidMethod(null);
  }, [items]);

  const saveSettings = async () => {
    const { error } = await supabase
      .from("salons" as any)
      .update({
        business_details: businessDetails,
        booking_amount: bookingAmount,
      })
      .eq("id", salon.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Settings saved");
      setShowSettings(false);
      onChange();
    }
  };

  const addItem = (srv: SalonService) => {
    setItems((curr) => {
      const exists = curr.find((i) => i.name === srv.name);
      if (exists) {
        return curr.map((i) => (i.name === srv.name ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...curr, { name: srv.name, price: srv.price, qty: 1 }];
    });
  };

  const removeItem = (name: string) => {
    setItems((curr) => curr.filter((i) => i.name !== name));
  };

  const printThermalReceipt = () => {
    const printWindow = window.open(
      "about:blank",
      "PrintWindow",
      "left=50000,top=50000,width=0,height=0",
    );
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>POS Receipt</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              font-family: 'Inter', sans-serif;
              font-size: 11px;
              line-height: 1.5;
              color: #000;
              background: #fff;
              padding: 5mm;
              margin: 0 auto;
              width: 70mm;
              font-weight: 400;
            }
            .font-display {
              font-family: 'Playfair Display', serif;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: 600; }
            .uppercase { text-transform: uppercase; }
            .tracking-widest { letter-spacing: 0.15em; }
            .tracking-wide { letter-spacing: 0.05em; }
            .text-xs { font-size: 10px; }
            .text-sm { font-size: 12px; }
            .text-lg { font-size: 16px; }
            .text-xl { font-size: 20px; }
            
            .header {
              border-bottom: 1px solid #000;
              padding-bottom: 12px;
              margin-bottom: 12px;
            }
            .header h2 {
              margin: 0 0 6px 0;
              font-weight: 600;
            }
            .header p {
              margin: 3px 0;
              color: #333;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
            }
            th {
              border-bottom: 1px solid #000;
              padding-bottom: 6px;
              font-weight: 500;
              color: #444;
            }
            td {
              padding: 6px 0;
              vertical-align: top;
            }
            .item-name {
              font-weight: 500;
              margin-bottom: 2px;
            }
            
            .totals {
              border-top: 1px solid #000;
              padding-top: 10px;
              margin-top: 10px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
            }
            .grand-total {
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              padding: 8px 0;
              margin-top: 8px;
              font-weight: 600;
              font-size: 14px;
            }
            
            .footer {
              margin-top: 24px;
              padding-top: 16px;
              border-top: 1px dashed #999;
              color: #444;
            }
            .footer p {
              margin: 4px 0;
            }
          </style>
        </head>
        <body>
          <div class="header text-center">
            <h2 class="font-display text-xl uppercase tracking-widest">${businessDetails.legal_name || salon.name}</h2>
            ${businessDetails.address ? `<p class="text-xs uppercase tracking-widest">${businessDetails.address.replace(/\n/g, "<br/>")}</p>` : ""}
            ${businessDetails.gst_number ? `<p class="text-xs uppercase tracking-widest">GSTIN: ${businessDetails.gst_number}</p>` : ""}
            <p class="text-xs uppercase tracking-widest" style="margin-top: 8px;">${new Date().toLocaleString("en-IN")}</p>
          </div>
          
          <table>
            <thead>
              <tr class="text-xs uppercase tracking-widest text-left">
                <th>Service</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Amt</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item) => `
                <tr>
                  <td>
                    <div class="item-name">${item.name}</div>
                  </td>
                  <td class="text-center">${item.qty}</td>
                  <td class="text-right font-display tracking-wide">₹${(item.price * item.qty).toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="totals text-xs uppercase tracking-widest">
            <div class="total-row">
              <span>Subtotal</span>
              <span class="font-display tracking-wide">₹${total.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>GST (18%)</span>
              <span class="font-display tracking-wide">₹${gst.toFixed(2)}</span>
            </div>
            <div class="total-row grand-total font-display">
              <span class="uppercase tracking-widest" style="font-family: 'Inter', sans-serif;">Total</span>
              <span>₹${grandTotal.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer text-center text-xs uppercase tracking-widest">
            ${paidMethod ? "<p class='font-bold' style='color: #000; margin-bottom: 6px;'>PAID VIA " + paidMethod.toUpperCase() + "</p>" : ""}
            <p style="margin-top: 12px; font-style: italic; font-family: 'Playfair Display', serif; font-size: 13px; text-transform: none; letter-spacing: 0;">Thank you for your visit.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const total = items.reduce((acc, curr) => acc + curr.price * curr.qty, 0);
  const gst = total * 0.18;
  const grandTotal = total + gst;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h3 className="font-display text-xl tracking-wide">Point of Sale</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Generate and print bills for your clients.
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="inline-flex items-center gap-1.5 rounded-none border border-foreground/15 hover:bg-foreground hover:text-background px-4 py-2 text-[10px] uppercase tracking-widest font-semibold transition-all duration-300"
        >
          <Cog className="h-3 w-3" /> Billing Settings
        </button>
      </div>

      {showSettings && (
        <div className="rounded-none border border-foreground/10 bg-surface-warm/30 p-5 space-y-4 print:hidden animate-in slide-in-from-top-2 fade-in">
          <h4 className="font-display text-lg">Compliance Settings</h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <Label>
              Legal Business Name
              <Inp
                value={businessDetails.legal_name}
                onChange={(v) => setBusinessDetails({ ...businessDetails, legal_name: v })}
              />
            </Label>
            <Label>
              GST Number
              <Inp
                value={businessDetails.gst_number}
                onChange={(v) => setBusinessDetails({ ...businessDetails, gst_number: v })}
              />
            </Label>
            <Label>
              UPI ID
              <Inp
                value={businessDetails.upi_id}
                onChange={(v) => setBusinessDetails({ ...businessDetails, upi_id: v })}
              />
            </Label>
            <Label>
              Booking Deposit Amount (₹)
              <input
                type="number"
                min={0}
                value={bookingAmount}
                onChange={(e) => setBookingAmount(Number(e.target.value))}
                className="w-full rounded-none border border-foreground/8 bg-background px-3.5 py-2.5 text-xs outline-none focus:border-bronze transition-all duration-300 mt-1"
              />
            </Label>
            <Label>
              Billing Address
              <Inp
                value={businessDetails.address}
                onChange={(v) => setBusinessDetails({ ...businessDetails, address: v })}
                textarea
              />
            </Label>
          </div>
          <button
            onClick={saveSettings}
            className="rounded-none bg-bronze text-white px-5 py-2 text-[10px] uppercase tracking-widest font-bold"
          >
            Save Settings
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_350px] gap-8">
        {/* Services Selector - Hidden during print */}
        <div className="space-y-4 print:hidden">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
            Select Services
          </h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {salon.services?.length > 0 ? (
              salon.services.map((srv) => (
                <button
                  key={srv.name}
                  onClick={() => addItem(srv)}
                  className="text-left p-4 border border-foreground/8 hover:border-bronze hover:bg-bronze/5 transition-colors rounded-none bg-card group"
                >
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-sm group-hover:text-bronze transition-colors">
                      {srv.name}
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground group-hover:text-bronze" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">₹{srv.price}</div>
                </button>
              ))
            ) : (
              <Empty title="No Services" subtitle="Add services in the Services tab first." />
            )}
          </div>
        </div>

        {/* Bill Preview - Visible during print */}
        <div
          id="bill-preview"
          className="rounded-none border border-foreground/15 bg-white p-6 shadow-sm print:shadow-none print:border-none print:m-0 print:p-0"
        >
          {/* Bill Header */}
          <div className="text-center pb-4 border-b border-foreground/10 mb-4">
            <h2 className="font-display text-2xl uppercase tracking-widest">
              {businessDetails.legal_name || salon.name}
            </h2>
            {businessDetails.address && (
              <p className="text-[10px] uppercase tracking-widest mt-1 text-muted-foreground whitespace-pre-wrap">
                {businessDetails.address}
              </p>
            )}
            {businessDetails.gst_number && (
              <p className="text-[10px] uppercase tracking-widest mt-1 text-muted-foreground">
                GSTIN: {businessDetails.gst_number}
              </p>
            )}
          </div>

          {/* Bill Items */}
          <div className="min-h-[200px]">
            {items.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-10 print:hidden">
                Bill is empty. Add services.
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-foreground/5 text-left text-[9px] uppercase tracking-widest">
                    <th className="pb-2">Item</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Amt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item, idx) => (
                    <tr
                      key={idx}
                      className="animate-in slide-in-from-bottom-2 fade-in fill-mode-both duration-300"
                    >
                      <td className="py-2">
                        <div className="font-medium">{item.name}</div>
                        <button
                          onClick={() => removeItem(item.name)}
                          className="text-[9px] text-red-500 uppercase tracking-widest mt-0.5 print:hidden"
                        >
                          Remove
                        </button>
                      </td>
                      <td className="py-2 text-right">{item.qty}</td>
                      <td className="py-2 text-right font-display tracking-widest">
                        ₹{item.price * item.qty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Bill Totals */}
          <div className="border-t border-foreground/10 pt-4 mt-4 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="uppercase tracking-widest">Subtotal</span>
              <span className="font-display tracking-widest">₹{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase tracking-widest">GST (18%)</span>
              <span className="font-display tracking-widest">₹{gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-foreground/10 pt-2 mt-2 font-bold text-sm">
              <span className="uppercase tracking-widest">Total</span>
              <span className="font-display tracking-widest">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-dashed border-foreground/15 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
            {paidMethod ? (
              <p className="mb-2 text-foreground font-bold font-mono">
                ✓ PAID VIA {paidMethod.toUpperCase()}
              </p>
            ) : (
              businessDetails.upi_id && (
                <p className="mb-2">
                  Pay via UPI:{" "}
                  <span className="font-bold text-foreground">{businessDetails.upi_id}</span>
                </p>
              )
            )}
            <p>Thank you for visiting!</p>
          </div>

          {/* Actions - Hidden during print */}
          {items.length > 0 && (
            <div className="mt-6 print:hidden space-y-3">
              {paidMethod ? (
                <>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-center py-2.5 text-[9px] uppercase tracking-widest font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                    <Check className="h-3.5 w-3.5" /> Paid via {paidMethod}
                  </div>
                  <button
                    onClick={printThermalReceipt}
                    className="w-full inline-flex justify-center items-center gap-2 rounded-none bg-foreground text-background px-5 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-bronze transition-colors duration-300"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print Bill
                  </button>
                  <button
                    onClick={() => {
                      setItems([]);
                      setPaidMethod(null);
                    }}
                    className="w-full text-center text-[9px] uppercase tracking-widest text-muted-foreground hover:text-red-500 font-bold py-1.5 transition-colors"
                  >
                    Clear Bill / New Invoice
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setCollectingPayment(true)}
                  className="w-full inline-flex justify-center items-center gap-2 rounded-none bg-bronze text-white px-5 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-foreground hover:text-background transition-colors duration-300"
                >
                  <DollarSign className="h-3.5 w-3.5" /> Collect Payment
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <POSPaymentModal
        isOpen={collectingPayment}
        onClose={() => setCollectingPayment(false)}
        amount={grandTotal}
        salon={salon}
        onSuccess={(method) => {
          setPaidMethod(method);
        }}
      />

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #bill-preview, #bill-preview * {
            visibility: visible;
          }
          #bill-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// ============== POS PAYMENT MODAL COMPONENT ==============
function POSPaymentModal({
  isOpen,
  onClose,
  amount,
  salon,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  salon: Salon;
  onSuccess: (method: "cash" | "upi" | "card") => void;
}) {
  const [tab, setTab] = useState<"cash" | "upi" | "card">("upi");
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrData, setQrData] = useState<{
    imageUrl: string;
    upiString: string;
    qrCodeId: string;
    isFallback: boolean;
  } | null>(null);

  // Card states
  const [cardNo, setCardNo] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [processingCard, setProcessingCard] = useState(false);
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpVal, setOtpVal] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Generate UPI QR Code when QR tab is selected
  useEffect(() => {
    if (tab === "upi" && isOpen) {
      const getQR = async () => {
        setLoadingQr(true);
        try {
          const res = await createRazorpayQR({
            data: {
              amount,
              name: salon.name,
              description: "POS Billing",
              salonId: salon.id,
              fallbackUpiId: salon.business_details?.upi_id,
            },
          });
          if (res.success && res.imageUrl) {
            setQrData({
              imageUrl: res.imageUrl,
              upiString: res.upiString || "",
              qrCodeId: res.qrCodeId || "",
              isFallback: res.isFallback || false,
            });
          } else {
            toast.error("Failed to generate payment QR");
          }
        } catch (e: any) {
          toast.error("QR Code Error: " + e.message);
        } finally {
          setLoadingQr(false);
        }
      };
      getQR();
    }
  }, [tab, isOpen, amount, salon]);

  // Poll for QR Code Payment Status (only if not fallback direct UPI)
  useEffect(() => {
    if (tab !== "upi" || !qrData || qrData.isFallback || !isOpen) return;
    const interval = setInterval(async () => {
      try {
        const res = await checkRazorpayPaymentStatus({ data: { qrCodeId: qrData.qrCodeId } });
        if (res.success && res.paid) {
          toast.success("Payment Received! 🎉");
          onSuccess("upi");
          onClose();
          clearInterval(interval);
        }
      } catch (e) {
        // ignore errors during background polling
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [tab, qrData, isOpen]);

  if (!isOpen) return null;

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNo.replace(/\s/g, "").length < 16 || cardExpiry.length < 5 || cardCvv.length < 3) {
      toast.error("Invalid card details");
      return;
    }
    setProcessingCard(true);
    setTimeout(() => {
      setProcessingCard(false);
      setShowOtpScreen(true);
    }, 1800);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpVal.length < 4) {
      toast.error("Enter a valid OTP");
      return;
    }
    setVerifyingOtp(true);
    setTimeout(() => {
      setVerifyingOtp(false);
      toast.success("Card Authorized Successfully!");
      onSuccess("card");
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-background border border-foreground/10 p-6 md:p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground hover:text-foreground"
        >
          Close
        </button>

        <h3 className="font-display text-2xl tracking-wide">Collect Payment</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Select a payment mode for ₹{amount.toFixed(2)}
        </p>

        {/* Tab Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-6 border-b border-foreground/10 pb-4">
          <button
            onClick={() => {
              setTab("upi");
              setQrData(null);
            }}
            className={`flex flex-col items-center justify-center p-3 border text-xs tracking-wider uppercase font-semibold transition-all ${tab === "upi" ? "border-bronze bg-bronze/5 text-bronze" : "border-foreground/8 hover:bg-surface-warm"}`}
          >
            <QrCode className="h-4 w-4 mb-1.5" /> UPI QR
          </button>
          <button
            onClick={() => setTab("card")}
            className={`flex flex-col items-center justify-center p-3 border text-xs tracking-wider uppercase font-semibold transition-all ${tab === "card" ? "border-bronze bg-bronze/5 text-bronze" : "border-foreground/8 hover:bg-surface-warm"}`}
          >
            <CreditCard className="h-4 w-4 mb-1.5" /> Card
          </button>
          <button
            onClick={() => setTab("cash")}
            className={`flex flex-col items-center justify-center p-3 border text-xs tracking-wider uppercase font-semibold transition-all ${tab === "cash" ? "border-bronze bg-bronze/5 text-bronze" : "border-foreground/8 hover:bg-surface-warm"}`}
          >
            <DollarSign className="h-4 w-4 mb-1.5" /> Cash
          </button>
        </div>

        <div className="mt-6 min-h-[220px] flex flex-col justify-center">
          {tab === "upi" && (
            <div className="text-center space-y-4">
              {loadingQr ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-bronze" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                    Generating UPI QR via Razorpay...
                  </span>
                </div>
              ) : qrData ? (
                <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in-95">
                  <div className="p-2 border border-foreground/10 bg-white shadow-sm">
                    <img src={qrData.imageUrl} alt="UPI QR Code" className="h-44 w-44" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-bronze">
                      {qrData.isFallback ? "Direct Merchant UPI QR" : "Dynamic Razorpay UPI QR"}
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium max-w-[280px]">
                      {qrData.isFallback
                        ? "Scan with any UPI app to pay directly into bank account."
                        : "Polling for payment. Scan with any UPI app to complete."}
                    </p>
                  </div>
                  {/* Simulate/Verify Payment Button for testing */}
                  <button
                    onClick={() => {
                      toast.success("POS Payment completed successfully! 🎉");
                      onSuccess("upi");
                      onClose();
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-none bg-foreground text-background px-4 py-2 text-[9px] uppercase tracking-widest font-bold hover:bg-bronze hover:text-white transition-all duration-300"
                  >
                    <Check className="h-3 w-3" /> Simulate Pay Success
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Select UPI QR to generate code</p>
              )}
            </div>
          )}

          {tab === "card" && (
            <div className="space-y-4">
              {!showOtpScreen ? (
                <form onSubmit={handleCardSubmit} className="space-y-3 animate-in fade-in">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">
                      Cardholder Name
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="ANANYA RAO"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      className="w-full border border-foreground/10 bg-transparent px-3 py-2 text-xs uppercase tracking-widest outline-none focus:border-bronze"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">
                      Card Number
                    </label>
                    <input
                      required
                      type="text"
                      maxLength={19}
                      placeholder="4111 1111 1111 1111"
                      value={cardNo}
                      onChange={(e) => {
                        const v = e.target.value
                          .replace(/\D/g, "")
                          .replace(/(.{4})/g, "$1 ")
                          .trim();
                        setCardNo(v);
                      }}
                      className="w-full border border-foreground/10 bg-transparent px-3 py-2 text-xs tracking-widest outline-none focus:border-bronze font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">
                        Expiry (MM/YY)
                      </label>
                      <input
                        required
                        type="text"
                        maxLength={5}
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "");
                          if (v.length > 2) v = v.substring(0, 2) + "/" + v.substring(2, 4);
                          setCardExpiry(v);
                        }}
                        className="w-full border border-foreground/10 bg-transparent px-3 py-2 text-xs tracking-widest outline-none focus:border-bronze font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">
                        CVV
                      </label>
                      <input
                        required
                        type="password"
                        maxLength={3}
                        placeholder="***"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                        className="w-full border border-foreground/10 bg-transparent px-3 py-2 text-xs tracking-widest outline-none focus:border-bronze font-mono"
                      />
                    </div>
                  </div>
                  <button
                    disabled={processingCard}
                    type="submit"
                    className="w-full rounded-none bg-foreground text-background py-3 mt-4 text-[10px] uppercase tracking-widest font-bold hover:bg-bronze hover:text-white transition-colors flex justify-center items-center gap-2"
                  >
                    {processingCard ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" /> Authorizing...
                      </>
                    ) : (
                      `Pay ₹${amount.toFixed(2)}`
                    )}
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={handleOtpSubmit}
                  className="space-y-4 text-center animate-in zoom-in-95 duration-200"
                >
                  <div className="mx-auto h-10 w-10 border border-foreground/10 bg-surface-warm flex items-center justify-center rounded-none text-bronze">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display text-base">OTP Authorization</h4>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium max-w-[280px] mx-auto">
                      Enter the 6-digit OTP sent to client's phone to complete card charge.
                    </p>
                  </div>
                  <input
                    required
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpVal}
                    onChange={(e) => setOtpVal(e.target.value.replace(/\D/g, ""))}
                    className="mx-auto w-32 border border-foreground/10 bg-transparent px-3 py-2 text-center text-sm tracking-[0.4em] outline-none focus:border-bronze font-mono font-bold"
                  />
                  <div className="flex gap-2 justify-center mt-4 font-bold">
                    <button
                      type="button"
                      onClick={() => setShowOtpScreen(false)}
                      className="px-4 py-2.5 border border-foreground/10 text-[9px] uppercase tracking-widest font-bold"
                    >
                      Back
                    </button>
                    <button
                      disabled={verifyingOtp}
                      type="submit"
                      className="px-5 py-2.5 bg-bronze text-white text-[9px] uppercase tracking-widest font-bold hover:bg-foreground hover:text-background transition-colors flex items-center gap-1.5"
                    >
                      {verifyingOtp ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" /> Verifying...
                        </>
                      ) : (
                        "Verify & Charge"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {tab === "cash" && (
            <div className="text-center space-y-6 py-4 animate-in fade-in">
              <div className="mx-auto h-12 w-12 border border-emerald-200 bg-emerald-50/50 flex items-center justify-center rounded-none text-emerald-700">
                <DollarSign className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-800">
                  Cash Payment
                </p>
                <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">
                  Collect ₹${amount.toFixed(2)} cash from client. Once received, click below to
                  confirm.
                </p>
              </div>
              <button
                onClick={() => {
                  toast.success("Cash Payment recorded! 🎉");
                  onSuccess("cash");
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-none bg-foreground text-background px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-bronze hover:text-white transition-all duration-300"
              >
                <Check className="h-3.5 w-3.5" /> Confirm Cash Collected
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
