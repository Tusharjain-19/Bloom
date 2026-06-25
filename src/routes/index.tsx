import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveSalonImage, type Salon } from "@/lib/salons";
import heroImg from "@/assets/hero.jpg";
import { ArrowRight } from "lucide-react";

const featuredQuery = queryOptions({
  queryKey: ["salons", "featured"],
  queryFn: async (): Promise<Salon[]> => {
    const { data, error } = await supabase
      .from("salons")
      .select("*")
      .eq("featured", true)
      .order("rating", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Salon[];
  },
});

const allSalonsQuery = queryOptions({
  queryKey: ["salons", "all"],
  queryFn: async (): Promise<Salon[]> => {
    const { data, error } = await supabase
      .from("salons")
      .select("*")
      .eq("status", "approved")
      .eq("published", true)
      .order("rating", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Salon[];
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bloom | Bangalore's Luxury Salon Booking" },
      {
        name: "description",
        content:
          "Discover and instantly book Bangalore's most exclusive luxury salons. Premium experience, real-time slots, verified reviews.",
      },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(featuredQuery),
      context.queryClient.ensureQueryData(allSalonsQuery),
    ]),
  component: Landing,
});

/* ──────────────────────────────────────────────
   SERVICE CATEGORIES for the marquee
   ────────────────────────────────────────────── */
const SERVICES = ["Hair", "Skin", "Nails", "Bridal", "Spa", "Makeup", "Colour", "Wellness"];

/* ──────────────────────────────────────────────
   LANDING PAGE
   ────────────────────────────────────────────── */
function Landing() {
  const { data: featured } = useSuspenseQuery(featuredQuery);
  const { data: allSalons } = useSuspenseQuery(allSalonsQuery);
  const navigate = useNavigate();

  const [selectedSlug, setSelectedSlug] = useState("");
  const [selectedService, setSelectedService] = useState("");

  const activeSalon = allSalons.find((s) => s.slug === selectedSlug);
  const services = activeSalon?.services ?? [];

  // Reset service when salon changes
  const handleSalonChange = (slug: string) => {
    setSelectedSlug(slug);
    const salonObj = allSalons.find((s) => s.slug === slug);
    if (salonObj && salonObj.services && salonObj.services.length > 0) {
      setSelectedService(salonObj.services[0].name);
    } else {
      setSelectedService("");
    }
  };

  const handleBook = () => {
    if (!selectedSlug) return;
    navigate({
      to: "/salons/$slug",
      params: { slug: selectedSlug },
      search: {
        book: "true",
        service: selectedService,
      },
    });
  };

  return (
    <div>
      {/* ───── HERO ───── */}
      <section className="mx-auto max-w-[1200px] px-6 md:px-8 pt-12 pb-24 md:pt-20 md:pb-40">
        <div className="grid gap-12 md:grid-cols-[1fr_480px] lg:grid-cols-[1fr_520px] items-center">
          {/* Left — Editorial copy */}
          <div className="flex flex-col justify-center luxury-text-reveal">
            <span className="text-[10px] uppercase tracking-[0.2em] text-light-gray mb-6 block font-medium">
              Exclusive Luxury · Bengaluru
            </span>

            <h1 className="font-display text-5xl leading-[1.05] md:text-7xl lg:text-[88px] tracking-[-0.04em] font-normal">
              The Finest <br />
              Salons.
            </h1>

            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-warm-gray font-light">
              Experience unmatched beauty and wellness. Instantly discover and reserve appointments
              at handpicked hair, skin, nail, and spa studios across Bangalore.
            </p>

            {/* QUICK BOOKING SELECTOR */}
            <div className="mt-10 border border-foreground/10 bg-surface-warm p-6 shadow-soft w-full max-w-lg transition-all duration-300">
              <div className="text-[10px] uppercase tracking-[0.2em] text-bronze font-bold mb-4">
                Quick Reservation
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[9px] uppercase tracking-[0.15em] font-semibold text-warm-gray">
                    Select Salon
                  </span>
                  <Select value={selectedSlug} onValueChange={handleSalonChange}>
                    <SelectTrigger className="w-full rounded-none border border-foreground/10 bg-background px-3 py-2.5 text-[13px] h-[40px] text-left font-sans shadow-none focus:ring-0 focus:border-bronze">
                      <SelectValue placeholder="Choose a salon..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border border-foreground/10 bg-background shadow-lift">
                      {allSalons.map((s) => (
                        <SelectItem
                          key={s.id}
                          value={s.slug}
                          className="text-[13px] py-2 cursor-pointer focus:bg-bronze/5 focus:text-bronze rounded-none"
                        >
                          {s.name} ({s.neighborhood})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[9px] uppercase tracking-[0.15em] font-semibold text-warm-gray">
                    Select Service
                  </span>
                  <Select
                    value={selectedService}
                    onValueChange={setSelectedService}
                    disabled={!selectedSlug || services.length === 0}
                  >
                    <SelectTrigger className="w-full rounded-none border border-foreground/10 bg-background px-3 py-2.5 text-[13px] h-[40px] text-left font-sans shadow-none focus:ring-0 focus:border-bronze disabled:opacity-40">
                      <SelectValue placeholder="Select a service..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border border-foreground/10 bg-background shadow-lift">
                      {services.map((svc) => (
                        <SelectItem
                          key={svc.name}
                          value={svc.name}
                          className="text-[13px] py-2 cursor-pointer focus:bg-bronze/5 focus:text-bronze rounded-none"
                        >
                          {svc.name} · ₹{svc.price.toLocaleString("en-IN")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              </div>

              <button
                onClick={handleBook}
                disabled={!selectedSlug}
                className="mt-6 w-full bg-foreground px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-background hover:bg-bronze transition-colors duration-300 disabled:opacity-40 cursor-pointer text-center"
              >
                Instant Book Appointment
              </button>
            </div>

            <div className="mt-8 flex gap-6 text-[10px] uppercase tracking-[0.18em] font-semibold">
              <Link
                to="/browse"
                className="group inline-flex items-center gap-2 border-b border-foreground/20 pb-0.5 text-warm-gray hover:text-bronze hover:border-bronze transition-all"
              >
                Browse all directory
                <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Stats row */}
            <div className="hidden md:grid grid-cols-3 mt-20 pt-8 border-t border-foreground/6">
              <div className="flex flex-col">
                <span className="font-display text-3xl tracking-[-0.03em] mb-1.5">120+</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-light-gray font-medium">
                  Verified
                </span>
              </div>
              <div className="flex flex-col border-l border-foreground/6 pl-8">
                <span className="font-display text-3xl tracking-[-0.03em] mb-1.5">14</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-light-gray font-medium">
                  Neighborhoods
                </span>
              </div>
              <div className="flex flex-col border-l border-foreground/6 pl-8">
                <span className="font-display text-3xl tracking-[-0.03em] text-bronze mb-1.5">
                  4.8<span className="text-lg align-top">★</span>
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-light-gray font-medium">
                  Avg rating
                </span>
              </div>
            </div>
          </div>

          {/* Right — Editorial hero image */}
          <div className="relative aspect-3/4 w-full overflow-hidden bg-surface-warm luxury-reveal-img reveal-delay-2">
            <img
              src={heroImg}
              alt="Stylist working on a guest at a Bangalore luxury salon"
              className="editorial-img h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ───── SERVICES MARQUEE ───── */}
      <section className="w-full border-y border-foreground/5 py-5 bg-surface-warm overflow-hidden">
        <div className="marquee-track">
          {[...SERVICES, ...SERVICES, ...SERVICES, ...SERVICES].map((service, i) => (
            <span key={i} className="flex items-center gap-6 px-6">
              <span className="text-[12px] uppercase tracking-[0.2em] text-warm-gray font-medium whitespace-nowrap">
                {service}
              </span>
              <span className="text-[6px] text-champagne">●</span>
            </span>
          ))}
        </div>
      </section>

      {/* ───── FEATURED SALONS ───── */}
      <section className="mx-auto max-w-[1200px] px-6 md:px-8 py-24 md:py-40">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <h2 className="font-display text-3xl md:text-[42px] tracking-[-0.03em] font-normal luxury-text-reveal">
            Curated Selection
          </h2>
          <Link
            to="/browse"
            className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-warm-gray hover:text-bronze transition-colors duration-300 font-medium luxury-text-reveal reveal-delay-1"
          >
            View all directory
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((s, idx) => (
            <SalonCard key={s.id} salon={s} index={idx} />
          ))}
        </div>
      </section>

      {/* ───── BRAND STATEMENT ───── */}
      <section className="mx-auto max-w-[800px] px-6 md:px-8 text-center py-24 md:py-40">
        <h2 className="font-display text-3xl md:text-5xl lg:text-6xl tracking-[-0.04em] leading-tight mb-6 font-normal luxury-text-reveal">
          "Where beauty meets intention."
        </h2>
        <p className="text-[11px] uppercase tracking-[0.2em] text-light-gray font-medium luxury-text-reveal reveal-delay-1">
          Elevating personal care in Bengaluru
        </p>
      </section>
    </div>
  );
}

/* ──────────────────────────────────────────────
   SALON CARD — Editorial style
   ────────────────────────────────────────────── */
function SalonCard({ salon, index }: { salon: Salon; index: number }) {
  return (
    <Link
      to="/salons/$slug"
      params={{ slug: salon.slug }}
      className={`group block luxury-text-reveal reveal-delay-${Math.min(index + 1, 4)}`}
    >
      {/* Image container */}
      <div className="relative aspect-4/5 w-full overflow-hidden bg-surface-warm mb-5">
        <img
          src={resolveSalonImage(salon.image_url)}
          alt={salon.name}
          loading="lazy"
          className="editorial-img h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Price tier badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-foreground z-10 font-medium">
          {salon.price_tier}
        </div>
      </div>

      {/* Card text */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl md:text-2xl tracking-[-0.02em] group-hover:text-bronze transition-colors duration-300">
            {salon.name}
          </h3>
        </div>
        <p className="mt-2 line-clamp-1 text-[11px] text-light-gray tracking-[0.08em] uppercase font-medium">
          {salon.neighborhood} · {salon.specialties.slice(0, 2).join(", ")}
        </p>
      </div>
    </Link>
  );
}
