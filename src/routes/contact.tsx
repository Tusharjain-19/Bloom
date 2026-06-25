import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Concierge & Contact | Bloom" },
      {
        name: "description",
        content: "Contact the Bloom concierge desk for bespoke bookings and support.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      toast.success("Message received. Our concierge will contact you shortly.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setBusy(false);
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-20 md:py-28 reveal">
      <div className="luxury-text-reveal">
        <div className="text-[10px] uppercase tracking-[0.25em] text-bronze font-medium mb-6">
          Concierge Desk
        </div>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl mb-8 tracking-[-0.02em]">
          Connect With Us
        </h1>
        <p className="max-w-2xl text-[15px] font-light text-warm-gray leading-relaxed mb-16">
          Whether you have questions about a reservation, want to recommend a new salon, or are a
          salon owner interested in joining the Bloom curation, our concierge team is at your
          service.
        </p>
      </div>

      <div className="grid gap-16 lg:grid-cols-5 border-t border-foreground/10 pt-16 luxury-text-reveal reveal-delay-1">
        {/* Left Side: Contact Information */}
        <div className="lg:col-span-2 space-y-12">
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-medium text-bronze mb-4">
              Direct Contact
            </h3>
            <div className="space-y-4 text-[14px] font-light tracking-wide text-warm-gray">
              <a
                href="mailto:concierge@bloom.in"
                className="flex items-center gap-4 hover:text-bronze transition-colors"
              >
                <Mail className="h-4 w-4 stroke-[1.25] text-foreground" />
                <span>concierge@bloom.in</span>
              </a>
              <a
                href="tel:+918040000000"
                className="flex items-center gap-4 hover:text-bronze transition-colors"
              >
                <Phone className="h-4 w-4 stroke-[1.25] text-foreground" />
                <span>+91 80 4000 0000</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-medium text-bronze mb-4">
              HQ Address
            </h3>
            <div className="flex gap-4 text-[14px] font-light tracking-wide text-warm-gray">
              <MapPin className="h-4 w-4 stroke-[1.25] text-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-foreground font-medium">Bloom Spaces</p>
                <p className="mt-2">12th Main Road, Indiranagar</p>
                <p>Bengaluru, Karnataka 560038</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-medium text-bronze mb-4">
              Hours of Response
            </h3>
            <div className="flex gap-4 text-[14px] font-light tracking-wide text-warm-gray">
              <Clock className="h-4 w-4 stroke-[1.25] text-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-foreground font-medium">Monday – Saturday</p>
                <p className="mt-2">09:00 AM – 08:00 PM IST</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Contact Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] font-medium text-warm-gray">
                  Full Name
                </span>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Sen"
                  className="w-full border border-foreground/10 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-bronze transition-colors"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] font-medium text-warm-gray">
                  Email Address
                </span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. maya@domain.com"
                  className="w-full border border-foreground/10 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-bronze transition-colors"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] font-medium text-warm-gray">
                Subject
              </span>
              <input
                required
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Reservation Inquiry"
                className="w-full border border-foreground/10 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-bronze transition-colors"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] font-medium text-warm-gray">
                Your Message
              </span>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your request here..."
                className="w-full border border-foreground/10 bg-transparent px-4 py-3 text-[14px] outline-none focus:border-bronze transition-colors resize-none"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-foreground text-background py-4 text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-bronze transition-colors duration-300 disabled:opacity-50"
            >
              {busy ? "Sending Message..." : "Submit Message"}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-20 pt-8 border-t border-foreground/10">
        <Link
          to="/"
          className="text-[10px] uppercase tracking-[0.2em] font-medium text-warm-gray hover:text-bronze transition-colors"
        >
          ← Return to Discovery
        </Link>
      </div>
    </div>
  );
}
