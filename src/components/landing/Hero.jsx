import React from "react";
import { Sprout, Gift, Search, Check } from "lucide-react";

// Feature checklist items - stored in an array for easy expansion
const FEATURES = ["Free to use", "Verified donors", "Real-time listings"];

const Hero = () => {
  return (
    <section
      id="home"
      className="bg-[#F8FAF7] px-4 sm:px-6 lg:px-8 py-12 md:py-20"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* ---------- Left column: text content ---------- */}
        <div className="flex flex-col items-start">
          {/* Impact badge */}
          <div className="inline-flex items-center gap-2 bg-[#E3F2E4] text-[#2E7D32] font-semibold text-sm px-4 py-2 rounded-full mb-6">
            <Sprout className="w-4 h-4" />
            48 tonnes of food rescued this month
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900 mb-6">
            Don't Let Good{" "}
            <span className="text-[#2E7D32]">Food Go To Waste</span>.
          </h1>

          {/* Supporting paragraph */}
          <p className="text-lg text-gray-600 max-w-xl mb-8">
            FoodShare connects donors with surplus food to people and
            communities who need it. Together, we build a world where no good
            meal is thrown away.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-8">
            <button className="flex items-center justify-center gap-2 bg-[#2E7D32] hover:bg-[#256428] text-white font-semibold px-8 py-3.5 rounded-full shadow-md transition-colors w-full sm:w-auto">
              <Gift className="w-5 h-5" />
              Donate Food
            </button>
            <button className="flex items-center justify-center gap-2 bg-transparent border-2 border-[#2E7D32] text-[#2E7D32] font-semibold px-8 py-3.5 rounded-full hover:bg-[#E3F2E4] transition-colors w-full sm:w-auto">
              <Search className="w-5 h-5" />
              Find Food
            </button>
          </div>

          {/* Feature checklist */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {FEATURES.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-1.5 text-gray-600 text-sm font-medium"
              >
                <Check className="w-4 h-4 text-[#66BB6A]" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* ---------- Right column: hero image with floating cards ---------- */}
        <div className="relative w-full mt-8 lg:mt-0">
          {/* Main hero image */}
          <div className="rounded-3xl overflow-hidden shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=900&q=80"
              alt="Fresh produce - vegetables and fruits"
              className="w-full h-80 sm:h-100 lg:h-120 object-cover"
            />
          </div>

          {/* Floating top-right members card */}
          <div className="absolute -top-4 right-4 sm:top-4 sm:right-6 bg-[#2E7D32] text-white rounded-2xl px-5 py-3 shadow-lg">
            <p className="text-xl font-bold leading-tight">32K+</p>
            <p className="text-sm text-green-100">Members</p>
          </div>

          {/* Floating bottom-left listing card */}
          <div className="absolute -bottom-6 left-4 sm:-bottom-8 sm:left-6 bg-white rounded-2xl px-5 py-4 shadow-lg flex items-center gap-3 max-w-[85%] sm:max-w-xs">
            <div className="bg-[#FFF3E0] p-2 rounded-full shrink-0">
              <Sprout className="w-6 h-6 text-[#FFB74D]" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm sm:text-base">
                Fresh produce
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                Listed 5 min ago &middot; 1.2 km
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
