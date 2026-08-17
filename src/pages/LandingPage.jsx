import React from "react";
import Navbar from "../components/layout/Navbar";
import Hero from "../components/landing/Hero";
import ProblemSolution from "../components/landing/ProblemSolution";
import HowItWorks from "../components/landing/HowItWorks";

const LandingPage = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <ProblemSolution/>
      <HowItWorks/>
    </>
  );
};

export default LandingPage;
