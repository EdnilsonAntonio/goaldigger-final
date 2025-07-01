"use client";

import { emailCounter } from "@/app/(protected)/email-checker/actions";
import { useRef, useState } from "react";

interface EmailCountData {
    total: number;
    personal_emails: number;
    generic_emails: number;
    department: {
        executive: number;
        it: number;
        finance: number;
        management: number;
        sales: number;
        legal: number;
        support: number;
        hr: number;
        marketing: number;
        communication: number;
        education: number;
        design: number;
        health: number;
        operations: number;
    };
    seniority: {
        junior: number;
        senior: number;
        executive: number;
    };
}

export default function EmailCounterForm() {

    const [emailData, setEmailData] = useState<EmailCountData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const domainRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: any, domain: string) => {
        e.preventDefault();

        if (!domain) {
            alert("Domain is required!");
            return;
        }

        const domainValue = domainRef.current ? domainRef.current.value : "";
        setIsLoading(true);

        try {
            const data = await emailCounter(domainValue);
            setEmailData(data.data);
            // alert("Function worked! Checked the logs"); // debug
            console.log(data);
        } catch (error) {
            console.log(error);
            alert(error);
        } finally {
            setIsLoading(false);
        }
    }

    const getDepartmentIcon = (dept: string) => {
        const icons: { [key: string]: string } = {
            executive: "👔",
            it: "💻",
            finance: "💰",
            management: "📊",
            sales: "📈",
            legal: "⚖️",
            support: "🛠️",
            hr: "👥",
            marketing: "📢",
            communication: "📞",
            education: "🎓",
            design: "🎨",
            health: "🏥",
            operations: "⚙️"
        };
        return icons[dept] || "📧";
    };

    const getSeniorityIcon = (level: string) => {
        const icons: { [key: string]: string } = {
            junior: "🆕",
            senior: "⭐",
            executive: "👑"
        };
        return icons[level] || "📧";
    };

    return (
        <div className="w-full">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    const domainValue = domainRef.current ? domainRef.current.value : "";
                    handleSubmit(e, domainValue);
                }}
                className="space-y-4"
            >
                <div>
                    <input
                        ref={domainRef}
                        type="text"
                        placeholder="Enter domain (e.g., company.com)"
                        className="w-full border border-neutral-600 rounded-lg px-4 py-3 bg-neutral-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                    />
                </div>
                <button
                    className="w-full rounded-lg bg-blue-600 text-white py-3 px-4 font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? "Counting..." : "Count Emails"}
                </button>
            </form>

            {emailData && (
                <div className="mt-4 space-y-3">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">📧</span>
                                <div>
                                    <p className="text-xs text-blue-300">Total</p>
                                    <p className="text-lg font-bold text-white">{emailData.total.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">👤</span>
                                <div>
                                    <p className="text-xs text-green-300">Personal</p>
                                    <p className="text-lg font-bold text-white">{emailData.personal_emails.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🏢</span>
                                <div>
                                    <p className="text-xs text-purple-300">Generic</p>
                                    <p className="text-lg font-bold text-white">{emailData.generic_emails.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Department Breakdown */}
                    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-3">
                        <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
                            <span className="mr-1">🏢</span>
                            Departments
                        </h3>
                        <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-800 snap-x snap-mandatory">
                            {Object.entries(emailData.department)
                                .filter(([_, count]) => count > 0)
                                .sort(([_, a], [__, b]) => b - a)
                                .map(([dept, count]) => (
                                    <div key={dept} className="bg-neutral-700 rounded-md p-3 text-center min-w-[120px] max-w-[140px] flex-shrink-0 flex flex-col items-center snap-center">
                                        <div className="text-base mb-2">{getDepartmentIcon(dept)}</div>
                                        <p className="text-sm text-gray-300 capitalize mb-1 leading-tight break-words w-full overflow-hidden text-ellipsis whitespace-normal">{dept}</p>
                                        <p className="text-sm font-semibold text-white">{count}</p>
                                    </div>
                                ))}
                        </div>
                        {Object.values(emailData.department).every(count => count === 0) && (
                            <p className="text-gray-400 text-xs text-center py-2">No department data</p>
                        )}
                    </div>

                    {/* Seniority Levels */}
                    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-3">
                        <h3 className="text-sm font-semibold text-white mb-2 flex items-center">
                            <span className="mr-1">📊</span>
                            Seniority
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(emailData.seniority)
                                .filter(([_, count]) => count > 0)
                                .sort(([_, a], [__, b]) => b - a)
                                .map(([level, count]) => (
                                    <div key={level} className="bg-neutral-700 rounded-md p-2 text-center">
                                        <div className="text-base mb-1">{getSeniorityIcon(level)}</div>
                                        <p className="text-xs text-gray-300 capitalize">{level}</p>
                                        <p className="text-sm font-semibold text-white">{count}</p>
                                    </div>
                                ))}
                        </div>
                        {Object.values(emailData.seniority).every(count => count === 0) && (
                            <p className="text-gray-400 text-xs text-center py-2">No seniority data</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}