import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="w-full max-w-3xl text-center mb-16">
      <div className="flex flex-col items-center gap-6">
        <span className="mb-4 flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500/30 to-purple-500/30">
          <LayoutDashboard className="w-12 h-12 text-blue-400" />
        </span>
        <h1 className="text-5xl font-extrabold leading-tight mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
          Achieve Your Goals. Boost Your Productivity.
        </h1>
        <p className="text-lg text-gray-300 mb-6">
          GoalDigger is your all-in-one platform to set, track, and accomplish your goals with powerful tools and smart automation. Start your journey to success today.
        </p>
        <Link href="/pricing">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-lg shadow-lg transition-all">
            Get Started
          </Button>
        </Link>
      </div>
    </section>
  );
} 