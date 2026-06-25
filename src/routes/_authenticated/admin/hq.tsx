import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ShieldCheck, Users, CalendarRange, Building2, KeyRound } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/hq")({
  head: () => ({ meta: [{ title: "HQ Admin | Bloom" }] }),
  component: HqAdmin,
});

type UserRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: ("customer" | "salon_owner" | "admin")[];
  booking_count: number;
};

type BookingRow = {
  id: string;
  salon_id: string;
  service_name: string;
  service_price: number;
  booking_date: string;
  booking_time: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  created_at: string;
};

type SalonRow = {
  id: string;
  slug: string;
  name: string;
  neighborhood: string;
  owner_id: string | null;
  price_tier: string;
  specialties: string[] | null;
  status?: string;
  published?: boolean;
  rejection_reason?: string | null;
  description?: string;
  tagline?: string | null;
  submitted_at?: string | null;
};

function HqAdmin() {
  const { isAdmin, user, loading } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [salons, setSalons] = useState<SalonRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [tab, setTab] = useState<"users" | "approvals" | "salons" | "bookings">("approvals");
  const [claiming, setClaiming] = useState(false);
  const [bootstrapAvailable, setBootstrapAvailable] = useState<boolean | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // Check if any admin exists (for the bootstrap UI)
  useEffect(() => {
    if (isAdmin || !user) {
      setBootstrapAvailable(false);
      return;
    }
    supabase
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "admin")
      .then(({ count, error }) => {
        // If we can't see any rows (RLS-blocked) or count is 0 → bootstrap available
        setBootstrapAvailable(!error ? (count ?? 0) === 0 : true);
      });
  }, [isAdmin, user]);

  // Load admin data
  useEffect(() => {
    if (!isAdmin) return;
    supabase.rpc("admin_list_users").then(({ data, error }) => {
      if (error) return toast.error(error.message);
      setUsers((data ?? []) as UserRow[]);
    });
    supabase
      .from("salons")
      .select(
        "id, slug, name, neighborhood, owner_id, price_tier, specialties, status, published, rejection_reason, description, tagline, submitted_at",
      )
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setSalons((data ?? []) as SalonRow[]);
      });
    supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setBookings((data ?? []) as BookingRow[]);
      });
  }, [isAdmin, reloadKey]);

  const approveSalon = async (id: string) => {
    const { error } = await supabase.rpc("admin_approve_salon", {
      _salon_id: id,
      _approve: true,
      _reason: undefined,
    });
    if (error) return toast.error(error.message);
    toast.success("Approved! Owner can now publish.");
    setReloadKey((k) => k + 1);
  };

  const rejectSalon = async () => {
    if (!rejectingId) return;
    const { error } = await supabase.rpc("admin_approve_salon", {
      _salon_id: rejectingId,
      _approve: false,
      _reason: rejectReason || undefined,
    });
    if (error) return toast.error(error.message);
    toast.success("Rejected");
    setRejectingId(null);
    setRejectReason("");
    setReloadKey((k) => k + 1);
  };

  const claimAdmin = async () => {
    setClaiming(true);
    const { data, error } = await supabase.rpc("claim_first_admin");
    setClaiming(false);
    if (error) return toast.error(error.message);
    if (data === true) {
      toast.success("You are now an HQ admin.");
      window.location.reload();
    } else {
      toast.error("An admin already exists. Ask them to grant you the role.");
    }
  };

  const setRole = async (userId: string, role: "salon_owner" | "admin", grant: boolean) => {
    const { error } = await supabase.rpc("admin_set_role", {
      _user_id: userId,
      _role: role,
      _grant: grant,
    });
    if (error) return toast.error(error.message);
    toast.success(`${grant ? "Granted" : "Revoked"} ${role}`);
    setReloadKey((k) => k + 1);
  };

  const unassignSalon = async (salonId: string, name: string) => {
    setConfirmAction({
      title: "Remove Owner",
      description: `Remove owner from "${name}"?`,
      onConfirm: async () => {
        const { error } = await supabase
          .from("salons")
          .update({ owner_id: null })
          .eq("id", salonId);
        if (error) return toast.error(error.message);
        toast.success("Owner removed");
        setReloadKey((k) => k + 1);
      },
    });
  };

  const deleteBooking = async (id: string) => {
    setConfirmAction({
      title: "Delete Booking",
      description: "Delete this booking? This cannot be undone.",
      onConfirm: async () => {
        const { error } = await supabase.from("bookings").delete().eq("id", id);
        if (error) return toast.error(error.message);
        toast.success("Booking deleted");
        setReloadKey((k) => k + 1);
      },
    });
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  if (!isAdmin) {
    return (
      <div className="rounded-none border border-foreground/8 bg-card p-10 text-center shadow-none">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-none bg-surface-warm/50 border border-foreground/8">
          <ShieldCheck className="h-5 w-5 text-bronze" />
        </div>
        <h2 className="mt-4 font-display text-2xl tracking-wide">HQ Admin access required</h2>
        <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground leading-relaxed">
          This panel gives full control over every salon, booking and user on Bloom.
          {bootstrapAvailable
            ? " No HQ admin exists yet. Claim it now (one-time, first signed-in user only)."
            : " Ask an existing HQ admin to grant you the role."}
        </p>
        {bootstrapAvailable && (
          <button
            onClick={claimAdmin}
            disabled={claiming}
            className="mt-6 inline-flex items-center gap-2 rounded-none bg-foreground hover:bg-bronze hover:text-white px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-background transition-colors duration-300 disabled:opacity-50"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {claiming ? "Claiming…" : "Claim HQ admin"}
          </button>
        )}
      </div>
    );
  }

  const owners = users.filter((u) => u.roles.includes("salon_owner")).length;
  const admins = users.filter((u) => u.roles.includes("admin")).length;
  const todays = bookings.filter(
    (b) => b.booking_date === new Date().toISOString().slice(0, 10),
  ).length;

  return (
    <div className="space-y-8">
      <header>
        <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-primary">
          <ShieldCheck className="h-3.5 w-3.5" /> HQ Admin
        </div>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Bloom control center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full access, manage users, salons, owner assignments and bookings across the platform.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Users" value={users.length.toString()} />
        <Stat label="Salons" value={salons.length.toString()} />
        <Stat label="Salon owners" value={owners.toString()} />
        <Stat label="Bookings today" value={todays.toString()} />
      </div>

      <div className="flex flex-wrap border-b border-foreground/10 bg-transparent px-1">
        <TabBtn
          active={tab === "approvals"}
          onClick={() => setTab("approvals")}
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
        >
          Approvals ({salons.filter((s) => s.status === "pending").length})
        </TabBtn>
        <TabBtn
          active={tab === "users"}
          onClick={() => setTab("users")}
          icon={<Users className="h-3.5 w-3.5" />}
        >
          Users ({users.length})
        </TabBtn>
        <TabBtn
          active={tab === "salons"}
          onClick={() => setTab("salons")}
          icon={<Building2 className="h-3.5 w-3.5" />}
        >
          Salons ({salons.length})
        </TabBtn>
        <TabBtn
          active={tab === "bookings"}
          onClick={() => setTab("bookings")}
          icon={<CalendarRange className="h-3.5 w-3.5" />}
        >
          Bookings ({bookings.length})
        </TabBtn>
      </div>

      {tab === "approvals" && (
        <div className="space-y-4">
          {salons.filter((s) => s.status === "pending").length === 0 ? (
            <div className="rounded-none border border-dashed border-foreground/10 bg-card p-10 text-center text-xs uppercase tracking-wider text-muted-foreground">
              No salons awaiting review. 🎉
            </div>
          ) : (
            salons
              .filter((s) => s.status === "pending")
              .map((s) => {
                const owner = users.find((u) => u.user_id === s.owner_id);
                return (
                  <div
                    key={s.id}
                    className="rounded-none border border-foreground/8 bg-card p-6 shadow-none"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-display text-xl tracking-wide">{s.name}</h3>
                          <span className="border border-amber-500/20 text-amber-600 bg-amber-500/5 rounded-none px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                            Pending
                          </span>
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                          {s.neighborhood} · {s.price_tier} · Submitted by{" "}
                          {owner?.full_name ?? owner?.email ?? "Not assigned"}
                        </div>
                        {s.tagline && (
                          <p className="mt-3 italic text-xs leading-relaxed text-foreground/80">
                            {s.tagline}
                          </p>
                        )}
                        <p className="mt-2 text-xs leading-relaxed text-foreground/75">
                          {s.description}
                        </p>
                        {s.specialties && s.specialties.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {s.specialties.map((sp) => (
                              <span
                                key={sp}
                                className="border border-foreground/8 rounded-none px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest text-muted-foreground bg-card/40"
                              >
                                {sp}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => approveSalon(s.id)}
                          className="rounded-none bg-bronze hover:bg-foreground hover:text-background text-white px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold transition-all duration-300"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(s.id);
                            setRejectReason("");
                          }}
                          className="rounded-none border border-foreground/15 hover:bg-foreground hover:text-background px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold transition-all duration-300"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                    {rejectingId === s.id && (
                      <div className="mt-4 flex flex-wrap gap-3 rounded-none border border-red-500/20 bg-red-500/5 p-4">
                        <input
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Reason for rejection (shown to owner)"
                          className="flex-1 rounded-none border border-foreground/8 bg-background px-3 py-2 text-xs uppercase tracking-wider outline-none focus:border-bronze"
                        />
                        <button
                          onClick={rejectSalon}
                          className="rounded-none bg-red-600 hover:bg-red-800 text-white px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold transition-all duration-300"
                        >
                          Confirm reject
                        </button>
                        <button
                          onClick={() => setRejectingId(null)}
                          className="rounded-none border border-foreground/15 hover:bg-foreground hover:text-background px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold transition-all duration-300"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      )}

      {tab === "users" && (
        <div className="overflow-x-auto rounded-none border border-foreground/8 bg-card shadow-none">
          <table className="w-full min-w-[750px] text-sm">
            <thead className="bg-surface-warm/50 border-b border-foreground/8 text-left text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Roles</th>
                <th className="px-5 py-3">Bookings</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => {
                const isMe = u.user_id === user?.id;
                const hasAdmin = u.roles.includes("admin");
                const hasOwner = u.roles.includes("salon_owner");
                return (
                  <tr key={u.user_id}>
                    <td className="px-5 py-3.5">
                      <div className="font-medium">{u.full_name ?? "No Name"}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {u.roles.length === 0 && (
                          <span className="text-xs text-muted-foreground">none</span>
                        )}
                        {u.roles.map((r) => (
                          <RolePill key={r} role={r} />
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">{u.booking_count}</td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <RoleToggle
                          granted={hasOwner}
                          onClick={() => setRole(u.user_id, "salon_owner", !hasOwner)}
                        >
                          {hasOwner ? "Revoke owner" : "Make owner"}
                        </RoleToggle>
                        <RoleToggle
                          granted={hasAdmin}
                          disabled={isMe && hasAdmin}
                          onClick={() => setRole(u.user_id, "admin", !hasAdmin)}
                        >
                          {hasAdmin ? (isMe ? "You" : "Revoke admin") : "Make admin"}
                        </RoleToggle>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "salons" && (
        <div className="overflow-x-auto rounded-none border border-foreground/8 bg-card shadow-none">
          <table className="w-full min-w-[650px] text-sm">
            <thead className="bg-surface-warm/50 border-b border-foreground/8 text-left text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Salon</th>
                <th className="px-5 py-3">Tier</th>
                <th className="px-5 py-3">Owner</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {salons.map((s) => {
                const owner = users.find((u) => u.user_id === s.owner_id);
                return (
                  <tr key={s.id}>
                    <td className="px-5 py-3.5">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.neighborhood}</div>
                    </td>
                    <td className="px-5 py-3.5">{s.price_tier}</td>
                    <td className="px-5 py-3.5">
                      {s.owner_id ? (
                        <div>
                          <div>{owner?.full_name ?? "Not assigned"}</div>
                          <div className="text-xs text-muted-foreground">
                            {owner?.email ?? s.owner_id.slice(0, 8)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">Unclaimed</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {s.owner_id && (
                        <button
                          onClick={() => unassignSalon(s.id, s.name)}
                          className="rounded-none border border-foreground/15 hover:bg-red-500 hover:text-white hover:border-red-500 px-3.5 py-1.5 text-[9px] uppercase tracking-widest font-bold transition-all duration-300"
                        >
                          Unassign
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "bookings" && (
        <div className="overflow-x-auto rounded-none border border-foreground/8 bg-card shadow-none">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-surface-warm/50 border-b border-foreground/8 text-left text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Salon · Service</th>
                <th className="px-5 py-3">When</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((b) => {
                const salon = salons.find((s) => s.id === b.salon_id);
                return (
                  <tr key={b.id}>
                    <td className="px-5 py-3.5">
                      <div className="font-medium">{b.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{b.customer_phone}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium">{salon?.name ?? "No Salon"}</div>
                      <div className="text-xs text-muted-foreground">{b.service_name}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        {new Date(b.booking_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">{b.booking_time}</div>
                    </td>
                    <td className="px-5 py-3.5 font-display">
                      ₹{b.service_price.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill status={b.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => deleteBooking(b.id)}
                        className="rounded-none border border-foreground/15 hover:bg-red-500 hover:text-white hover:border-red-500 px-3.5 py-1.5 text-[9px] uppercase tracking-widest font-bold transition-all duration-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent className="rounded-none border-foreground/10 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display tracking-wide">
              {confirmAction?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs uppercase tracking-widest text-muted-foreground mt-2">
              {confirmAction?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-none text-[10px] uppercase tracking-widest font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmAction?.onConfirm();
                setConfirmAction(null);
              }}
              className="rounded-none bg-red-600 hover:bg-red-800 text-white text-[10px] uppercase tracking-widest font-bold transition-all duration-300"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-none border border-foreground/8 bg-card p-5 shadow-none">
      <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-display text-2xl tracking-wide">{value}</div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-3 text-[10px] uppercase tracking-widest font-semibold transition-all duration-300 border-b-2 -mb-[2px] ${
        active
          ? "border-bronze text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-foreground/10"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function RolePill({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: "border-bronze text-bronze bg-bronze/5",
    salon_owner: "border-foreground/20 text-foreground bg-foreground/5",
    customer: "border-foreground/8 text-muted-foreground bg-card/20",
  };
  return (
    <span
      className={`border rounded-none px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${styles[role] ?? ""}`}
    >
      {role.replace("_", " ")}
    </span>
  );
}

function RoleToggle({
  granted,
  onClick,
  disabled,
  children,
}: {
  granted: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-none px-4 py-2 text-[9px] uppercase tracking-widest font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
        granted
          ? "border border-foreground/15 hover:bg-red-500 hover:text-white hover:border-red-500"
          : "bg-foreground text-background hover:bg-bronze hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
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
