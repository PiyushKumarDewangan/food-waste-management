import React from "react";
import { Briefcase, Monitor, CheckCircle2, ShoppingCart, ArrowRight } from "lucide-react";
import "./HowItWorks.css";

const STEPS = [
  {
    step: "STEP 01",
    number: "01",
    icon: Briefcase,
    title: "Donate Food",
    description:
      "Add surplus food details — quantity, type, and pickup time — in just seconds from your dashboard.",
  },
  {
    step: "STEP 02",
    number: "02",
    icon: Monitor,
    title: "NGO Requests",
    description:
      "Verified NGOs browse available food listings and submit requests that match their current needs.",
  },
  {
    step: "STEP 03",
    number: "03",
    icon: CheckCircle2,
    title: "Approval",
    description:
      "Donors review requests and approve with one click. Automatic notifications keep everyone in sync.",
  },
  {
    step: "STEP 04",
    number: "04",
    icon: ShoppingCart,
    title: "Food Delivered",
    description:
      "Coordinated pickup ensures food reaches people in need — fresh, on time, and with zero waste.",
  },
];

const HowItWorks = () => {
  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="h-px w-8 bg-[#66BB6A]" />
          <span className="text-xs sm:text-sm font-semibold tracking-widest text-[#2E7D32] uppercase">
            Process
          </span>
          <span className="h-px w-8 bg-[#66BB6A]" />
        </div>

        {/* Heading */}
        <h2 className="text-center font-poppins font-extrabold text-3xl sm:text-4xl lg:text-5xl text-gray-900 mb-4">
          How It Works
        </h2>

        {/* Subtitle */}
        <p className="text-center text-sm sm:text-base text-gray-600 max-w-2xl mx-auto mb-12 lg:mb-14">
          Four simple steps from surplus to impact — designed to be fast,
          transparent, and reliable.
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 items-stretch">
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === STEPS.length - 1;
            return (
              <div key={index} className="relative h-full">
                <div className="relative h-full flex flex-col bg-[#F8FAF7] border border-gray-100 rounded-2xl shadow-sm p-6 overflow-hidden">
                  {/* Faint background number */}
                  <span className="absolute top-3 right-4 font-poppins font-extrabold text-4xl sm:text-5xl text-[#66BB6A]/10 leading-none select-none">
                    {item.number}
                  </span>

                  <span className="relative text-[11px] font-poppins font-semibold tracking-widest text-[#2E7D32] uppercase mb-4">
                    {item.step}
                  </span>

                  <div className="relative w-11 h-11 rounded-xl bg-[#66BB6A]/15 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#2E7D32]" />
                  </div>

                  <h3 className="relative font-poppins font-bold text-lg text-gray-900 mb-2">
                    {item.title}
                  </h3>

                  <p className="relative text-sm text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Connector arrow (desktop only) */}
                {!isLast && (
                  <div className="hidden lg:flex absolute top-1/2 -right-2 -translate-y-1/2 translate-x-1/2 z-10 w-7 h-7 rounded-full bg-white border border-[#66BB6A]/40 items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5 text-[#2E7D32]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
