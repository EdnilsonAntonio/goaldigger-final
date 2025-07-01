"use client";

import { verifyEmail } from "@/app/(protected)/email-checker/actions";
import { useRef, useState } from "react";

export default function EmailVerifierForm() {

    const [status, setStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const emailRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: any, email: string) => {
        e.preventDefault();

        if (!email) {
            alert("E-mail is required!");
            return;
        }

        const emailValue = emailRef.current ? emailRef.current.value : "";
        setIsLoading(true);

        try {
            const data = await verifyEmail(emailValue);
            setStatus(data.data.status);
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
                    const emailValue = emailRef.current ? emailRef.current.value : "";
                    handleSubmit(e, emailValue);
                }}
                className="space-y-4"
            >
                <div>
                    <input
                        ref={emailRef}
                        type="email"
                        placeholder="Enter email address"
                        className="w-full border border-neutral-600 rounded-lg px-4 py-3 bg-neutral-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                    />
                </div>
                <button
                    className="w-full rounded-lg bg-blue-600 text-white py-3 px-4 font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? "Verifying..." : "Verify Email"}
                </button>
            </form>

            {status && (
                <div className="mt-4 p-3 bg-neutral-700 rounded-lg border border-neutral-600">
                    <p className="text-sm text-gray-300">
                        <span className="font-medium">Status:</span> {status}
                    </p>
                </div>
            )}
        </div>
    )
}