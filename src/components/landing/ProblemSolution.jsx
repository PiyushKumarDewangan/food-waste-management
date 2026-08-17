import React from "react";
import {
  AlertTriangle,
  Users,
  Package,
  CheckCircle2,
  Briefcase,
  Zap,
  Home,
  Heart,
} from "lucide-react";
import "./ProblemSolution.css";

const PROBLEM_STATS = [
  {
    icon: AlertTriangle,
    title: "1.3B tonnes",
    subtitle: "Food wasted globally per year",
  },
  {
    icon: Users,
    title: "828M people",
    subtitle: "Go to bed hungry nightly",
  },
  {
    icon: Package,
    title: "$1 trillion",
    subtitle: "Annual economic loss from waste",
  },
];

const SOLUTION_STEPS = [
  {
    icon: Briefcase,
    title: "Food Donor",
    subtitle: "Lists surplus food",
  },
  {
    icon: Zap,
    title: "FoodShare Platform",
    subtitle: "Smart matching & notifications",
  },
  {
    icon: Home,
    title: "NGO / Shelter",
    subtitle: "Browses & requests food",
  },
  {
    icon: Heart,
    title: "People In Need",
    subtitle: "Receive fresh meals",
  },
];

const ProblemSolution = () => {
  return (
    <section className="bg-[#F8FAF7] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="h-px w-8 bg-[#66BB6A]" />
          <span className="text-xs sm:text-sm font-semibold tracking-widest text-[#2E7D32] uppercase">
            Why FoodShare?
          </span>
          <span className="h-px w-8 bg-[#66BB6A]" />
        </div>

        {/* Heading */}
        <h2 className="text-center font-poppins font-extrabold text-3xl sm:text-4xl lg:text-5xl text-gray-900 mb-10 lg:mb-12">
          The Problem &amp; Our Solution
        </h2>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* Problem Card */}
          <div className="h-full flex flex-col bg-[#FFB74D]/10 border border-[#FFB74D]/30 rounded-2xl shadow-sm p-6 sm:p-7">
            <div className="w-12 h-12 rounded-xl bg-[#FFB74D]/20 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-[#E68A00]" />
            </div>

            <h3 className="font-poppins font-bold text-xl sm:text-2xl text-gray-900 mb-2">
              The Problem
            </h3>

            <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-5">
              Every day, enormous quantities of edible food are thrown away
              while millions go hungry. The gap between surplus and need is a
              solvable coordination problem.
            </p>

            <div className="flex-1 flex flex-col justify-between gap-3">
              {PROBLEM_STATS.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-[#FFB74D]/15 rounded-xl px-4 py-3"
                  >
                    <div className="w-9 h-9 shrink-0 rounded-lg bg-[#FFB74D]/25 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#E68A00]" />
                    </div>
                    <div>
                      <p className="font-poppins font-bold text-sm sm:text-base text-[#E68A00] leading-tight">
                        {stat.title}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {stat.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Solution Card */}
          <div className="h-full flex flex-col bg-[#66BB6A]/10 border border-[#66BB6A]/30 rounded-2xl shadow-sm p-6 sm:p-7">
            <div className="w-12 h-12 rounded-xl bg-[#66BB6A]/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-[#2E7D32]" />
            </div>

            <h3 className="font-poppins font-bold text-xl sm:text-2xl text-gray-900 mb-2">
              Our Solution
            </h3>

            <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-5">
              FoodShare bridges the gap with real-time matching, verified
              networks, and seamless coordination between food sources and
              recipients.
            </p>

            <div className="flex-1 flex flex-col justify-between gap-3 relative">
              {SOLUTION_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isLast = index === SOLUTION_STEPS.length - 1;
                return (
                  <div key={index} className="relative">
                    {!isLast && (
                      <span className="absolute left-3.75 top-9 bottom-3 w-px bg-[#66BB6A]/40 z-0" />
                    )}
                    <div className="relative z-10 flex items-center gap-3 bg-[#66BB6A]/15 rounded-xl px-4 py-3">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-[#2E7D32] text-white flex items-center justify-center font-poppins font-bold text-xs">
                        {index + 1}
                      </div>
                      <div className="w-9 h-9 shrink-0 rounded-lg bg-[#66BB6A]/25 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-[#2E7D32]" />
                      </div>
                      <div>
                        <p className="font-poppins font-bold text-sm sm:text-base text-gray-900 leading-tight">
                          {step.title}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {step.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
