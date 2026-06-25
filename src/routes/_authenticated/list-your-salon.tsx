import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { presetImageKeys, resolveSalonImage } from "@/lib/salons";
import { Sparkles, ArrowRight, FileUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/list-your-salon")({
  head: () => ({ meta: [{ title: "List your salon | Bloom" }] }),
  component: ListYourSalonPage,
});

const PRICE_TIERS = ["₹₹", "₹₹₹", "₹₹₹₹"];

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function ListYourSalonPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"verification" | "details">("verification");
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [f, setF] = useState({
    name: "",
    tagline: "",
    description: "",
    neighborhood: "",
    address: "",
    phone: "",
    email: "",
    instagram: "",
    website: "",
    hours: "10:00 AM – 9:00 PM",
    price_tier: "₹₹₹",
    specialties: "",
    image_url: "salon-1",
  });

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationFile || !user) return;
    setSubmitting(true);
    try {
      const fileExt = verificationFile.name.split(".").pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from("salon-documents")
        .upload(fileName, verificationFile);
      if (error) throw error;
      setVerificationUrl(data.path);
      toast.success("Document uploaded successfully.");
      setStep("details");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (f.name.trim().length < 3 || f.description.trim().length < 20) {
      toast.error("Please add a name and a longer description.");
      return;
    }
    setSubmitting(true);
    try {
      const slug = `${slugify(f.name)}-${Math.random().toString(36).slice(2, 6)}`;
      const { data, error } = await supabase
        .from("salons")
        .insert({
          slug,
          name: f.name.trim(),
          tagline: f.tagline.trim() || null,
          description: f.description.trim(),
          neighborhood: f.neighborhood.trim(),
          address: f.address.trim(),
          phone: f.phone.trim() || null,
          email: f.email.trim() || null,
          instagram: f.instagram.trim() || null,
          website: f.website.trim() || null,
          hours: f.hours.trim(),
          price_tier: f.price_tier,
          specialties: f.specialties
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          services: [],
          image_url: f.image_url,
          owner_id: user.id,
          status: "pending",
          published: false,
          submitted_at: new Date().toISOString(),
          verification_document: verificationUrl,
        })
        .select("slug")
        .single();
      if (error) throw error;
      toast.success("Submitted! HQ will review your salon shortly.");
      navigate({ to: "/admin/salons" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "verification") {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <h1 className="font-display text-4xl">Verification</h1>
        <p className="mt-4 text-xs tracking-wide text-muted-foreground">
          Upload a valid business registration document.
        </p>
        <form onSubmit={handleVerify} className="mt-12">
          <div className="mb-8 border-b border-border py-4">
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setVerificationFile(e.target.files?.[0] || null)}
              className="mx-auto block text-sm text-muted-foreground file:mr-4 file:border-0 file:bg-foreground file:px-6 file:py-2 file:text-xs file:font-medium file:tracking-widest file:uppercase file:text-background hover:file:opacity-90"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !verificationFile}
            className="inline-flex items-center gap-4 border-b border-foreground pb-1 text-xs uppercase tracking-widest hover:opacity-70 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Uploading…" : "Upload & Continue"} <ArrowRight className="h-3 w-3" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
        Onboarding
      </div>
      <h1 className="font-display text-4xl md:text-5xl">List your salon</h1>
      <p className="mt-4 text-xs tracking-wide text-muted-foreground">
        Submit details below. Our HQ team reviews every listing.
      </p>

      <form onSubmit={submit} className="mt-12 space-y-12">
        <Card title="The basics">
          <Field label="Salon name *">
            <input
              required
              value={f.name}
              onChange={(e) => set("name", e.target.value)}
              className="input"
              placeholder="e.g. Éclat Luxury Salon"
            />
          </Field>
          <Field label="Tagline">
            <input
              value={f.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              className="input"
              placeholder="One-line pitch"
            />
          </Field>
          <Field label="Description *">
            <textarea
              required
              rows={4}
              value={f.description}
              onChange={(e) => set("description", e.target.value)}
              className="input"
              placeholder="Tell customers what makes you special…"
            />
          </Field>
        </Card>

        <Card title="Where you are">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Neighborhood *">
              <input
                required
                value={f.neighborhood}
                onChange={(e) => set("neighborhood", e.target.value)}
                className="input"
                placeholder="Koramangala"
              />
            </Field>
            <Field label="Hours *">
              <input
                required
                value={f.hours}
                onChange={(e) => set("hours", e.target.value)}
                className="input"
              />
            </Field>
          </div>
          <Field label="Full address *">
            <input
              required
              value={f.address}
              onChange={(e) => set("address", e.target.value)}
              className="input"
              placeholder="80 Feet Road, 5th Block, Bengaluru 560034"
            />
          </Field>
        </Card>

        <Card title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone">
              <input
                value={f.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Email">
              <input
                value={f.email}
                onChange={(e) => set("email", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Instagram">
              <input
                value={f.instagram}
                onChange={(e) => set("instagram", e.target.value)}
                className="input"
                placeholder="@handle"
              />
            </Field>
            <Field label="Website">
              <input
                value={f.website}
                onChange={(e) => set("website", e.target.value)}
                className="input"
              />
            </Field>
          </div>
        </Card>

        <Card title="Positioning">
          <Field label="Price tier">
            <div className="flex flex-wrap gap-2">
              {PRICE_TIERS.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => set("price_tier", p)}
                  className={`px-4 py-2 text-xs border-b ${
                    f.price_tier === p
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Specialties (comma separated)">
            <input
              value={f.specialties}
              onChange={(e) => set("specialties", e.target.value)}
              className="input"
              placeholder="Hair colour, Bridal, Nails"
            />
          </Field>
          <Field label="Cover image (you can upload your own after approval)">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {presetImageKeys.map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => set("image_url", k)}
                  className={`overflow-hidden border transition ${
                    f.image_url === k
                      ? "border-foreground"
                      : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <img
                    src={resolveSalonImage(k)}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </Field>
        </Card>

        <div className="flex items-center justify-end mt-12 pt-8 border-t border-border">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-4 border-b border-foreground pb-1 text-xs uppercase tracking-widest hover:opacity-70 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit for review"} <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </form>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .input { width: 100%; border-bottom: 1px solid var(--border); background: transparent; padding: 0.5rem 0; font-size: 0.875rem; color: var(--foreground); }
        .input:focus { outline: none; border-bottom-color: var(--foreground); }
      `,
        }}
      />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border pb-12">
      <h3 className="font-display text-xl mb-8">{title}</h3>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
