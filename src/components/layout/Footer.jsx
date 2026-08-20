import React from "react";

const footerColumns = [
  {
    title: "Company",
    links: ["About Us", "Our Mission", "Team", "Blog", "Careers"],
  },
  {
    title: "Quick Links",
    links: [
      "Donate Food",
      "Request Food",
      "NGO Registration",
      "How It Works",
      "Features",
    ],
  },
  {
    title: "Support",
    links: ["Help Center", "Contact Us", "Privacy Policy", "Terms of Use"],
  },
];

const socialIcons = [
  {
    name: "Facebook",
    path: "M13.5 9H15V6.5h-1.5C11.6 6.5 10.5 7.6 10.5 9.5V11H9v2.5h1.5V19H13v-5.5h1.6l.4-2.5h-2V9.6c0-.4.2-.6.5-.6z",
  },
  {
    name: "Twitter",
    path: "M19 6.6c-.5.2-1 .4-1.6.5.6-.3 1-.9 1.2-1.6-.5.3-1.1.6-1.8.7-.5-.6-1.3-1-2.1-1-1.6 0-2.9 1.3-2.9 2.9 0 .2 0 .4.1.6-2.4-.1-4.6-1.3-6-3.1-.3.4-.4.9-.4 1.5 0 1 .5 1.9 1.3 2.4-.5 0-.9-.1-1.3-.3v.1c0 1.4 1 2.6 2.3 2.8-.2.1-.5.1-.8.1-.2 0-.4 0-.5-.1.4 1.2 1.5 2 2.8 2.1-1 .8-2.3 1.3-3.7 1.3-.2 0-.5 0-.7-.1 1.3.9 2.9 1.3 4.6 1.3 5.5 0 8.5-4.6 8.5-8.5v-.4c.6-.4 1.1-1 1.5-1.6z",
  },
  {
    name: "Instagram",
    path: "M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM12 10a2 2 0 110 4 2 2 0 010-4zM16.5 6a1 1 0 100 2 1 1 0 000-2z",
    frame: true,
  },
  {
    name: "LinkedIn",
    path: "M6.9 8.5H4.3V19h2.6V8.5zM5.6 4.5A1.6 1.6 0 104 6.1a1.6 1.6 0 001.6-1.6zM19.7 19h-2.6v-5.3c0-1.3-.5-2.2-1.6-2.2-.9 0-1.4.6-1.6 1.2-.1.2-.1.5-.1.8V19H11c0-6.5 0-7.1 0-10.5h2.6v1.5c.3-.6 1-1.5 2.6-1.5 1.9 0 3.4 1.3 3.4 4V19z",
  },
];

const bottomSocialLinks = ["Twitter", "Instagram", "LinkedIn"];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#0F172A]">
      {/* Top accent line consistent with FoodShare green */}
      <div className="h-1 w-full bg-gradient-to-r from-[#2E7D32] via-[#66BB6A] to-[#2E7D32]" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 pt-8 pb-5 sm:pt-10 sm:pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] gap-8 sm:gap-10 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-1 lg:pr-6">
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
            <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-xs">
              Bridging the gap between food surplus and food insecurity
              through technology and compassion.
            </p>
            <div className="mt-4 flex items-center gap-3">
              {socialIcons.map((icon) => (
                <a
                  key={icon.name}
                  href="#"
                  aria-label={icon.name}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-300 hover:bg-[#2E7D32] hover:text-white transition-colors duration-200"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d={icon.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="font-[Poppins] text-sm font-semibold text-white uppercase tracking-wide">
                {column.title}
              </h3>
              <ul className="mt-3 space-y-2.5">
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
        <div className="mt-7 sm:mt-8 border-t border-white/10" />

        {/* Bottom bar */}
        <div className="mt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <p className="text-center sm:text-left">
            © {year} FoodShare. Made with{" "}
            <span className="text-[#66BB6A]">♥</span> to reduce food waste.
          </p>
          <div className="flex items-center gap-5">
            {bottomSocialLinks.map((link) => (
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
