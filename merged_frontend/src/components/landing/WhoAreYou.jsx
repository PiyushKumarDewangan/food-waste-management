import React from "react";

const roles = [
  {
    emoji: "🎁",
    title: "Donor",
    description:
      "Restaurants, grocers, households — share surplus food before it goes to waste and make a tangible impact in your neighborhood.",
    cta: "Start Donating",
    bgColor: "bg-[#DCF0DE]",
    ctaColor: "text-[#2E7D32]",
  },
  {
    emoji: "🍽️",
    title: "Receiver",
    description:
      "Individuals, shelters, food banks — discover free, fresh food donations listed near you and claim what your community needs.",
    cta: "Find Food",
    bgColor: "bg-[#FDF0CE]",
    ctaColor: "text-[#E68A2E]",
  },
  {
    emoji: "🚲",
    title: "Volunteer",
    description:
      "Help bridge the gap by picking up food from donors and delivering it to recipients who cannot travel to collect it themselves.",
    cta: "Volunteer Now",
    bgColor: "bg-[#EDE3F5]",
    ctaColor: "text-[#8E5CC7]",
  },
];

const WhoAreYou = () => {
  return (
    <section className="bg-[#F8FAF7] py-16 sm:py-20 md:py-24 px-6 sm:px-10 lg:px-16">
      <div className="max-w-6xl mx-auto text-center">
        {/* Eyebrow */}
        <p className="text-sm font-semibold tracking-widest text-[#66BB6A] uppercase mb-3">
          Join As
        </p>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0F172A] mb-4">
          Who Are You?
        </h2>

        {/* Supporting text */}
        <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto mb-12 sm:mb-16">
          Whether you have food to give, food to find, or time to help —
          there&apos;s a place for you in FoodShare.
        </p>

        {/* Role cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
          {roles.map((role) => (
            <div
              key={role.title}
              className={`${role.bgColor} rounded-3xl p-8 flex flex-col h-full`}
            >
              <div className="text-4xl mb-6">
                <span role="img" aria-label={role.title}>
                  {role.emoji}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A] mb-3">
                {role.title}
              </h3>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6 grow">
                {role.description}
              </p>

              <a
                href="#"
                className={`inline-flex items-center gap-2 font-semibold ${role.ctaColor} hover:gap-3 transition-all duration-200`}
              >
                {role.cta}
                <span aria-hidden="true">→</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhoAreYou;
