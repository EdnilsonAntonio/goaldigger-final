import { LayoutDashboard, ListTodo, Timer, Target, Banknote, MailCheck } from "lucide-react";

export default function FeaturesSection() {
  return (
    <section className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
      {/* Dashboard */}
      <div className="bg-neutral-900 rounded-2xl p-7 flex flex-col items-center shadow-xl border border-neutral-800 hover:border-blue-500 transition-all group">
        <span className="mb-4 flex items-center justify-center w-12 h-12 rounded-full border border-blue-500 group-hover:scale-110 transition-transform bg-neutral-950">
          <LayoutDashboard className="w-7 h-7 text-blue-400" />
        </span>
        <h3 className="font-bold text-xl mb-2">Dashboard</h3>
        <p className="text-gray-300 text-center">Get a bird's-eye view of your progress and stats in one place.</p>
      </div>
      {/* Tasks */}
      <div className="bg-neutral-900 rounded-2xl p-7 flex flex-col items-center shadow-xl border border-neutral-800 hover:border-green-500 transition-all group">
        <span className="mb-4 flex items-center justify-center w-12 h-12 rounded-full border border-green-500 group-hover:scale-110 transition-transform bg-neutral-950">
          <ListTodo className="w-7 h-7 text-green-400" />
        </span>
        <h3 className="font-bold text-xl mb-2">Tasks</h3>
        <p className="text-gray-300 text-center">Organize, prioritize, and complete your daily tasks efficiently.</p>
      </div>
      {/* Pomodoro */}
      <div className="bg-neutral-900 rounded-2xl p-7 flex flex-col items-center shadow-xl border border-neutral-800 hover:border-pink-500 transition-all group">
        <span className="mb-4 flex items-center justify-center w-12 h-12 rounded-full border border-pink-500 group-hover:scale-110 transition-transform bg-neutral-950">
          <Timer className="w-7 h-7 text-pink-400" />
        </span>
        <h3 className="font-bold text-xl mb-2">Pomodoro</h3>
        <p className="text-gray-300 text-center">Boost focus and productivity with built-in Pomodoro timer sessions.</p>
      </div>
      {/* Goals */}
      <div className="bg-neutral-900 rounded-2xl p-7 flex flex-col items-center shadow-xl border border-neutral-800 hover:border-purple-500 transition-all group">
        <span className="mb-4 flex items-center justify-center w-12 h-12 rounded-full border border-purple-500 group-hover:scale-110 transition-transform bg-neutral-950">
          <Target className="w-7 h-7 text-purple-400" />
        </span>
        <h3 className="font-bold text-xl mb-2">Goals</h3>
        <p className="text-gray-300 text-center">Set, track, and achieve your personal and professional goals.</p>
      </div>
      {/* Cash Flow */}
      <div className="bg-neutral-900 rounded-2xl p-7 flex flex-col items-center shadow-xl border border-neutral-800 hover:border-yellow-500 transition-all group">
        <span className="mb-4 flex items-center justify-center w-12 h-12 rounded-full border border-yellow-500 group-hover:scale-110 transition-transform bg-neutral-950">
          <Banknote className="w-7 h-7 text-yellow-400" />
        </span>
        <h3 className="font-bold text-xl mb-2">Cash Flow</h3>
        <p className="text-gray-300 text-center">Monitor your income and expenses to stay on top of your finances.</p>
      </div>
      {/* Email Checker */}
      <div className="bg-neutral-900 rounded-2xl p-7 flex flex-col items-center shadow-xl border border-neutral-800 hover:border-cyan-500 transition-all group">
        <span className="mb-4 flex items-center justify-center w-12 h-12 rounded-full border border-cyan-500 group-hover:scale-110 transition-transform bg-neutral-950">
          <MailCheck className="w-7 h-7 text-cyan-400" />
        </span>
        <h3 className="font-bold text-xl mb-2">Email Checker</h3>
        <p className="text-gray-300 text-center">Verify and analyze emails to keep your communication effective.</p>
      </div>
    </section>
  );
} 