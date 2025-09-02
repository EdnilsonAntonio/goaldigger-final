import PaymentLink from "@/components/PaymentLink";
import { Check, Star } from "lucide-react";

enum PopularPlanType {
    NO = 0,
    YES = 1,
}

interface PricingProps {
    title: string;
    popular: PopularPlanType;
    price: number;
    description: string;
    buttonText: string;
    benefitList: string[];
    href: string;
    billing: string;
    paymentLink?: string;
    color: string;
    borderColor: string;
}

const pricingList: PricingProps[] = [
    {
        title: "Plus",
        popular: 0,
        price: 3.99,
        description: "Perfect for individuals getting started with productivity tools.",
        buttonText: "Get Started",
        benefitList: ["Up to 7 tasks lists", "Up to 20 notes", "Up to 5 pomodoro tasks", "Up to 10 goals", "Basic cash flow management", "Unlimited email checks"],
        href: "/api/auth/login",
        paymentLink: process.env.STRIPE_MONTHLY_PLUS_LINK,
        billing: "/month",
        color: "text-green-400",
        borderColor: "hover:border-green-500",
    },
    {
        title: "Pro",
        popular: 1,
        price: 7.99,
        description: "Ideal for power users and small teams who need advanced features.",
        buttonText: "Get Started",
        benefitList: ["Up to 20 tasks lists", "Up to 60 notes", "Up to 10 pomodoro tasks", "Up to 30 goals", "Advanced cash flow management", "Unlimited email checks", "Priority support"],
        href: "/api/auth/login",
        paymentLink: process.env.STRIPE_MONTHLY_PRO_LINK,
        billing: "/month",
        color: "text-blue-400",
        borderColor: "hover:border-blue-500",
    },
    {
        title: "Plus Yearly",
        popular: 0,
        price: 39.90,
        description: "Save 17% with annual billing for the Plus plan.",
        buttonText: "Get Started",
        benefitList: ["Up to 7 tasks lists", "Up to 20 notes", "Up to 5 pomodoro tasks", "Up to 10 goals", "Basic cash flow management", "Unlimited email checks"],
        href: "/api/auth/login",
        paymentLink: process.env.STRIPE_YEARLY_PLUS_LINK,
        billing: "/year",
        color: "text-purple-400",
        borderColor: "hover:border-purple-500",
    },
    {
        title: "Pro Yearly",
        popular: 0,
        price: 79.90,
        description: "Save 17% with annual billing for the Pro plan.",
        buttonText: "Get Started",
        benefitList: ["Up to 20 tasks lists", "Up to 60 notes", "Up to 10 pomodoro tasks", "Up to 30 goals", "Advanced cash flow management", "Unlimited email checks", "Priority support"],
        href: "/api/auth/login",
        paymentLink: process.env.STRIPE_YEARLY_PRO_LINK,
        billing: "/year",
        color: "text-pink-400",
        borderColor: "hover:border-pink-500",
    }
];

export default function PricingPage() {
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-neutral-900 to-neutral-800 text-white">
            <main className="flex-1 flex flex-col items-center justify-center px-4 pt-12 pb-8">
                <section className="w-full max-w-6xl">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-5xl font-extrabold leading-tight mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                            Choose Your Plan
                        </h1>
                        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                            Start your productivity journey with our flexible pricing plans.
                            Choose the perfect plan that fits your needs and scale as you grow.
                        </p>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {pricingList.map((pricing: PricingProps) => (
                            <div
                                key={pricing.title}
                                className={`bg-neutral-900 rounded-2xl p-7 shadow-xl border border-neutral-800 ${pricing.borderColor} transition-all group relative ${pricing.popular === PopularPlanType.YES
                                    ? "ring-2 ring-blue-500/50 scale-105"
                                    : ""
                                    }`}
                            >
                                {/* Popular Badge */}
                                {pricing.popular === PopularPlanType.YES && (
                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap">
                                            <Star className="w-3 h-3" />
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                {/* Plan Header */}
                                <div className="text-center mb-6">
                                    <h3 className={`text-2xl font-bold mb-2 ${pricing.color}`}>
                                        {pricing.title}
                                    </h3>
                                    <div className="mb-4">
                                        <span className="text-4xl font-bold">€{pricing.price}</span>
                                        <span className="text-gray-400 ml-1">{pricing.billing}</span>
                                    </div>
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        {pricing.description}
                                    </p>
                                </div>

                                {/* CTA Button */}
                                <div className="mb-6">
                                    <PaymentLink
                                        href={pricing.href}
                                        text={pricing.buttonText}
                                        paymentLink={pricing.paymentLink}
                                    />
                                </div>

                                {/* Divider */}
                                <div className="w-full h-px bg-neutral-700 mb-6" />

                                {/* Benefits List */}
                                <div className="space-y-3">
                                    {pricing.benefitList.map((benefit: string) => (
                                        <div key={benefit} className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <Check className="w-4 h-4 text-green-400" />
                                            </div>
                                            <span className="text-gray-300 text-sm leading-relaxed">
                                                {benefit}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Additional Info */}
                    <div className="text-center mt-12">
                        <p className="text-gray-400 text-sm">
                            Monthly plans include a 7-day free trial. Cancel anytime.
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                            Need help choosing? <a href="/support" className="text-blue-400 hover:text-blue-300 underline">Contact our support team</a>
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}