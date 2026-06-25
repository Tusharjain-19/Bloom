import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { resolveSalonImage, type Salon, type SalonService } from "@/lib/salons";
import { createRazorpayQR, checkRazorpayPaymentStatus } from "@/lib/api/payment.functions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as UiCalendar } from "@/components/ui/calendar";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  Star,
  User,
  CreditCard,
  QrCode,
  Loader2,
} from "lucide-react";

const salonQuery = (slug: string) =>
  queryOptions({
    queryKey: ["salon", slug],
    queryFn: async (): Promise<Salon> => {
      const { data, error } = await supabase
        .from("salons")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as unknown as Salon;
    },
  });

export const Route = createFileRoute("/salons/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(salonQuery(params.slug)),
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} | Bloom Bangalore` },
      { name: "description", content: "Book this luxury Bangalore salon on Bloom." },
    ],
  }),
  component: SalonPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-5 py-24 text-center">
      <h1 className="font-display text-3xl">Salon not found</h1>
      <Link to="/browse" className="mt-4 inline-block text-primary underline">
        Browse all salons
      </Link>
    </div>
  ),
});

function SalonPage() {
  const { slug } = Route.useParams();
  const { data: salon } = useSuspenseQuery(salonQuery(slug));
  const [selected, setSelected] = useState<SalonService | null>(salon.services[0] ?? null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const serviceName = searchParams.get("service");
    const bookParam = searchParams.get("book");

    if (serviceName) {
      const found = salon.services.find((s) => s.name.toLowerCase() === serviceName.toLowerCase());
      if (found) setSelected(found);
    }

    if (bookParam === "true") {
      setBookingOpen(true);
      // Clean up search params so they don't persist on re-opens or reloads
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [salon]);

  return (
    <div className="mx-auto max-w-[1200px] px-6 md:px-8 py-12 md:py-24">
      <Link
        to="/browse"
        className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-warm-gray hover:text-bronze transition-colors duration-300 font-medium luxury-text-reveal"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />{" "}
        Back to browse
      </Link>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div className="luxury-text-reveal reveal-delay-1">
          <div className="relative aspect-4/3 w-full overflow-hidden bg-surface-warm luxury-reveal-img mb-8">
            <img
              src={resolveSalonImage(salon.image_url)}
              alt={salon.name}
              className="editorial-img h-full w-full object-cover"
            />
          </div>

          <div className="mt-8">
            <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.18em] font-medium">
              <span className="text-bronze tracking-[0.15em]">Verified by Bloom</span>
              <span className="text-light-gray">{salon.price_tier}</span>
              <span className="flex items-center gap-1 text-foreground">
                <Star className="h-3.5 w-3.5 fill-current text-bronze" /> {salon.rating}
                <span className="text-light-gray ml-1">
                  ({salon.review_count.toLocaleString("en-IN")} reviews)
                </span>
              </span>
            </div>
            <h1 className="mt-4 font-display text-4xl md:text-6xl tracking-[-0.03em]">
              {salon.name}
            </h1>
            {salon.tagline && (
              <p className="mt-3 text-lg italic text-warm-gray tracking-wide">{salon.tagline}</p>
            )}
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-warm-gray font-light">
              {salon.description}
            </p>

            <div className="mt-8 grid gap-4 text-[13px] sm:grid-cols-3">
              <InfoLine icon={MapPin} label={salon.address} />
              <InfoLine icon={Clock} label={salon.hours} />
              {salon.phone && <InfoLine icon={Phone} label={salon.phone} />}
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {salon.specialties.map((s) => (
                <span
                  key={s}
                  className="border border-foreground/10 px-4 py-1.5 text-[10px] uppercase tracking-[0.15em] font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-16">
            <h2 className="font-display text-3xl tracking-[-0.02em]">Services & pricing</h2>
            <div className="mt-6 divide-y divide-foreground/6 border-y border-foreground/6 bg-transparent">
              {salon.services.map((svc) => (
                <button
                  key={svc.name}
                  onClick={() => setSelected(svc)}
                  className={`flex w-full items-center justify-between gap-4 py-6 text-left transition duration-300 hover:bg-surface-warm px-4 ${
                    selected?.name === svc.name ? "bg-surface-warm" : ""
                  }`}
                >
                  <div>
                    <div className="font-medium tracking-wide text-[15px]">{svc.name}</div>
                    <div className="text-[12px] text-warm-gray mt-1 tracking-wide">
                      {svc.duration}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="font-display text-xl tracking-[-0.02em]">
                      ₹{svc.price.toLocaleString("en-IN")}
                    </div>
                    {selected?.name === svc.name && <Check className="h-4 w-4 text-bronze" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start luxury-text-reveal reveal-delay-2">
          <div className="border border-foreground/10 bg-surface-warm p-8 shadow-soft">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-medium text-bronze">
              <Sparkles className="h-3.5 w-3.5" /> Instant booking
            </div>
            <div className="mt-4 font-display text-2xl tracking-[-0.02em]">
              {selected ? selected.name : "Pick a service"}
            </div>
            {selected && (
              <div className="mt-2 text-[13px] text-warm-gray tracking-wide">
                {selected.duration} · ₹{selected.price.toLocaleString("en-IN")}
              </div>
            )}
            <button
              onClick={() => setBookingOpen(true)}
              disabled={!selected}
              className="mt-8 w-full bg-foreground px-6 py-4 text-[11px] uppercase tracking-[0.2em] font-medium text-background hover:bg-bronze transition-colors duration-300 disabled:opacity-40"
            >
              Book appointment
            </button>
            <button
              onClick={() => setRequestOpen(true)}
              className="mt-3 w-full border border-foreground/10 bg-transparent px-6 py-3.5 text-[11px] uppercase tracking-[0.2em] font-medium hover:border-bronze hover:text-bronze transition-colors duration-300"
            >
              Send a special request →
            </button>
          </div>
        </aside>
      </div>

      {requestOpen && (
        <SpecialRequestModal
          salonId={salon.id}
          salonName={salon.name}
          onClose={() => setRequestOpen(false)}
        />
      )}

      {bookingOpen && selected && (
        <BookingModal salon={salon} service={selected} onClose={() => setBookingOpen(false)} />
      )}
    </div>
  );
}

function InfoLine({ icon: Icon, label }: { icon: typeof MapPin; label: string }) {
  return (
    <div className="flex items-start gap-2 text-foreground/80">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <span>{label}</span>
    </div>
  );
}

// ---------- 4-STEP BOOKING MODAL ----------

const STYLISTS = ["Any available", "Senior stylist", "Master stylist"];
const TIMES = ["10:00", "11:00", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30"];

function BookingModal({
  salon,
  service,
  onClose,
}: {
  salon: Salon;
  service: SalonService;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [stylist, setStylist] = useState(STYLISTS[0]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Razorpay payment integration states
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [paymentTab, setPaymentTab] = useState<"upi" | "card">("upi");
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrData, setQrData] = useState<{
    imageUrl: string;
    upiString: string;
    qrCodeId: string;
    isFallback: boolean;
  } | null>(null);

  // Card payment simulation states
  const [cardNo, setCardNo] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [processingCard, setProcessingCard] = useState(false);
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpVal, setOtpVal] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const hasDeposit = salon.booking_amount && salon.booking_amount > 0;
  const totalSteps = hasDeposit ? 4 : 3;

  // Advanced capacity/holiday states
  interface BookingMini {
    booking_date: string;
    booking_time: string;
    status: string;
  }
  const [activeBookings, setActiveBookings] = useState<BookingMini[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (user) {
      setName((user.user_metadata?.full_name as string) ?? "");
      setEmail(user.email ?? "");
    }
  }, [user]);

  // Load QR code for booking deposit
  useEffect(() => {
    if (step === 4 && paymentTab === "upi" && createdBookingId && salon.booking_amount) {
      const loadQR = async () => {
        setLoadingQr(true);
        try {
          const res = await createRazorpayQR({
            data: {
              amount: salon.booking_amount!,
              name: salon.name,
              description: `Booking Deposit - ${service.name}`,
              bookingId: createdBookingId,
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
      loadQR();
    }
  }, [
    step,
    paymentTab,
    createdBookingId,
    salon.booking_amount,
    salon.name,
    salon.id,
    service.name,
  ]);

  // Poll for booking QR payment completion
  useEffect(() => {
    if (step !== 4 || paymentTab !== "upi" || !qrData || qrData.isFallback || !createdBookingId)
      return;
    const interval = setInterval(async () => {
      try {
        const res = await checkRazorpayPaymentStatus({ data: { qrCodeId: qrData.qrCodeId } });
        if (res.success && res.paid) {
          const { error } = await supabase
            .from("bookings")
            .update({
              status: "pending",
              payment_status: "paid",
              payment_method: "upi",
              payment_id: res.paymentId || "rzp_qr_tr_" + Math.random().toString(36).substring(2),
              advance_paid: salon.booking_amount,
            } as any)
            .eq("id", createdBookingId);

          if (error) {
            toast.error("Failed to update booking payment: " + error.message);
            return;
          }

          toast.success("Deposit Payment Received! 🎉");
          const stored = {
            id: createdBookingId,
            salon_name: salon.name,
            salon_slug: salon.slug,
            service_name: service.name,
            service_price: service.price,
            booking_date: date,
            booking_time: time,
            customer_name: name,
            customer_phone: phone,
            notes: notes || null,
          };
          sessionStorage.setItem(`bloom-booking-${createdBookingId}`, JSON.stringify(stored));
          navigate({ to: "/booking/$id", params: { id: createdBookingId } });
          clearInterval(interval);
        }
      } catch (e) {
        // ignore background errors
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [
    step,
    paymentTab,
    qrData,
    createdBookingId,
    salon.booking_amount,
    date,
    time,
    name,
    phone,
    notes,
  ]);

  useEffect(() => {
    let active = true;
    (supabase.from("booking_slots" as any) as any)
      .select("booking_date,booking_time,status")
      .eq("salon_id", salon.id)
      .neq("status", "cancelled")
      .gte("booking_date", today)
      .then((res: any) => {
        if (
          res.error &&
          (res.error.code === "PGRST301" ||
            (res.error as any).status === 401 ||
            (res.error.message || "").toLowerCase().includes("jwt"))
        ) {
          // Stale session, clear and reload
          supabase.auth.signOut().then(() => {
            window.location.reload();
          });
          return;
        }
        if (!active) return;
        if (res.data) setActiveBookings(res.data as BookingMini[]);
        setLoadingConfig(false);
      });
    return () => {
      active = false;
    };
  }, [salon.id, today]);

  const selectedDayOfWeek = useMemo(() => {
    if (!date) return null;
    const d = new Date(date);
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return days[d.getDay()];
  }, [date]);

  const availableSlots = useMemo(() => {
    if (!selectedDayOfWeek || !salon.operating_hours) return TIMES;
    const oh = salon.operating_hours[selectedDayOfWeek];
    if (!oh || !oh.open || !oh.close) return TIMES;

    const slots: string[] = [];
    const current = new Date(`1970-01-01T${oh.open}:00`);
    const end = new Date(`1970-01-01T${oh.close}:00`);
    while (current < end) {
      slots.push(current.toTimeString().slice(0, 5));
      current.setMinutes(current.getMinutes() + 30);
    }
    return slots.length > 0 ? slots : TIMES;
  }, [selectedDayOfWeek, salon.operating_hours]);

  const selectedDateHoliday = useMemo(() => {
    if (!date) return false;
    return (salon.salon_holidays ?? []).includes(date);
  }, [date, salon.salon_holidays]);

  const isDateFullyBooked = useMemo(() => {
    if (!date) return false;
    const maxDaily = salon.max_bookings_per_day ?? 20;
    const bookingsOnDate = activeBookings.filter((b) => b.booking_date === date).length;
    return bookingsOnDate >= maxDaily;
  }, [date, activeBookings, salon.max_bookings_per_day]);

  const getSlotAvailability = (slotTime: string) => {
    if (!date) return { available: true, seatsLeft: 1 };
    const capacity = salon.max_bookings_per_hour ?? 1;
    const bookingsForSlot = activeBookings.filter(
      (b) => b.booking_date === date && b.booking_time.slice(0, 5) === slotTime,
    ).length;

    const seatsLeft = Math.max(0, capacity - bookingsForSlot);
    return {
      available: seatsLeft > 0,
      seatsLeft,
      capacity,
    };
  };

  const canNext = () => {
    if (step === 1) return !!name.trim() && !!phone.trim();
    if (step === 2) {
      if (!date || !time) return false;
      if (selectedDateHoliday) return false;
      if (isDateFullyBooked) return false;
      const { available } = getSlotAvailability(time);
      return available;
    }
    return true;
  };

  const submit = async () => {
    setSubmitting(true);
    const bookingId =
      typeof window !== "undefined" && window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

    const insertPayload = {
      id: bookingId,
      salon_id: salon.id,
      service_name: service.name,
      service_price: service.price,
      booking_date: date,
      booking_time: time,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_email: email || null,
      notes:
        [stylist !== STYLISTS[0] ? `Preferred stylist: ${stylist}` : null, notes || null]
          .filter(Boolean)
          .join(" · ") || null,
      status: hasDeposit ? "pending_payment" : "pending",
      payment_status: hasDeposit ? "unpaid" : "unpaid",
      user_id: user?.id ?? null,
    };

    let { error } = await supabase.from("bookings").insert(insertPayload as any);
    if (
      error &&
      (error.code === "PGRST301" ||
        (error as any).status === 401 ||
        (error.message || "").toLowerCase().includes("jwt"))
    ) {
      // Stale session detected! Clear local storage session and retry guest booking
      await supabase.auth.signOut();
      const retry = await supabase
        .from("bookings")
        .insert({ ...insertPayload, user_id: null } as any);
      error = retry.error;
    }
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't submit booking. Please try again.");
      return;
    }

    if (hasDeposit) {
      setCreatedBookingId(bookingId);
      setStep(4);
    } else {
      try {
        const stored = {
          id: bookingId,
          salon_id: salon.id,
          service_name: service.name,
          service_price: service.price,
          booking_date: date,
          booking_time: time,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          customer_email: email || null,
          notes: insertPayload.notes,
          salon_name: salon.name,
          salon_slug: salon.slug,
        };
        sessionStorage.setItem(`bloom-booking-${bookingId}`, JSON.stringify(stored));
      } catch {
        /* sessionStorage unavailable */
      }
      toast.success(`Booking sent to ${salon.name}!`);
      navigate({ to: "/booking/$id", params: { id: bookingId } });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm md:items-center md:p-6 chat-panel-animate">
      <div className="relative w-full max-w-xl overflow-hidden bg-background shadow-lift border border-foreground/10">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 z-10 text-[10px] uppercase tracking-[0.2em] font-medium text-warm-gray hover:text-foreground transition-colors"
          aria-label="Close"
        >
          Close
        </button>

        {/* Stepper */}
        <div className="border-b border-foreground/10 px-8 py-6 bg-surface-warm">
          <div className="text-[10px] uppercase tracking-[0.2em] text-bronze font-semibold">
            {salon.name}
          </div>
          <div className="mt-4 flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, idx) => {
              const n = idx + 1;
              return (
                <div key={n} className="flex flex-1 items-center gap-2">
                  <div
                    className={`grid h-6 w-6 place-items-center text-[10px] font-medium border ${
                      step >= n
                        ? "border-bronze bg-bronze text-background"
                        : "border-foreground/20 text-warm-gray"
                    }`}
                  >
                    {step > n ? <Check className="h-3 w-3" /> : n}
                  </div>
                  {n < totalSteps && (
                    <div
                      className={`h-[1px] flex-1 ${step > n ? "bg-bronze" : "bg-foreground/10"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-[11px] uppercase tracking-[0.15em] text-warm-gray font-medium">
            Step {step} of {totalSteps} ·{" "}
            {["Guest Details", "Reserve Slot", "Confirm Book", "Payment"][step - 1]}
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-8 py-8">
          {step === 1 && (
            <div className="luxury-text-reveal">
              <h3 className="font-display text-3xl tracking-[-0.02em] mb-2">Guest Details</h3>
              <p className="text-[13px] text-warm-gray font-light mb-6">
                Please enter your information and styling preference.
              </p>

              <div className="grid gap-5">
                <Field label="Your name">
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                    placeholder="Ananya Rao"
                  />
                </Field>
                <Field label="Phone Number">
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input"
                    placeholder="+91 98xxx xxxxx"
                  />
                </Field>
                <Field label="Email (optional)">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="you@email.com"
                  />
                </Field>

                <div className="mt-2">
                  <span className="mb-2.5 block text-[11px] uppercase tracking-[0.15em] font-medium text-warm-gray">
                    Stylist Preference
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {STYLISTS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStylist(s)}
                        className={`border p-3 text-[12px] transition flex flex-col items-center justify-center min-h-[50px] cursor-pointer ${
                          stylist === s
                            ? "border-bronze bg-bronze/5 text-bronze font-medium"
                            : "border-foreground/10 hover:border-foreground/30 hover:bg-surface-warm"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <Field label="Special Requests / Notes (optional)">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="input resize-none"
                    placeholder="Allergies, preferences, hair length..."
                  />
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="luxury-text-reveal">
              <h3 className="font-display text-3xl tracking-[-0.02em] mb-2">When works for you?</h3>
              <p className="text-[13px] text-warm-gray font-light mb-6">
                Choose an available slot for {service.name}.
              </p>

              <div className="grid gap-6">
                <label className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-[0.15em] font-medium text-warm-gray">
                    Date
                  </span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full text-left bg-transparent border border-foreground/15 px-4 py-3 text-xs uppercase tracking-widest font-semibold outline-none focus:border-bronze rounded-none cursor-pointer flex justify-between items-center hover:border-foreground/30 transition-all duration-300">
                        <span className="text-foreground">
                          {date
                            ? new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Select reservation date..."}
                        </span>
                        <Calendar className="h-4 w-4 text-bronze" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 rounded-none border border-foreground/10 bg-background/95 backdrop-blur-xl shadow-2xl animate-in zoom-in-95 duration-300"
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
                          setTime(""); // reset selected slot
                        }}
                        disabled={(dateVal) => {
                          const todayVal = new Date();
                          todayVal.setHours(0, 0, 0, 0);
                          return dateVal < todayVal;
                        }}
                        className="rounded-none border-0"
                      />
                    </PopoverContent>
                  </Popover>
                </label>

                {selectedDateHoliday && (
                  <div className="border border-red-200 bg-red-50/50 p-4 text-[13px] text-red-800">
                    ⚠️ Closed: The salon is closed on this date.
                  </div>
                )}

                {!selectedDateHoliday && isDateFullyBooked && (
                  <div className="border border-amber-200 bg-amber-50/50 p-4 text-[13px] text-amber-800">
                    ⚠️ Fully booked: This date has reached its maximum daily booking limit. Please
                    select another day.
                  </div>
                )}

                {loadingConfig && date && !selectedDateHoliday && (
                  <div className="text-[12px] uppercase tracking-[0.15em] text-warm-gray py-4 animate-pulse">
                    Checking availability…
                  </div>
                )}

                {date && !selectedDateHoliday && !isDateFullyBooked && !loadingConfig && (
                  <div className="reveal">
                    <span className="mb-3 block text-[11px] uppercase tracking-[0.15em] font-medium text-warm-gray">
                      Time slot
                    </span>
                    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                      {availableSlots.map((t) => {
                        const { available, seatsLeft } = getSlotAvailability(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            disabled={!available}
                            onClick={() => setTime(t)}
                            className={`border p-3.5 text-[12px] transition flex flex-col items-center justify-center min-h-[58px] cursor-pointer ${
                              !available
                                ? "border-foreground/5 bg-foreground/5 text-warm-gray opacity-50 cursor-not-allowed"
                                : time === t
                                  ? "border-bronze bg-bronze text-white font-medium"
                                  : "border-foreground/10 hover:border-foreground/30 hover:bg-surface-warm"
                            }`}
                          >
                            <span className="tracking-wide">{t}</span>
                            <span
                              className={`text-[8px] uppercase tracking-[0.15em] mt-1 ${time === t ? "text-white/80" : "text-light-gray"}`}
                            >
                              {!available
                                ? "Full"
                                : seatsLeft === 1
                                  ? "1 left"
                                  : `${seatsLeft} left`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="luxury-text-reveal">
              <h3 className="font-display text-3xl tracking-[-0.02em] mb-2">Review & Confirm</h3>
              <p className="text-[13px] text-warm-gray font-light mb-6">
                Please double check your reservation details.
              </p>

              <div className="border border-foreground/10 bg-surface-warm p-6 space-y-4">
                <div className="flex justify-between border-b border-foreground/6 pb-3">
                  <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-warm-gray">
                    Salon
                  </span>
                  <span className="text-[13px] font-medium text-foreground">{salon.name}</span>
                </div>
                <div className="flex justify-between border-b border-foreground/6 pb-3">
                  <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-warm-gray">
                    Service
                  </span>
                  <span className="text-[13px] font-medium text-foreground">{service.name}</span>
                </div>
                <div className="flex justify-between border-b border-foreground/6 pb-3">
                  <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-warm-gray">
                    Price
                  </span>
                  <span className="text-[14px] font-display text-foreground">
                    ₹{service.price.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between border-b border-foreground/6 pb-3">
                  <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-warm-gray">
                    When
                  </span>
                  <span className="text-[13px] font-medium text-foreground">
                    {date} at {time}
                  </span>
                </div>
                <div className="flex justify-between border-b border-foreground/6 pb-3">
                  <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-warm-gray">
                    Stylist
                  </span>
                  <span className="text-[13px] font-medium text-foreground">{stylist}</span>
                </div>
                <div className="flex justify-between border-b border-foreground/6 pb-3">
                  <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-warm-gray">
                    Guest
                  </span>
                  <span className="text-[13px] font-medium text-foreground">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-warm-gray">
                    Phone
                  </span>
                  <span className="text-[13px] font-medium text-foreground">{phone}</span>
                </div>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="luxury-text-reveal">
              <h3 className="font-display text-3xl tracking-[-0.02em] mb-2">Secure Deposit</h3>
              <p className="text-[13px] text-warm-gray font-light mb-6">
                Pay a booking amount of ₹{salon.booking_amount} to reserve your slot at {salon.name}
                .
              </p>

              {/* Payment Tab Buttons */}
              <div className="grid grid-cols-2 gap-2 border-b border-foreground/10 pb-4 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentTab("upi");
                    setQrData(null);
                  }}
                  className={`flex items-center justify-center gap-2 p-3 border text-xs tracking-wider uppercase font-semibold transition-all ${
                    paymentTab === "upi"
                      ? "border-bronze bg-bronze/5 text-bronze"
                      : "border-foreground/10 hover:bg-surface-warm"
                  }`}
                >
                  <QrCode className="h-4 w-4" /> UPI QR Code
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentTab("card")}
                  className={`flex items-center justify-center gap-2 p-3 border text-xs tracking-wider uppercase font-semibold transition-all ${
                    paymentTab === "card"
                      ? "border-bronze bg-bronze/5 text-bronze"
                      : "border-foreground/10 hover:bg-surface-warm"
                  }`}
                >
                  <CreditCard className="h-4 w-4" /> Card Payment
                </button>
              </div>

              {/* UPI Tab Content */}
              {paymentTab === "upi" && (
                <div className="text-center space-y-4 py-2">
                  {loadingQr ? (
                    <div className="flex flex-col items-center justify-center py-6 space-y-3">
                      <Loader2 className="h-7 w-7 animate-spin text-bronze" />
                      <span className="text-[10px] uppercase tracking-widest text-warm-gray font-semibold">
                        Generating Deposit QR...
                      </span>
                    </div>
                  ) : qrData ? (
                    <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in-95">
                      <div className="p-2 border border-foreground/10 bg-white shadow-sm">
                        <img src={qrData.imageUrl} alt="UPI QR Code" className="h-40 w-40" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-bronze">
                          {qrData.isFallback ? "Direct UPI Transfer" : "Dynamic Razorpay UPI QR"}
                        </p>
                        <p className="text-[9px] text-warm-gray uppercase tracking-wider font-medium max-w-[280px]">
                          {qrData.isFallback
                            ? "Scan with any UPI app (GPay, PhonePe, Paytm) to complete payment."
                            : "Scan to pay. Once authorized, your booking is confirmed automatically."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const mockPayId =
                            "rzp_mock_bk_" + Math.random().toString(36).substring(2);
                          const { error } = await supabase
                            .from("bookings")
                            .update({
                              status: "pending",
                              payment_status: "paid",
                              payment_method: "upi",
                              payment_id: mockPayId,
                              advance_paid: salon.booking_amount,
                            } as any)
                            .eq("id", createdBookingId!);
                          if (error) {
                            toast.error("Error: " + error.message);
                            return;
                          }
                          toast.success(`Payment verified successfully! 🎉`);
                          const stored = {
                            id: createdBookingId!,
                            salon_name: salon.name,
                            salon_slug: salon.slug,
                            service_name: service.name,
                            service_price: service.price,
                            booking_date: date,
                            booking_time: time,
                            customer_name: name,
                            customer_phone: phone,
                            notes: notes || null,
                          };
                          sessionStorage.setItem(
                            `bloom-booking-${createdBookingId!}`,
                            JSON.stringify(stored),
                          );
                          navigate({ to: "/booking/$id", params: { id: createdBookingId! } });
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-none bg-foreground text-background px-4 py-2 text-[9px] uppercase tracking-widest font-bold hover:bg-bronze hover:text-white transition-all duration-300"
                      >
                        <Check className="h-3 w-3" /> Simulate Pay Success
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Select QR Tab to load payment options
                    </p>
                  )}
                </div>
              )}

              {/* Card Tab Content */}
              {paymentTab === "card" && (
                <div className="space-y-4">
                  {!showOtpScreen ? (
                    <div className="space-y-3 animate-in fade-in">
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
                        onClick={(e) => {
                          e.preventDefault();
                          if (
                            cardNo.replace(/\s/g, "").length < 16 ||
                            cardExpiry.length < 5 ||
                            cardCvv.length < 3
                          ) {
                            toast.error("Invalid card details");
                            return;
                          }
                          setProcessingCard(true);
                          setTimeout(() => {
                            setProcessingCard(false);
                            setShowOtpScreen(true);
                          }, 1500);
                        }}
                        disabled={processingCard}
                        className="w-full rounded-none bg-foreground text-background py-3 mt-4 text-[10px] uppercase tracking-widest font-bold hover:bg-bronze hover:text-white transition-colors flex justify-center items-center gap-2"
                      >
                        {processingCard ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" /> Authorizing...
                          </>
                        ) : (
                          `Pay ₹${salon.booking_amount}`
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center animate-in zoom-in-95 duration-200">
                      <div className="mx-auto h-10 w-10 border border-foreground/10 bg-surface-warm flex items-center justify-center rounded-none text-bronze">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-display text-base">OTP Authorization</h4>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium max-w-[280px] mx-auto">
                          Enter the 6-digit OTP sent to your mobile phone to complete card deposit.
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
                          onClick={async () => {
                            if (otpVal.length < 4) {
                              toast.error("Enter a valid OTP");
                              return;
                            }
                            setVerifyingOtp(true);
                            const mockPayId =
                              "rzp_mock_card_" + Math.random().toString(36).substring(2);
                            const { error } = await supabase
                              .from("bookings")
                              .update({
                                status: "pending",
                                payment_status: "paid",
                                payment_method: "card",
                                payment_id: mockPayId,
                                advance_paid: salon.booking_amount,
                              } as any)
                              .eq("id", createdBookingId!);
                            setVerifyingOtp(false);
                            if (error) {
                              toast.error("Error: " + error.message);
                              return;
                            }
                            toast.success("Card Authorized Successfully!");
                            const stored = {
                              id: createdBookingId!,
                              salon_name: salon.name,
                              salon_slug: salon.slug,
                              service_name: service.name,
                              service_price: service.price,
                              booking_date: date,
                              booking_time: time,
                              customer_name: name,
                              customer_phone: phone,
                              notes: notes || null,
                            };
                            sessionStorage.setItem(
                              `bloom-booking-${createdBookingId!}`,
                              JSON.stringify(stored),
                            );
                            navigate({ to: "/booking/$id", params: { id: createdBookingId! } });
                          }}
                          className="px-5 py-2.5 bg-bronze text-white text-[9px] uppercase tracking-widest font-bold hover:bg-foreground hover:text-background transition-colors flex items-center gap-1.5"
                        >
                          {verifyingOtp ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" /> Verifying...
                            </>
                          ) : (
                            "Verify & Pay"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {step < 4 && (
          <div className="flex items-center justify-between gap-4 border-t border-foreground/10 bg-surface-warm px-8 py-6">
            <button
              onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
              className="border-b border-foreground/30 pb-0.5 text-[11px] uppercase tracking-[0.2em] hover:text-bronze hover:border-bronze transition-colors cursor-pointer"
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>
            {step < 3 ? (
              <button
                onClick={() => canNext() && setStep(step + 1)}
                disabled={!canNext()}
                className="group inline-flex items-center gap-2 bg-foreground px-6 py-3.5 text-[11px] uppercase tracking-[0.2em] font-medium text-background hover:bg-bronze transition-colors disabled:opacity-40 cursor-pointer"
              >
                Continue{" "}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting}
                className="bg-foreground px-6 py-3.5 text-[11px] uppercase tracking-[0.2em] font-medium text-background hover:bg-bronze transition-colors disabled:opacity-40 cursor-pointer"
              >
                {submitting ? "Sending…" : `Book Now · ₹${service.price.toLocaleString("en-IN")}`}
              </button>
            )}
          </div>
        )}

        <style>{`
          .input { width:100%; border:1px solid rgba(26,26,26,0.1); background:transparent; padding:12px 16px; font-size:14px; outline:none; transition: border-color 0.3s; }
          .dark .input { border-color: rgba(255,255,255,0.1); }
          .input:focus { border-color: var(--color-bronze); }
        `}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] uppercase tracking-[0.15em] font-medium text-warm-gray">
        {label}
      </span>
      {children}
    </label>
  );
}

function SpecialRequestModal({
  salonId,
  salonName,
  onClose,
}: {
  salonId: string;
  salonName: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState((user?.user_metadata?.full_name as string) ?? "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || !phone.trim() || message.trim().length < 10) {
      toast.error("Add your details and a brief message.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("special_requests").insert({
      salon_id: salonId,
      user_id: user?.id ?? null,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_email: email.trim() || null,
      preferred_date: date || null,
      message: message.trim(),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Sent! The salon will get back to you shortly.");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm chat-panel-animate"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md border border-foreground/10 bg-background p-8 shadow-lift relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 z-10 text-[10px] uppercase tracking-[0.2em] font-medium text-warm-gray hover:text-foreground transition-colors"
          aria-label="Close"
        >
          Close
        </button>

        <div className="luxury-text-reveal">
          <h3 className="font-display text-3xl tracking-[-0.02em]">Special request</h3>
          <p className="mt-3 text-[13px] text-warm-gray font-light">
            For bridal trials, group bookings, custom services or anything not listed.{" "}
            <span className="font-medium text-foreground">{salonName}</span> will reply to you
            directly.
          </p>
          <div className="mt-8 space-y-4">
            <input
              placeholder="Your name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-foreground/10 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-bronze transition-colors"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                placeholder="Phone *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-foreground/10 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-bronze transition-colors"
              />
              <input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-foreground/10 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-bronze transition-colors"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full text-left bg-transparent border border-foreground/10 px-4 py-3 text-[14px] outline-none focus:border-bronze rounded-none cursor-pointer flex justify-between items-center hover:border-foreground/30 transition-colors duration-300">
                  <span className="text-foreground">
                    {date
                      ? new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Preferred date *"}
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
                    const todayVal = new Date();
                    todayVal.setHours(0, 0, 0, 0);
                    return dateVal < todayVal;
                  }}
                  className="rounded-none border-0"
                />
              </PopoverContent>
            </Popover>
            <textarea
              rows={4}
              placeholder="Tell them what you need…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-foreground/10 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-bronze transition-colors resize-none"
            />
          </div>
          <div className="mt-8 flex justify-end gap-4 border-t border-foreground/10 pt-6">
            <button
              onClick={onClose}
              className="border-b border-foreground/30 pb-0.5 text-[11px] uppercase tracking-[0.2em] hover:text-bronze hover:border-bronze transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={busy}
              className="bg-foreground px-6 py-3.5 text-[11px] uppercase tracking-[0.2em] font-medium text-background disabled:opacity-50 hover:bg-bronze transition-colors"
            >
              {busy ? "Sending…" : "Send request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
