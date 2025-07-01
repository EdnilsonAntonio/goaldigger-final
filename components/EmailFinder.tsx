"use client";

import { findEmail } from "@/app/(protected)/email-checker/actions";
import { useRef, useState } from "react";

export default function EmailFinderForm() {

    const [email, setEmail] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const domainRef = useRef<HTMLInputElement>(null);
    const firstNameRef = useRef<HTMLInputElement>(null);
    const lastNameRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: any, domain: string, first_name: string, second_name: string) => {
        e.preventDefault();

        if (!domain || !first_name || !second_name) {
            alert("All fields are required!");
            return;
        }

        const domainValue = domainRef.current ? domainRef.current.value : "";
        const firstName = firstNameRef.current ? firstNameRef.current.value : "";
        const lastName = lastNameRef.current ? lastNameRef.current.value : "";
        setIsLoading(true);

        try {
            const data = await findEmail(domainValue, firstName, lastName);
            setEmail(data.data.email);
            // alert("Function worked! Checked the logs"); // debug
            console.log(data);
        } catch (error) {
            console.log(error);
            alert(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="w-full">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    const domainValue = domainRef.current ? domainRef.current.value : "";
                    const firstName = firstNameRef.current ? firstNameRef.current.value : "";
                    const lastName = lastNameRef.current ? lastNameRef.current.value : "";
                    handleSubmit(e, domainValue, firstName, lastName);
                }}
                className="space-y-4"
            >
                <div>
                    <input
                        ref={domainRef}
                        type="text"
                        placeholder="Company domain (e.g., company.com)"
                        className="w-full border border-neutral-600 rounded-lg px-4 py-3 bg-neutral-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <input
                        ref={firstNameRef}
                        type="text"
                        placeholder="First name"
                        className="w-full border border-neutral-600 rounded-lg px-4 py-3 bg-neutral-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                    />
                    <input
                        ref={lastNameRef}
                        type="text"
                        placeholder="Last name"
                        className="w-full border border-neutral-600 rounded-lg px-4 py-3 bg-neutral-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                    />
                </div>
                <button
                    className="w-full rounded-lg bg-blue-600 text-white py-3 px-4 font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? "Finding..." : "Find Email"}
                </button>
            </form>

            {email && (
                <div className="mt-4 p-3 bg-neutral-700 rounded-lg border border-neutral-600">
                    <p className="text-sm text-gray-300">
                        <span className="font-medium">Found Email:</span> {email}
                    </p>
                </div>
            )}
        </div>
    )
}