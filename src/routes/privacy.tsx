import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Bloom" },
      { name: "description", content: "Privacy policy and data protection guidelines at Bloom." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[800px] px-6 py-20 md:py-28 reveal">
      <div className="luxury-text-reveal">
        <div className="text-[10px] uppercase tracking-[0.25em] text-bronze font-medium mb-6">
          Transparency
        </div>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl mb-8 tracking-[-0.02em]">
          Privacy Policy
        </h1>
        <p className="text-[11px] text-warm-gray uppercase tracking-[0.15em] mb-12 border-b border-foreground/10 pb-6 font-medium">
          Last updated: June 2026 · Bloom Concierge
        </p>
      </div>

      <div className="space-y-12 text-[15px] text-warm-gray font-light leading-relaxed tracking-wide luxury-text-reveal reveal-delay-1">
        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 tracking-[-0.02em]">
            1. Scope of Privacy
          </h2>
          <p className="mb-4">
            Welcome to Bloom. We respect your privacy and are committed to protecting the personal
            data you share with us. This policy details how we collect, store, utilize, and protect
            your personal information when you use our platform to book experiences at our selected
            partner salons in Bengaluru.
          </p>
          <p>
            By using the Bloom platform, you consent to the practices described in this document. We
            align our operations with high data management standards, ensuring a secure and discreet
            booking environment.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 tracking-[-0.02em]">
            2. Collection of Information
          </h2>
          <p className="mb-4">
            We collect information that is essential to provide a seamless reservation experience:
          </p>
          <ul className="list-disc list-inside pl-4 space-y-2 text-[14px]">
            <li>
              <strong className="font-medium text-foreground">Identity & Contact:</strong> Full
              name, email address, phone number, and account credentials.
            </li>
            <li>
              <strong className="font-medium text-foreground">Reservation & History:</strong>{" "}
              Selected salons, services booked, preferences, timeslots, and history of visits.
            </li>
            <li>
              <strong className="font-medium text-foreground">Payment Information:</strong> Secured
              through certified payment gateways; Bloom does not store raw credit/debit card numbers
              on its servers.
            </li>
            <li>
              <strong className="font-medium text-foreground">Technical Diagnostics:</strong> IP
              address, device specifications, browser environment, and platform analytics.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 tracking-[-0.02em]">
            3. Data Usage
          </h2>
          <p className="mb-4">
            Your data is used solely to facilitate, personalize, and elevate your discovery and
            booking experience:
          </p>
          <p className="mb-4">
            We share relevant booking details with your selected salon so they can prepare for your
            arrival and deliver tailored services. Your information is never sold to third-party
            advertisers.
          </p>
          <p>
            We may analyze aggregated, non-identifiable usage statistics to optimize our service
            layout, list more relevant venues, and introduce new digital concierge features.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 tracking-[-0.02em]">
            4. Security of Data
          </h2>
          <p className="mb-4">
            Bloom employs enterprise-grade cryptographic standards (SSL/TLS protocols) to safeguard
            data transmissions. Access to database systems is strictly controlled and audited.
          </p>
          <p>
            While we take every sensible precaution to secure your profile, no digital network can
            guarantee absolute immunity. We urge you to keep your credentials secure and log out of
            shared systems.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 tracking-[-0.02em]">
            5. Your Legal Rights
          </h2>
          <p className="mb-4">
            Under applicable digital data regulations, you have full ownership over your
            information. This includes the right to request access to your personal files, request
            corrections to erroneous details, or request total deletion of your Bloom account and
            associated booking logs.
          </p>
          <p>
            To exercise any of these rights, please communicate with our concierge desk at{" "}
            <Link
              to="/contact"
              className="text-bronze border-b border-bronze/30 hover:border-bronze pb-0.5 transition-colors"
            >
              concierge@bloom.in
            </Link>
            .
          </p>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t border-foreground/10 flex justify-between items-center luxury-text-reveal reveal-delay-2">
        <Link
          to="/"
          className="text-[10px] uppercase tracking-[0.2em] font-medium text-warm-gray hover:text-bronze transition-colors"
        >
          ← Return to Discovery
        </Link>
        <Link
          to="/terms"
          className="text-[10px] uppercase tracking-[0.2em] font-medium text-warm-gray hover:text-bronze transition-colors"
        >
          Terms of Service →
        </Link>
      </div>
    </div>
  );
}
