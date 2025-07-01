import { HelpCircle } from "lucide-react";

export default function FAQSection() {
  return (
    <section className="w-full max-w-3xl mx-auto mb-16">
      <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
      <div className="space-y-6">
        <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800">
          <div className="flex items-center mb-2">
            <HelpCircle className="w-5 h-5 text-blue-400 mr-2" />
            <span className="font-semibold">What makes GoalDigger different?</span>
          </div>
          <p className="text-gray-400 ml-7">GoalDigger combines goal setting, task management, productivity tools, and analytics in one seamless platform designed to help you achieve more.</p>
        </div>
        <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800">
          <div className="flex items-center mb-2">
            <HelpCircle className="w-5 h-5 text-green-400 mr-2" />
            <span className="font-semibold">Can I use GoalDigger on mobile and desktop?</span>
          </div>
          <p className="text-gray-400 ml-7">Absolutely! GoalDigger is fully responsive and works beautifully on any device, so you can stay productive anywhere.</p>
        </div>
        <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800">
          <div className="flex items-center mb-2">
            <HelpCircle className="w-5 h-5 text-purple-400 mr-2" />
            <span className="font-semibold">How do integrations work?</span>
          </div>
          <p className="text-gray-400 ml-7">You can connect your favorite tools in just a few clicks from your dashboard.</p>
        </div>
        <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800">
          <div className="flex items-center mb-2">
            <HelpCircle className="w-5 h-5 text-yellow-400 mr-2" />
            <span className="font-semibold">Is my data secure?</span>
          </div>
          <p className="text-gray-400 ml-7">We use industry-standard security practices to keep your data safe and private.</p>
        </div>
        <div className="bg-neutral-900 rounded-xl p-5 border border-neutral-800">
          <div className="flex items-center mb-2">
            <HelpCircle className="w-5 h-5 text-pink-400 mr-2" />
            <span className="font-semibold">How much does GoalDigger cost?</span>
          </div>
          <p className="text-gray-400 ml-7">We offer flexible plans to fit your needs. Check our pricing page for details and choose the plan that's right for you.</p>
        </div>
      </div>
    </section>
  );
} 