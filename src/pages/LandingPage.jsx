import React from "react";
import Navbar from "../components/layout/Navbar";
import Hero from "../components/landing/Hero";
import ProblemSolution from "../components/landing/ProblemSolution";
import HowItWorks from "../components/landing/HowItWorks";
import WhoAreYou from "../components/landing/WhoAreYou";
import Features from "../components/landing/Features";

const LandingPage = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <ProblemSolution/>
      <HowItWorks/>
      <WhoAreYou />
      <Features />
    </>
  );
};

export default LandingPage;
