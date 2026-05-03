import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  // navigate hook
  // state: hoveredCard, activePlan (default: "pro")

  // features → array of { icon, title, description }
  // testimonials → array of { name, role, content, avatar, rating }
  // plans → array of { name, price, credits, features, id, popular? }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950 to-gray-950 text-white overflow-hidden">

      {/* Hero Section */}
      <section className="relative px-6 py-20 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-6">
              {/* Badge label */}
              {/* Heading */}
              {/* Subtext */}
              {/* "Generate Now" button → navigate("/generate") */}
              {/* "View Creations" button → navigate("/community") */}
            </div>
            <div className="relative">
              {/* Thumbnail preview placeholder */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-6 py-20 sm:px-8 lg:px-16 bg-black/30">
        <div className="mx-auto max-w-7xl">
          {/* Section heading */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* features.map → feature card with hover state (hoveredCard) */}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative px-6 py-20 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-7xl">
          {/* Section heading */}
          <div className="grid gap-8 md:grid-cols-3">
            {/* testimonials.map → card with rating stars, quote, author avatar + name/role */}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative px-6 py-20 sm:px-8 lg:px-16 bg-black/50">
        <div className="mx-auto max-w-7xl">
          {/* Section heading */}
          <div className="grid gap-8 md:grid-cols-3 lg:gap-6">
            {/* plans.map → plan card
                  - "Most Popular" badge if plan.popular
                  - plan name, price, credits
                  - "Get Started" button
                  - features list
                  - active state via activePlan, onClick → setActivePlan */}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-6 py-20 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-4xl">
          {/* CTA card with heading, subtext */}
          {/* "Generate Your First Thumbnail" button → navigate("/generate") */}
        </div>
      </section>

    </div>
  );
}