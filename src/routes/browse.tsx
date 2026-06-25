import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveSalonImage, type Salon } from "@/lib/salons";
import { MapPin, Search, Star } from "lucide-react";

const allSalonsQuery = queryOptions({
  queryKey: ["salons", "all"],
  queryFn: async (): Promise<Salon[]> => {
    const { data, error } = await supabase
      .from("salons")
      .select("*")
      .order("featured", { ascending: false })
      .order("rating", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Salon[];
  },
});

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse luxury salons in Bangalore | Bloom" },
      {
        name: "description",
        content:
          "Verified luxury hair, skin, nail, bridal and wellness salons across Indiranagar, Koramangala, HSR, Jayanagar, Whitefield and more.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(allSalonsQuery),
  component: BrowsePage,
});

const CATEGORIES = ["All", "Hair", "Skin", "Nails", "Bridal", "Ayurveda", "Men"];

function matchCategory(salon: Salon, cat: string): boolean {
  if (cat === "All") return true;
  const tags = salon.specialties.join(" ").toLowerCase();
  if (cat === "Hair") return /hair|cut|colour|color|balayage|keratin/.test(tags);
  if (cat === "Skin") return /skin|facial|hydra|peel/.test(tags);
  if (cat === "Nails") return /nail|pedicure|mani/.test(tags);
  if (cat === "Bridal") return /bridal|airbrush|drap/.test(tags);
  if (cat === "Ayurveda") return /ayurveda|wellness|massage/.test(tags);
  if (cat === "Men") return /men|beard|shave/.test(tags);
  return true;
}

function BrowsePage() {
  const { data: salons } = useSuspenseQuery(allSalonsQuery);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return salons.filter((s) => {
      if (!matchCategory(s, cat)) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.neighborhood.toLowerCase().includes(q) ||
        s.specialties.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [salons, query, cat]);

  return (
    <div className="mx-auto max-w-[1200px] px-6 md:px-8 py-12 md:py-24">
      <div className="max-w-2xl luxury-text-reveal">
        <div className="text-[10px] uppercase tracking-[0.2em] text-light-gray mb-6 font-medium">
          {filtered.length} salons · Bengaluru
        </div>
        <h1 className="font-display text-5xl md:text-6xl tracking-[-0.04em] font-normal">
          Directory
        </h1>
        <p className="mt-6 text-[15px] leading-relaxed text-warm-gray font-light max-w-md">
          Search by name, neighborhood, or service. All venues hand-verified by the Bloom team.
        </p>
      </div>

      <div className="mt-16 flex flex-col gap-6 border-y border-foreground/6 py-6 md:flex-row md:items-center luxury-text-reveal reveal-delay-1">
        <div className="relative flex-1">
          <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-gray" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search directory..."
            className="w-full bg-transparent pl-8 pr-4 py-2 text-[15px] outline-none border-none focus:ring-0 placeholder:text-warm-gray font-light"
          />
        </div>
        <div className="flex gap-6 overflow-x-auto pb-1 text-[11px] tracking-[0.18em] uppercase font-medium">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`whitespace-nowrap pb-1.5 border-b transition-colors duration-300 ${
                cat === c
                  ? "border-foreground text-foreground"
                  : "border-transparent text-warm-gray hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s, idx) => (
          <Link
            key={s.id}
            to="/salons/$slug"
            params={{ slug: s.slug }}
            className={`group block luxury-text-reveal reveal-delay-${Math.min(idx + 1, 4)}`}
          >
            <div className="relative aspect-4/5 w-full overflow-hidden bg-surface-warm mb-5">
              <img
                src={resolveSalonImage(s.image_url)}
                alt={s.name}
                loading="lazy"
                className="editorial-img h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-foreground z-10 font-medium">
                {s.price_tier}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl md:text-2xl tracking-[-0.02em] group-hover:text-bronze transition-colors duration-300">
                  {s.name}
                </h3>
              </div>
              <p className="mt-2 line-clamp-1 text-[11px] text-light-gray tracking-[0.08em] uppercase font-medium">
                {s.neighborhood} · {s.specialties.slice(0, 2).join(", ")}
              </p>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full border border-foreground/6 bg-surface-warm p-16 text-center text-[11px] tracking-[0.2em] uppercase text-warm-gray font-medium luxury-text-reveal reveal-delay-2">
            No salons match. Try a different filter.
          </div>
        )}
      </div>
    </div>
  );
}
