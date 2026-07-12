"use client";

import { motion } from "framer-motion";
import { ChefHat, Sparkles, Star } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const recipes = [
  { name: "Butter Chicken", rating: 5 },
  { name: "Chicken Fried Rice", rating: 5 },
  { name: "Tomato Curry", rating: 5 },
];

function StarRating({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-400">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
      ))}
    </span>
  );
}

export default function KitchenMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease }}
      className="w-full"
    >
      <div className="overflow-hidden rounded-3xl border border-white/[0.1] bg-white/[0.04] shadow-2xl shadow-emerald-500/10 backdrop-blur-2xl">
        {/* App chrome */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
              <ChefHat className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Kitchen Assistant</p>
              <p className="text-[11px] text-zinc-500">Nutriweek AI</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-medium text-emerald-400/80">Online</span>
          </div>
        </div>

        {/* Chat area */}
        <div className="space-y-4 p-5">
          {/* User message */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.55, ease }}
            className="flex justify-end"
          >
            <div className="max-w-[85%] rounded-2xl rounded-tr-md border border-white/[0.08] bg-white/[0.08] px-4 py-3 backdrop-blur-xl">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                You
              </p>
              <p className="text-sm leading-relaxed text-zinc-200">
                I have chicken, tomatoes and rice.
              </p>
            </div>
          </motion.div>

          {/* AI response */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.75, ease }}
            className="flex justify-start"
          >
            <div className="max-w-[92%] rounded-2xl rounded-tl-md border border-emerald-500/15 bg-emerald-500/[0.06] px-4 py-3.5 backdrop-blur-xl">
              <div className="mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-cyan-400" />
                <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/80">
                  AI
                </p>
              </div>
              <p className="text-sm leading-relaxed text-zinc-300">
                You can cook:
              </p>
              <ul className="mt-3 space-y-2.5">
                {recipes.map((recipe, i) => (
                  <motion.li
                    key={recipe.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.95 + i * 0.12, ease }}
                    className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 transition-colors duration-200 hover:border-emerald-500/20 hover:bg-white/[0.06]"
                  >
                    <StarRating count={recipe.rating} />
                    <span className="text-sm font-medium text-white">
                      {recipe.name}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.35, ease }}
          className="flex flex-col gap-2.5 border-t border-white/[0.06] bg-white/[0.02] p-5 sm:flex-row"
        >
          <button
            type="button"
            className="flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:brightness-110"
          >
            Cook Together
          </button>
          <button
            type="button"
            className="flex flex-1 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-zinc-200 backdrop-blur-xl transition-all duration-200 hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white"
          >
            Add Missing Ingredients
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
