"use client";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { checkAuthStatus } from "./actions";
import { useEffect, useState } from "react";

const Page = () => {
	const router = useRouter();
	const { user } = useKindeBrowserClient();
	const [isRedirecting, setIsRedirecting] = useState(false);
	const { data } = useQuery({
		queryKey: ["checkAuthStatus"],
		queryFn: async () => await checkAuthStatus(),
	});

	useEffect(() => {

		if (!data) return; // Aguarda os dados chegarem

		if (data.success === false) {
			router.push("/");
			return;
		};

		if (data.success && user?.email) {
			const stripePaymentLink = localStorage.getItem("stripePaymentLink");

			if (stripePaymentLink) {
				// Usuário logado com link de pagamento - redireciona para Stripe
				setIsRedirecting(true);
				localStorage.removeItem("stripePaymentLink");
				window.location.href = stripePaymentLink + `?prefilled_email=${user.email}`;
			} else {
				// Usuário logado sem link de pagamento - vai para dashboard
				router.push("/dashboard");
			}
		}

	}, [router, user, data]);

	// Loading state enquanto não temos dados ou estamos redirecionando
	if (!data || isRedirecting) {
		return (
			<div className='mt-20 w-full flex justify-center'>
				<div className='flex flex-col items-center gap-2'>
					<Loader className='w-10 h-10 animate-spin text-primary' />
					<h3 className='text-xl font-bold'>
						{isRedirecting ? "Redirecting to payment..." : "Redirecting..."}
					</h3>
					<p>Please wait...</p>
				</div>
			</div>
		);
	}

	// Fallback - não deveria chegar aqui
	return null;
};
export default Page;