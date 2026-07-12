"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pb-24 pt-32 sm:px-6 lg:px-8">
      <div className="gradient-bg" aria-hidden="true" />
      <div className="gradient-orb gradient-orb--green" aria-hidden="true" />
      <div className="gradient-orb gradient-orb--cyan" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 backdrop-blur-xl"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-xs font-medium tracking-wide text-zinc-400 sm:text-sm">
            Powered by AI
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease }}
          className="max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Your AI{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
            Kitchen Companion
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease }}
          className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:mt-8 sm:text-lg md:text-xl"
        >
          Plan meals, shop smarter, cook confidently and eat healthier with
          Nutriweek.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease }}
          className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:mt-12 sm:flex-row sm:gap-4"
        >
          <a
            href="#get-started"
            className="flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 text-sm font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all duration-200 hover:shadow-emerald-500/40 hover:brightness-110 sm:w-auto sm:px-10 sm:text-base"
          >
            Get Started
          </a>
          <a
            href="#demo"
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-8 text-sm font-semibold text-white backdrop-blur-xl transition-all duration-200 hover:border-white/[0.2] hover:bg-white/[0.08] sm:w-auto sm:px-10 sm:text-base"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] transition-colors duration-200 group-hover:bg-white/[0.14]">
              <Play className="h-3 w-3 fill-white text-white" />
            </span>
            Watch Demo
          </a>
        </motion.div>
      </div>
    </section>
  );
}
