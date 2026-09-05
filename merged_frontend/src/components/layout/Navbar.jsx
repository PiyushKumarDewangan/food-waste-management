import React, { useState } from "react";
import { Menu, X, Leaf } from "lucide-react";
import { Link } from "react-router-dom";

// Nav links stored in an array so new items can be added easily later
const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Impact", href: "#impact" },
];

const Navbar = () => {
  // Controls whether the mobile slide-down menu is open
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2 shrink-0">
            <Leaf className="w-7 h-7 text-secondary" strokeWidth={2.5} />
            <span className="text-xl md:text-2xl font-bold text-primary">
              FoodShare
            </span>
          </a>

          {/* Desktop nav links - centered */}
          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-gray-700 font-medium hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop right side buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="text-gray-800 font-semibold hover:text-primary transition-colors"
            >
              Login
            </Link>
            <a href="#get-started"
            className="bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-2.5 rounded-full shadow-md transition-colors"
            >Get Started
            </a>
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-gray-800"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>

        {/* Mobile slide-down menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? "max-h-96 pb-6" : "max-h-0"
            }`}
        >
          <ul className="flex flex-col gap-4 pt-2">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={closeMenu}
                  className="block text-gray-700 font-medium py-1 hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 mt-4">
            <Link
              to="/login"
              className="text-gray-800 font-semibold hover:text-primary transition-colors"
            >
              Login
            </Link>
            <a href="#get-started"
            className="bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-2.5 rounded-full shadow-md transition-colors"
            >Get Started
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;