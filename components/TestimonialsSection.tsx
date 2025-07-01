import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function TestimonialsSection() {
  return (
    <section className="w-full max-w-4xl text-center mb-12">
      <h2 className="text-3xl font-bold mb-8">What our users say</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Testimonial 1 */}
        <div className="bg-neutral-800 rounded-xl p-6 flex flex-col items-center border border-neutral-700 shadow-lg">
          <Avatar className="mb-3 size-16">
            <AvatarImage src="https://randomuser.me/api/portraits/men/32.jpg" alt="John Doe" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <p className="text-gray-300 mb-3">“GoalDigger helped me finally organize my goals and actually achieve them. The Pomodoro timer is a game changer!”</p>
          <span className="font-semibold text-white">John Doe</span>
          <span className="text-xs text-gray-500">Product Manager</span>
        </div>
        {/* Testimonial 2 */}
        <div className="bg-neutral-800 rounded-xl p-6 flex flex-col items-center border border-neutral-700 shadow-lg">
          <Avatar className="mb-3 size-16">
            <AvatarImage src="https://randomuser.me/api/portraits/women/44.jpg" alt="Jane Smith" />
            <AvatarFallback>JS</AvatarFallback>
          </Avatar>
          <p className="text-gray-300 mb-3">“The dashboard and task management features keep me on track every day. Highly recommended!”</p>
          <span className="font-semibold text-white">Jane Smith</span>
          <span className="text-xs text-gray-500">Entrepreneur</span>
        </div>
        {/* Testimonial 3 */}
        <div className="bg-neutral-800 rounded-xl p-6 flex flex-col items-center border border-neutral-700 shadow-lg">
          <Avatar className="mb-3 size-16">
            <AvatarImage src="https://randomuser.me/api/portraits/men/65.jpg" alt="Carlos Rivera" />
            <AvatarFallback>CR</AvatarFallback>
          </Avatar>
          <p className="text-gray-300 mb-3">“I love how easy it is to track my finances and goals in one place. The interface is beautiful!”</p>
          <span className="font-semibold text-white">Carlos Rivera</span>
          <span className="text-xs text-gray-500">Freelancer</span>
        </div>
      </div>
    </section>
  );
} 