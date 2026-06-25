import { useState, useEffect } from "react";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  ExternalLink,
  CreditCard,
  Shield,
  Landmark,
  User,
  Laptop,
} from "lucide-react";

export function HackathonTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Check if the user has already seen the tour
    const hasSeenTour = localStorage.getItem("hackathonTourSeen");
    if (!hasSeenTour) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("hackathonTourSeen", "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity duration-300">
      <div className="relative w-full max-w-2xl bg-[#fafaf8] border border-[#8b7355]/20 text-[#1a1a1a] shadow-lift p-8 md:p-10 flex flex-col justify-between overflow-hidden rounded-none max-h-[90vh]">
        {/* Decorative Luxury Lines */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#8b7355] to-transparent" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-1 text-warm-gray hover:text-[#1a1a1a] transition-colors cursor-pointer"
          aria-label="Skip Guided Tour"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Step Indicator Top Bar */}
        <div className="flex items-center gap-1.5 mb-8">
          <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-bronze">
            Step {step} of 3
          </span>
          <div className="flex gap-1 ml-auto">
            <div
              className={`h-1 w-8 transition-colors duration-300 ${step >= 1 ? "bg-bronze" : "bg-foreground/10"}`}
            />
            <div
              className={`h-1 w-8 transition-colors duration-300 ${step >= 2 ? "bg-bronze" : "bg-foreground/10"}`}
            />
            <div
              className={`h-1 w-8 transition-colors duration-300 ${step >= 3 ? "bg-bronze" : "bg-foreground/10"}`}
            />
          </div>
        </div>

        {/* Step Contents */}
        <div className="flex-1 overflow-y-auto pr-2 mb-8">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-bronze/10 text-bronze text-[10px] font-bold uppercase tracking-widest rounded-full">
                <Sparkles className="h-3 w-3" />
                Hackathon Submission
              </div>

              <h2 className="font-display text-3xl md:text-4xl text-[#1a1a1a] tracking-tight leading-tight">
                Welcome to Bloom
              </h2>

              <p className="text-[14px] leading-relaxed text-warm-gray font-light">
                Hello and welcome! My name is{" "}
                <strong className="font-medium text-[#1a1a1a]">Tushar Jain</strong>. I built Bloom
                as an ultra-luxury, high-end salon discovery and booking ecosystem designed
                specifically for modern aesthetics and seamless operations.
              </p>

              <div className="p-5 border border-foreground/5 bg-white space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-bronze/5 rounded-full text-bronze">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-widest font-semibold text-warm-gray">
                      Developer & Creator
                    </h4>
                    <p className="text-sm font-medium text-[#1a1a1a]">Tushar Jain</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-bronze/5 rounded-full text-bronze">
                    <Laptop className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-widest font-semibold text-warm-gray">
                      Portfolio Website
                    </h4>
                    <a
                      href="https://tusharjain.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-bronze hover:underline inline-flex items-center gap-1.5 font-medium group"
                    >
                      tusharjain.in
                      <ExternalLink className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </a>
                  </div>
                </div>
              </div>

              <p className="text-[13px] text-warm-gray font-light italic">
                Please take a quick 2-step tour to see the advanced functionalities of this
                platform, including live booking, dashboard management, and test checkout.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-3xl text-[#1a1a1a] tracking-tight">
                An Integrated Ecosystem
              </h2>

              <p className="text-[14px] leading-relaxed text-warm-gray font-light">
                Bloom is not just a homepage. It consists of multiple fully-working portals working
                together in real time:
              </p>

              <div className="grid gap-3.5 sm:grid-cols-2 text-left">
                <div className="p-4 border border-foreground/5 bg-white">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-bronze mb-1.5">
                    1. Luxury Discovery & Booking
                  </h3>
                  <p className="text-xs text-warm-gray leading-relaxed font-light">
                    Clients browse verified high-end salons, choose services, and check out with
                    Razorpay or chat with our AI Concierge.
                  </p>
                </div>

                <div className="p-4 border border-foreground/5 bg-white">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-bronze mb-1.5">
                    2. Salon Owner Admin
                  </h3>
                  <p className="text-xs text-warm-gray leading-relaxed font-light">
                    Manage service menus, holidays, bookings, payments, and view detailed analytical
                    revenue charts.
                  </p>
                </div>

                <div className="p-4 border border-foreground/5 bg-white">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-[#1a1a1a] mb-1.5">
                    3. Point of Sale (POS)
                  </h3>
                  <p className="text-xs text-warm-gray leading-relaxed font-light">
                    An in-salon register interface to check out walk-in customers and print premium,
                    customized thermal bills.
                  </p>
                </div>

                <div className="p-4 border border-foreground/5 bg-white">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-[#1a1a1a] mb-1.5">
                    4. HQ Super Admin
                  </h3>
                  <p className="text-xs text-warm-gray leading-relaxed font-light">
                    Moderate registered salons, review ownership claim requests, and adjust global
                    settings.
                  </p>
                </div>
              </div>

              <div className="p-4.5 border border-amber-200/50 bg-amber-50/50 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
                  <Shield className="h-4 w-4" />
                  Integration Notes
                </div>
                <ul className="text-xs text-amber-900/80 leading-relaxed font-light list-disc pl-4 space-y-1">
                  <li>
                    <strong className="font-semibold text-amber-900">Razorpay Integration</strong>:
                    Active in Test Mode for bookings and POS bills.
                  </li>
                  <li>
                    <strong className="font-semibold text-amber-900">Google Authentication</strong>:
                    Not available yet in this environment. Use email sign-in or book directly as a
                    guest client.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-3xl text-[#1a1a1a] tracking-tight">
                How to Test Razorpay & Checkout
              </h2>

              <p className="text-[14px] leading-relaxed text-warm-gray font-light">
                To test the online payment system and the Point of Sale (POS) terminal, please
                follow these steps:
              </p>

              <div className="space-y-3.5">
                <div className="flex gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center bg-bronze/10 text-bronze text-[10px] font-bold">
                    1
                  </div>
                  <p className="text-xs text-warm-gray leading-relaxed font-light">
                    Go to <strong className="font-medium text-[#1a1a1a]">Salon Admin</strong>{" "}
                    (accessible in the header after signing in, or use POS mode). Or, book a service
                    as a guest from the directory.
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center bg-bronze/10 text-bronze text-[10px] font-bold">
                    2
                  </div>
                  <p className="text-xs text-warm-gray leading-relaxed font-light">
                    In the Salon Admin dashboard, go to the{" "}
                    <strong className="font-medium text-[#1a1a1a]">POS Tab</strong>, add any
                    services to the checkout cart, select Razorpay as the payment method, and click
                    print/bill.
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center bg-bronze/10 text-bronze text-[10px] font-bold">
                    3
                  </div>
                  <p className="text-xs text-warm-gray leading-relaxed font-light">
                    When the Razorpay secure overlay opens, choose{" "}
                    <strong className="font-medium text-[#1a1a1a]">Card</strong> and enter the test
                    details below:
                  </p>
                </div>
              </div>

              {/* Card Details Box */}
              <div className="p-5 border border-bronze/20 bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-bronze/5 rounded-full translate-x-8 -translate-y-8" />
                <div className="flex items-center justify-between border-b border-foreground/5 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4.5 w-4.5 text-bronze" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-bronze">
                      Razorpay Test Card
                    </span>
                  </div>
                  <span className="text-[9px] uppercase tracking-widest text-light-gray font-medium">
                    Test Mode
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[9px] uppercase tracking-wider text-light-gray block mb-1">
                      Card Number
                    </label>
                    <code className="text-sm font-semibold tracking-wider text-[#1a1a1a] block select-all">
                      4100 2800 0000 1007
                    </code>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-wider text-light-gray block mb-1">
                      Expiry Date
                    </label>
                    <p className="text-xs font-semibold text-[#1a1a1a]">
                      Any future date (e.g. 12/29)
                    </p>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-wider text-light-gray block mb-1">
                      CVV / OTP
                    </label>
                    <p className="text-xs font-semibold text-[#1a1a1a]">Any 3 digits (e.g. 123)</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-warm-gray leading-relaxed font-light">
                Once the payment succeeds, the system automatically redirects, updates your booking
                status to{" "}
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 font-medium border border-emerald-100">
                  Paid
                </span>
                , updates the revenue charts, and prints a formatted thermal receipt.
              </p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between border-t border-foreground/5 pt-6">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className={`flex items-center gap-2 text-xs uppercase tracking-widest font-bold py-3 transition-colors ${
              step === 1
                ? "text-light-gray cursor-not-allowed opacity-40"
                : "text-warm-gray hover:text-[#1a1a1a] cursor-pointer"
            }`}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <div className="flex gap-4">
            <button
              onClick={handleClose}
              className="text-xs uppercase tracking-widest font-bold text-warm-gray hover:text-red-700 px-4 py-3 transition-colors cursor-pointer"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="bg-[#1a1a1a] hover:bg-bronze text-white text-xs uppercase tracking-widest font-bold px-6 py-3.5 flex items-center gap-2 transition-all duration-300 rounded-none cursor-pointer"
            >
              {step === 3 ? "Let's Explore" : "Next"}
              {step < 3 && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
