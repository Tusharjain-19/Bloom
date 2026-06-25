import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | Bloom" },
      { name: "description", content: "Terms of service and booking policies at Bloom." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-[800px] px-6 py-20 md:py-28 reveal">
      <div className="luxury-text-reveal">
        <div className="text-[10px] uppercase tracking-[0.25em] text-bronze font-medium mb-6">
          Agreement
        </div>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl mb-8 tracking-[-0.02em]">
          Terms of Service
        </h1>
        <p className="text-[11px] text-warm-gray uppercase tracking-[0.15em] mb-12 border-b border-foreground/10 pb-6 font-medium">
          Last updated: June 2026 · Bloom Agreements
        </p>
      </div>

      <div className="space-y-12 text-[15px] text-warm-gray font-light leading-relaxed tracking-wide luxury-text-reveal reveal-delay-1">
        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 tracking-[-0.02em]">
            1. Acceptance of Terms
          </h2>
          <p className="mb-4">
            By accessing or using the Bloom platform, you agree to be bound by these Terms of
            Service. Bloom is an exclusive curation and booking service that connects clients with
            premier salons in Bengaluru.
          </p>
          <p>
            We reserves the right to modify these terms at any time. Your continued use of the
            platform following updates constitutes acceptance of the modified agreement.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 tracking-[-0.02em]">
            2. Reservations & Payments
          </h2>
          <p className="mb-4">
            Bloom enables real-time booking for luxury beauty and wellness treatments.
          </p>
          <p className="mb-4">
            To hold a reservation, a valid credit or debit card is required at the time of booking.
            Bloom acts as an intermediary, facilitating slot confirmation and securing transactions.
          </p>
          <p>
            Any prices quoted on our platform are set directly by partner salons. Service details
            and fees are subject to local taxes and optional concierge additions.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 tracking-[-0.02em]">
            3. Cancellation & No-Show Policy
          </h2>
          <p className="mb-4">
            Because our partners prepare dedicated staffing and resources for each luxury
            reservation, strict cancellation windows apply:
          </p>
          <ul className="list-disc list-inside pl-4 space-y-2 text-[14px]">
            <li>
              <strong className="font-medium text-foreground">Cancellations:</strong> Allowed up to
              24 hours prior to the scheduled appointment slot with no charge.
            </li>
            <li>
              <strong className="font-medium text-foreground">Late Cancellations:</strong>{" "}
              Cancellations within 24 hours of the appointment may incur a fee of up to 50% of the
              total booked service value.
            </li>
            <li>
              <strong className="font-medium text-foreground">No-Shows:</strong> Failure to arrive
              without notice will result in the card on file being charged 100% of the service cost.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 tracking-[-0.02em]">
            4. Partner Salon Responsibility
          </h2>
          <p className="mb-4">
            While Bloom performs comprehensive quality checks on all listed venues, the actual
            treatments, facilities, and staff are the sole responsibility of the respective salons.
          </p>
          <p>
            Bloom is not liable for any injuries, skin reactions, service quality deviations, or
            customer service disputes arising during your treatment at the partner salon's premises.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4 tracking-[-0.02em]">
            5. Conduct & Use
          </h2>
          <p className="mb-4">
            Clients are expected to maintain courteous behavior towards salon staff and follow
            venue-specific house rules. Bloom reserves the right to suspend accounts of users who
            exhibit disrespectful behavior, repeatedly fail to attend scheduled appointments, or
            abuse promotional campaigns.
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
          to="/privacy"
          className="text-[10px] uppercase tracking-[0.2em] font-medium text-warm-gray hover:text-bronze transition-colors"
        >
          Privacy Policy →
        </Link>
      </div>
    </div>
  );
}
