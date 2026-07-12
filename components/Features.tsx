"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Bot,
  ChefHat,
  PiggyBank,
  ShoppingCart,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: "emerald" | "cyan";
};

const features: Feature[] = [
  {
    icon: Bot,
    title: "AI Meal Planner",
    description: "Generate weekly meal plans based on your goals.",
    accent: "emerald",
  },
  {
    icon: Warehouse,
    title: "Pantry Management",
    description: "Track ingredients already at home.",
    accent: "cyan",
  },
  {
    icon: ShoppingCart,
    title: "Smart Grocery Shopping",
    description: "Automatically build shopping lists.",
    accent: "emerald",
  },
  {
    icon: ChefHat,
    title: "Cook Together",
    description: "Voice-guided cooking assistant.",
    accent: "cyan",
  },
  {
    icon: BarChart3,
    title: "Nutrition Insights",
    description: "Calories, protein and macro tracking.",
    accent: "emerald",
  },
  {
    icon: PiggyBank,
    title: "Smart Savings",
    description: "Compare prices and reduce food waste.",
    accent: "cyan",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease },
  },
};

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  const isEmerald = feature.accent === "emerald";

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6, transition: { duration: 0.25, ease } }}
      className="group relative"
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/0 via-transparent to-cyan-500/0 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100 group-hover:from-emerald-500/10 group-hover:to-cyan-500/10" />

      <div className="relative flex h-full flex-col rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 backdrop-blur-2xl transition-all duration-300 group-hover:border-white/[0.14] group-hover:bg-white/[0.06] group-hover:shadow-xl group-hover:shadow-emerald-500/5 sm:p-10">
        <div
          className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-300 group-hover:scale-105 ${
            isEmerald
              ? "border-emerald-500/20 bg-emerald-500/10 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/15"
              : "border-cyan-500/20 bg-cyan-500/10 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/15"
          }`}
        >
          <Icon
            className={`h-7 w-7 ${isEmerald ? "text-emerald-400" : "text-cyan-400"}`}
            strokeWidth={1.5}
          />
        </div>

        <h3 className="text-xl font-semibold tracking-tight text-white">
          {feature.title}
        </h3>
        <p className="mt-3 text-base leading-relaxed text-zinc-400">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function Features() {
  return (
    <section
      id="features"
      className="relative px-4 py-28 sm:px-6 sm:py-32 lg:px-8 lg:py-40"
    >
      <div className="mx-auto max-w-6xl xl:max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
          className="mb-16 text-center sm:mb-20 lg:mb-24"
        >
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-400/80">
            Features
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
            Everything you need in one place
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            From planning to cooking to saving — Nutriweek handles the full
            kitchen workflow.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
