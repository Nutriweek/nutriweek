import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050505] font-sans">
      <Navbar />
      <Hero />
    </div>
  );
}
