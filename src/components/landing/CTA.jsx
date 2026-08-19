import React from "react";

const ReadyToMakeADifference = () => {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 bg-[#F8FAF7]">
      <div
        className="relative overflow-hidden max-w-7xl mx-auto rounded-[2rem] sm:rounded-[2.5rem] bg-[#EAF5EA] shadow-sm px-6 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-16"
      >
        {/* Decorative leaf illustration */}
        <svg
          className="pointer-events-none select-none absolute right-0 top-0 h-full w-1/2 max-w-[420px] opacity-60"
          viewBox="0 0 420 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M60 380 C 140 300, 180 260, 220 180 C 250 120, 300 70, 380 40"
            stroke="#66BB6A"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.35"
          />
          <ellipse cx="230" cy="170" rx="34" ry="18" fill="#66BB6A" opacity="0.18" transform="rotate(-35 230 170)" />
          <ellipse cx="270" cy="130" rx="30" ry="16" fill="#2E7D32" opacity="0.14" transform="rotate(-30 270 130)" />
          <ellipse cx="190" cy="210" rx="30" ry="16" fill="#2E7D32" opacity="0.14" transform="rotate(-45 190 210)" />
          <ellipse cx="310" cy="95" rx="28" ry="15" fill="#66BB6A" opacity="0.18" transform="rotate(-25 310 95)" />
          <ellipse cx="150" cy="255" rx="28" ry="15" fill="#66BB6A" opacity="0.18" transform="rotate(-50 150 255)" />
          <ellipse cx="350" cy="60" rx="24" ry="13" fill="#2E7D32" opacity="0.12" transform="rotate(-20 350 60)" />
        </svg>

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-6">
          {/* Text content */}
          <div className="max-w-xl">
            <h2 className="font-[Poppins] text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold leading-tight text-[#1B2420]">
              Ready to Make a
              <br />
              <span className="text-[#2E7D32]">Difference?</span>
            </h2>
            <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
              Join 32,500+ community members already reducing food waste and
              feeding families. It takes less than a minute to get started.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-row gap-3 sm:gap-4 shrink-0">
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-[#2E7D32] px-7 py-4 text-base font-semibold text-white shadow-md shadow-[#2E7D32]/20 transition-colors duration-200 hover:bg-[#256628] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2E7D32]"
            >
              Get Started — It's Free
            </button>
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border-2 border-[#2E7D32] px-7 py-4 text-base font-semibold text-[#2E7D32] transition-colors duration-200 hover:bg-[#2E7D32]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2E7D32]"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReadyToMakeADifference;
