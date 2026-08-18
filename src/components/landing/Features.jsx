import React from "react";

const features = [
  {
    emoji: "🔒",
    title: "Secure Authentication",
    description:
      "Role-based access with JWT tokens, 2FA support, and encrypted user data for complete privacy.",
    iconBg: "bg-[#D7EEDB]",
    accent: "text-[#2E7D32]",
  },
  {
    emoji: "📦",
    title: "Food Donation Management",
    description:
      "Intuitive dashboard to list, track, and manage food donations with expiry alerts and categories.",
    iconBg: "bg-[#FFE7C2]",
    accent: "text-[#E68A2E]",
  },
  {
    emoji: "🚚",
    title: "NGO Request Tracking",
    description:
      "Real-time request pipeline from submission to approval to delivery with status updates.",
    iconBg: "bg-[#D7EEDB]",
    accent: "text-[#2E7D32]",
  },
  {
    emoji: "🔔",
    title: "Real-Time Notifications",
    description:
      "Instant push and email alerts for new listings, request approvals, and pickup reminders.",
    iconBg: "bg-[#FFE7C2]",
    accent: "text-[#E68A2E]",
  },
  {
    emoji: "📊",
    title: "Analytics Dashboard",
    description:
      "Visual insights into donation trends, meals saved, most active donors, and community impact.",
    iconBg: "bg-[#D7EEDB]",
    accent: "text-[#2E7D32]",
  },
  {
    emoji: "⚙️",
    title: "Admin Control Panel",
    description:
      "Full platform oversight — manage users, verify NGOs, moderate listings, and generate reports.",
    iconBg: "bg-[#FFE7C2]",
    accent: "text-[#E68A2E]",
  },
];

const Features = () => {
  return (
    <section className="bg-[#F8FAF7] py-16 sm:py-20 md:py-24 px-6 sm:px-10 lg:px-16">
      <div className="max-w-6xl mx-auto text-center">
        {/* Eyebrow */}
        <p className="text-sm font-semibold tracking-widest text-[#66BB6A] uppercase mb-3">
          Capabilities
        </p>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1B2A20] mb-4">
          Everything You Need
        </h2>

        {/* Supporting text */}
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-12 sm:mb-16">
          A complete suite of tools built to make food donation seamless,
          transparent, and impactful.
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 text-left">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full"
            >
              <div
                className={`${feature.iconBg} w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6`}
              >
                <span role="img" aria-label={feature.title}>
                  {feature.emoji}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-[#1B2A20] mb-3">
                {feature.title}
              </h3>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6 flex-grow">
                {feature.description}
              </p>

              <a
                href="#"
                className={`inline-flex items-center gap-2 text-sm font-semibold ${feature.accent} hover:gap-3 transition-all duration-200`}
              >
                Learn more
                <span aria-hidden="true">→</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
