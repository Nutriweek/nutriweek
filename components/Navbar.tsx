"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "AI", comingSoon: true },
  { label: "Pricing", comingSoon: true },
  { label: "Contact", comingSoon: true },
];

export default function Navbar() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8"
    >
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 backdrop-blur-2xl sm:h-16 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-white sm:text-xl"
        >
          Nutri<span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">week</span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.label}>
              {link.href ? (
                <a
                  href={link.href}
                  className="text-sm font-medium text-zinc-400 transition-colors duration-200 hover:text-white"
                >
                  {link.label}
                </a>
              ) : (
                <span className="text-sm font-medium text-zinc-400">
                  {link.label} (Coming Soon)
                </span>
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-zinc-300 transition-colors duration-200 hover:text-white sm:inline-flex"
          >
            Login
          </a>
          <a
            href="/signup"
            className="rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:shadow-emerald-500/40 hover:brightness-110 sm:px-5 sm:py-2.5"
          >
            Get Started
          </a>
        </div>
      </nav>
    </motion.header>
  );
}
