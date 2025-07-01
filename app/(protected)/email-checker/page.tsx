import EmailFinderForm from "@/components/EmailFinder";
import EmailVerifierForm from "@/components/EmailVerifierForm";
import EmailCounterForm from "@/components/EmailCounter";
import { MailCheck, Search, Calculator } from "lucide-react";

export default function EmailCheckerPage() {
    return (
        <main className="min-h-screen bg-neutral-900 text-white p-6">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
                        <MailCheck className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-3">Email Checker</h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Comprehensive email tools to verify, find, and analyze email addresses.
                        Streamline your email validation workflow with our powerful suite.
                    </p>
                </div>
            </div>

            {/* Tools Grid */}
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Email Verifier Card */}
                    <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 p-6 hover:border-neutral-600 transition-all duration-300 hover:shadow-xl">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center mr-3">
                                <MailCheck className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">Email Verifier</h2>
                                <p className="text-sm text-gray-400">Validate email addresses</p>
                            </div>
                        </div>
                        <p className="text-gray-300 mb-6 text-sm leading-relaxed">
                            Drop your email—let's make sure it's legit before we hit send!
                            Verify email validity and deliverability in seconds.
                        </p>
                        <EmailVerifierForm />
                    </div>

                    {/* Email Finder Card */}
                    <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 p-6 hover:border-neutral-600 transition-all duration-300 hover:shadow-xl">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center mr-3">
                                <Search className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">Email Finder</h2>
                                <p className="text-sm text-gray-400">Discover business emails</p>
                            </div>
                        </div>
                        <p className="text-gray-300 mb-6 text-sm leading-relaxed">
                            Hunting for a business email? Just give us the name and domain—we'll do the digging.
                            Find professional email addresses instantly.
                        </p>
                        <EmailFinderForm />
                    </div>

                    {/* Email Counter Card */}
                    <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 p-6 hover:border-neutral-600 transition-all duration-300 hover:shadow-xl">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center mr-3">
                                <Calculator className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">Email Counter</h2>
                                <p className="text-sm text-gray-400">Count domain emails</p>
                            </div>
                        </div>
                        <p className="text-gray-300 mb-6 text-sm leading-relaxed">
                            Wondering how many emails are tied to a domain? Leave it to us.
                            Get comprehensive email statistics for any domain.
                        </p>
                        <EmailCounterForm />
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-7xl mx-auto mt-16">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Why Choose Our Email Tools?</h2>
                    <p className="text-gray-400">Built for professionals who need reliable email validation</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6">
                        <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <MailCheck className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Fast & Accurate</h3>
                        <p className="text-gray-400 text-sm">Get results in seconds with industry-leading accuracy rates</p>
                    </div>

                    <div className="text-center p-6">
                        <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Search className="w-6 h-6 text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Easy to Use</h3>
                        <p className="text-gray-400 text-sm">Simple interface designed for both beginners and professionals</p>
                    </div>

                    <div className="text-center p-6">
                        <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Calculator className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Comprehensive</h3>
                        <p className="text-gray-400 text-sm">Three powerful tools in one place for all your email needs</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
