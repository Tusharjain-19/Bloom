import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Building2, ShieldCheck, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin | Bloom" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, isSalonOwner } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto max-w-7xl px-5 pt-28 pb-12">
      <div className="flex items-center justify-between border-b border-foreground/5 pb-4 mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to site
        </Link>
        <Link
          to="/dashboard"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          My account →
        </Link>
      </div>

      <div className="flex flex-col gap-8">
        {/* Top Control Center Navigation */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-foreground/10 pb-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-bronze font-bold">
              Admin
            </div>
            <h2 className="mt-1 font-display text-3xl">Control Center</h2>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm">
            <TopLink
              to="/admin/salons"
              icon={<Building2 className="h-4 w-4" />}
              active={pathname.startsWith("/admin/salons")}
              label="Salons panel"
              hint={isSalonOwner ? "Manage your salon" : "Claim & manage"}
            />
            {isAdmin && (
              <TopLink
                to="/admin/hq"
                icon={<ShieldCheck className="h-4 w-4" />}
                active={pathname.startsWith("/admin/hq")}
                label="HQ admin"
                hint="Full access"
              />
            )}
          </nav>
        </header>

        {/* Main Full-Width Content Panel */}
        <main className="min-w-0 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function TopLink({
  to,
  icon,
  label,
  hint,
  active,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-none border px-5 py-3 transition-all duration-300 ${
        active
          ? "border-bronze bg-bronze/5 text-bronze font-medium"
          : "border-foreground/8 hover:border-foreground/25 bg-card/20 hover:bg-card/50 text-muted-foreground hover:text-foreground"
      }`}
    >
      <span className="text-bronze">{icon}</span>
      <div className="text-left">
        <span className="block font-bold tracking-widest text-[10px] uppercase">{label}</span>
        <span className="block text-[8px] tracking-wider text-muted-foreground uppercase mt-0.5">
          {hint}
        </span>
      </div>
    </Link>
  );
}
