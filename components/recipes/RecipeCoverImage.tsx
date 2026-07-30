import { ChefHat } from "lucide-react";

type RecipeCoverImageProps = {
  imagePath: string | null;
  recipeName: string;
  className?: string;
};

/**
 * Uses the stored recipe cover when one is available and provides a consistent
 * visual fallback while the curated image library is being built.
 */
export default function RecipeCoverImage({ imagePath, recipeName, className = "" }: RecipeCoverImageProps) {
  if (imagePath) {
    return <div className={`bg-cover bg-center ${className}`} style={{ backgroundImage: `url("${imagePath}")` }} role="img" aria-label={`Photo of ${recipeName}`} />;
  }

  return <div className={`flex flex-col items-center justify-center bg-[radial-gradient(circle_at_18%_18%,rgba(52,211,153,0.28),transparent_35%),radial-gradient(circle_at_82%_76%,rgba(34,211,238,0.16),transparent_38%),linear-gradient(135deg,rgba(6,78,59,0.9),rgba(9,9,11,0.98))] ${className}`} role="img" aria-label={`Placeholder image for ${recipeName}`}>
    <span className="rounded-2xl border border-emerald-200/20 bg-emerald-300/10 p-3 text-emerald-100 shadow-lg shadow-emerald-950/30"><ChefHat className="h-7 w-7" aria-hidden="true" /></span>
    <span className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-emerald-100/70">Nutriweek kitchen</span>
  </div>;
}
