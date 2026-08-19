import React from "react";

const footerColumns = [
  {
    title: "Company",
    links: ["About Us", "Our Mission", "Blog", "Careers"],
  },
  {
    title: "Platform",
    links: [
      "How It Works",
      "Browse Listings",
      "Donate Food",
      "Volunteer",
      "Features",
    ],
  },
  {
    title: "Support",
    links: ["Help Center", "Contact Us", "Privacy Policy", "Terms of Use"],
  },
];

const socialLinks = ["Twitter", "Instagram", "LinkedIn"];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#0F172A]">
      {/* Top accent line consistent with FoodShare green */}
      <div className="h-1 w-full bg-gradient-to-r from-[#2E7D32] via-[#66BB6A] to-[#2E7D32]" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 pt-10 pb-6 sm:pt-12 sm:pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2E7D32] text-white">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M11 20A7 7 0 0 1 4 13c0-4 3-9 8-11 5 2 8 7 8 11a7 7 0 0 1-7 7c-1 0-2-.5-2-2z" />
                </svg>
              </span>
              <span className="font-[Poppins] text-lg font-bold text-white">
                Food<span className="text-[#66BB6A]">Share</span>
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-xs">
              Connecting surplus food with communities who need it most.
            </p>
          </div>

          {/* Link columns */}
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="font-[Poppins] text-sm font-semibold text-white uppercase tracking-wide">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-slate-400 hover:text-[#66BB6A] transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mt-10 sm:mt-12 border-t border-white/10" />

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p className="text-center sm:text-left">
            © {year} FoodShare. Made with{" "}
            <span className="text-[#66BB6A]">♥</span> to reduce food waste.
          </p>
          <div className="flex items-center gap-5">
            {socialLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="hover:text-[#66BB6A] transition-colors duration-200"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
