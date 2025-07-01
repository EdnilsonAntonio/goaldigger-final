import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTABannerSection() {
  return (
    <section className="w-full max-w-4xl mx-auto mb-16">
      <div className="bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 rounded-2xl p-10 flex flex-col items-center justify-center shadow-xl border border-neutral-800 text-center">
        <h2 className="text-3xl font-bold mb-4 text-white">Ready to achieve more?</h2>
        <p className="text-lg text-white mb-6">Join thousands of users who are reaching their goals with GoalDigger.</p>
        <Link href="/register">
          <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-100 px-8 py-4 text-lg rounded-lg shadow-lg transition-all font-bold flex items-center gap-2">
            Get Started Now <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </section>
  );
} 