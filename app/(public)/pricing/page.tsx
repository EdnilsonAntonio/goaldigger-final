import PaymentLink from "@/components/PaymentLink";
import { Check } from "lucide-react";

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
}

const pricingList: PricingProps[] = [
    {
        title: "Plus Yearly",
        popular: 0,
        price: 39.90,
        description: "Lorem ipsum dolor sit, amet ipsum consectetur adipisicing elit.",
        buttonText: "Get Started",
        benefitList: ["1 Team member", "2 GB Storage", "Upto 4 pages", "Community support", "lorem ipsum dolor"],
        href: "/api/auth/login",
        paymentLink: process.env.STRIPE_YEARLY_PLUS_LINK,
        billing: "/year",
    },
    {
        title: "Plus",
        popular: 0,
        price: 3.99,
        description: "Lorem ipsum dolor sit, amet ipsum consectetur adipisicing elit.",
        buttonText: "Buy Now",
        benefitList: ["4 Team member", "4 GB Storage", "Upto 6 pages", "Priority support", "lorem ipsum dolor"],
        href: "/api/auth/login",
        paymentLink: process.env.STRIPE_MONTHLY_PLUS_LINK,
        billing: "/month",
    },
    {
        title: "Pro",
        popular: 1,
        price: 7.99,
        description: "Lorem ipsum dolor sit, amet ipsum consectetur adipisicing elit.",
        buttonText: "Buy Now",
        benefitList: ["10 Team member", "8 GB Storage", "Upto 10 pages", "Priority support", "lorem ipsum dolor"],
        href: "/api/auth/login",
        paymentLink: process.env.STRIPE_MONTHLY_PRO_LINK,
        billing: "/month",
    },
];

export default function PricingPage() {
    return (
        <section id='pricing' className='container py-24 sm:py-32'>
            <h2 className='text-3xl md:text-4xl font-bold text-center'>
                Get
                <span className='bg-gradient-to-b from-[#667EEA] to-[#764BA2] uppercase text-transparent bg-clip-text'>
                    {" "}
                    Unlimited{" "}
                </span>
                Access
            </h2>
            <h3 className='text-xl text-center text-muted-foreground pt-4 pb-8'>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Alias reiciendis.
            </h3>
            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
                {pricingList.map((pricing: PricingProps) => (
                    <div
                        key={pricing.title}
                        className={
                            pricing.popular === PopularPlanType.YES
                                ? "drop-shadow-xl shadow-black/10 dark:shadow-white/10"
                                : ""
                        }
                    >
                        <div>
                            <div className='flex item-center justify-between'>
                                {pricing.title}
                                {pricing.popular === PopularPlanType.YES ? (
                                    <span className='text-sm text-primary'>
                                        Most popular
                                    </span>
                                ) : null}
                            </div>
                            <div>
                                <span className='text-3xl font-bold'>${pricing.price}</span>
                                <span className='text-muted-foreground'> {pricing.billing}</span>
                            </div>

                            <p>{pricing.description}</p>
                        </div>

                        <div>
                            <PaymentLink
                                href={pricing.href}
                                text={pricing.buttonText}
                                paymentLink={pricing.paymentLink}
                            />
                        </div>

                        <hr className='w-4/5 m-auto mb-4' />

                        <div className='flex'>
                            <div className='space-y-4'>
                                {pricing.benefitList.map((benefit: string) => (
                                    <span key={benefit} className='flex'>
                                        <Check className='text-purple-500' /> <h3 className='ml-2'>{benefit}</h3>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}