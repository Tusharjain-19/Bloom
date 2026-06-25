import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarPlus, Check, MessageCircle, Sparkles } from "lucide-react";

type StoredBooking = {
  id: string;
  salon_name: string;
  salon_slug: string;
  service_name: string;
  service_price: number;
  booking_date: string;
  booking_time: string;
  customer_name: string;
  customer_phone: string;
  notes: string | null;
};

export const Route = createFileRoute("/booking/$id")({
  head: () => ({ meta: [{ title: "Booking confirmed | Bloom" }] }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { id } = Route.useParams();
  const [booking, setBooking] = useState<StoredBooking | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`bloom-booking-${id}`);
      if (raw) setBooking(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [id]);

  const ref = `BLM-${id.slice(0, 8).toUpperCase()}`;

  const icsHref = booking ? makeIcsHref(booking) : "#";

  return (
    <div className="mx-auto max-w-[800px] px-6 py-20 reveal">
      <div className="border border-foreground/10 bg-surface-warm p-8 md:p-14 shadow-lift">
        <div className="grid h-14 w-14 place-items-center border border-bronze bg-bronze/5 text-bronze mb-8">
          <Check className="h-6 w-6" />
        </div>
        <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-medium text-bronze">
          <Sparkles className="h-3.5 w-3.5" /> Booking request received
        </div>
        <h1 className="mt-4 font-display text-4xl md:text-5xl tracking-[-0.02em]">
          You're on the list ✨
        </h1>
        <p className="mt-4 text-[15px] font-light text-warm-gray leading-relaxed max-w-lg">
          <span className="font-medium text-foreground">{booking?.salon_name ?? "The salon"}</span>{" "}
          will confirm your appointment shortly.
        </p>

        <div className="mt-10 border border-foreground/10 p-6 md:p-8 bg-background">
          <Row label="Reference" value={ref} mono />
          {booking && (
            <>
              <Row label="Salon" value={booking.salon_name} />
              <Row
                label="Service"
                value={`${booking.service_name} · ₹${booking.service_price.toLocaleString("en-IN")}`}
              />
              <Row
                label="When"
                value={`${formatDate(booking.booking_date)} at ${booking.booking_time}`}
              />
              <Row label="Name" value={booking.customer_name} />
              <Row label="Phone" value={booking.customer_phone} />
              {booking.notes && <Row label="Notes" value={booking.notes} />}
            </>
          )}
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          {booking && (
            <a
              href={icsHref}
              download={`bloom-booking-${ref}.ics`}
              className="inline-flex items-center gap-2 bg-foreground px-6 py-4 text-[11px] uppercase tracking-[0.2em] font-medium text-background hover:bg-bronze transition-colors duration-300"
            >
              <CalendarPlus className="h-4 w-4" /> Add to calendar
            </a>
          )}
        </div>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-foreground/10 pt-6">
        <Link
          to="/browse"
          className="text-[11px] uppercase tracking-[0.2em] font-medium text-warm-gray hover:text-bronze transition-colors"
        >
          ← Discover more salons
        </Link>
        <Link
          to="/dashboard"
          className="border border-foreground/10 px-6 py-3.5 text-[11px] uppercase tracking-[0.2em] font-medium hover:border-bronze hover:text-bronze transition-colors"
        >
          View all bookings
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-foreground/10 py-4 last:border-0">
      <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-warm-gray">
        {label}
      </span>
      <span
        className={
          mono
            ? "font-mono text-[13px] tracking-widest text-foreground"
            : "text-[14px] font-medium text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
  } catch {
    return s;
  }
}

function makeIcsHref(b: StoredBooking) {
  const dt = b.booking_date.replace(/-/g, "");
  const t = b.booking_time.replace(":", "") + "00";
  const dtStart = `${dt}T${t}`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${b.service_name} at ${b.salon_name}`,
    `DTSTART:${dtStart}`,
    `DESCRIPTION:Bloom booking ${b.id}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
