import { PlayCircle, Zap, CheckCircle2 } from "lucide-react";

export default function HowItWorksSection() {
  return (
    <section className="w-full max-w-4xl mx-auto mb-16">
      <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
      <div className="relative flex flex-col gap-16 items-center">
        {/* Vertical accent line */}
        <div className="absolute left-1/2 top-8 bottom-8 w-1 bg-gradient-to-b from-blue-700 via-purple-700 to-pink-700 rounded-full -translate-x-1/2 z-0" />
        {/* Step 1 */}
        <div className="relative z-10 flex w-full justify-start">
          <div className="flex items-center gap-6 bg-neutral-900 rounded-xl p-6 border border-neutral-800 shadow-lg md:max-w-md ml-0 md:ml-0">
            <span className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-900/30 border-2 border-blue-500">
              <PlayCircle className="w-8 h-8 text-blue-400" />
            </span>
            <div>
              <h4 className="font-semibold text-lg mb-2">Create Your Account</h4>
              <p className="text-gray-400">Sign up and choose your plan to unlock all features and start achieving your goals.</p>
            </div>
          </div>
          {/* Connector dot */}
          <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-700 border-4 border-white rounded-full z-10" />
        </div>
        {/* Step 2 */}
        <div className="relative z-10 flex w-full justify-end">
          <div className="flex items-center gap-6 bg-neutral-900 rounded-xl p-6 border border-neutral-800 shadow-lg md:max-w-md mr-0 md:mr-0">
            <span className="flex items-center justify-center w-16 h-16 rounded-full bg-green-900/30 border-2 border-green-500">
              <Zap className="w-8 h-8 text-green-400" />
            </span>
            <div>
              <h4 className="font-semibold text-lg mb-2">Set Goals & Tasks</h4>
              <p className="text-gray-400">Add your goals, break them into tasks, and organize your workflow.</p>
            </div>
          </div>
          {/* Connector dot */}
          <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-green-700 border-4 border-white rounded-full z-10" />
        </div>
        {/* Step 3 */}
        <div className="relative z-10 flex w-full justify-start">
          <div className="flex items-center gap-6 bg-neutral-900 rounded-xl p-6 border border-neutral-800 shadow-lg md:max-w-md ml-0 md:ml-0">
            <span className="flex items-center justify-center w-16 h-16 rounded-full bg-purple-900/30 border-2 border-purple-500">
              <CheckCircle2 className="w-8 h-8 text-purple-400" />
            </span>
            <div>
              <h4 className="font-semibold text-lg mb-2">Achieve More</h4>
              <p className="text-gray-400">Track your progress, stay motivated, and celebrate your wins!</p>
            </div>
          </div>
          {/* Connector dot */}
          <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-purple-700 border-4 border-white rounded-full z-10" />
        </div>
      </div>
    </section>
  );
} 