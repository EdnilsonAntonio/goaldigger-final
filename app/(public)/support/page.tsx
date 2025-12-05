"use client";

import { useState, useRef, useEffect } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Button } from "@/components/ui/button";
import { HelpCircle, Send, CheckCircle2, AlertCircle, Loader2, Mail, MessageSquare, CreditCard, Settings, Lightbulb, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

const supportCategories = [
  { value: "billing", label: "Billing & Payments", icon: CreditCard, description: "Questions about subscriptions, payments, or billing" },
  { value: "technical", label: "Technical Support", icon: Settings, description: "Technical issues or bugs" },
  { value: "account", label: "Account Issues", icon: Mail, description: "Account settings, login, or profile" },
  { value: "feature", label: "Feature Request", icon: Lightbulb, description: "Suggest a new feature or improvement" },
  { value: "general", label: "General Inquiry", icon: MessageSquare, description: "General questions or information" },
  { value: "other", label: "Other", icon: MoreHorizontal, description: "Something else" },
];

export default function SupportPage() {
  const { isAuthenticated, getUser } = useKindeBrowserClient();
  const user = getUser();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("general");

  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Preencher email automaticamente se o usuário estiver autenticado
  useEffect(() => {
    if (isAuthenticated && user?.email && emailRef.current) {
      emailRef.current.value = user.email;
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const title = titleRef.current?.value.trim() || "";
    const description = descriptionRef.current?.value.trim() || "";
    const email = emailRef.current?.value.trim() || "";

    // Validação
    if (!title) {
      setFormError("Title is required");
      toast.error("Please provide a title for your support request");
      return;
    }

    if (!description) {
      setFormError("Description is required");
      toast.error("Please provide a description of your issue");
      return;
    }

    if (!selectedCategory) {
      setFormError("Category is required");
      toast.error("Please select a category");
      return;
    }

    // Se não estiver autenticado, email é obrigatório
    if (!isAuthenticated && !email) {
      setFormError("Email is required");
      toast.error("Please provide your email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/support-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          category: selectedCategory,
          email: isAuthenticated ? user?.email : email,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to submit support request");
      }

      const data = await response.json();
      setIsSubmitted(true);
      toast.success("Support request submitted successfully! We'll get back to you soon.");

      // Limpar formulário
      if (titleRef.current) titleRef.current.value = "";
      if (descriptionRef.current) descriptionRef.current.value = "";
      if (emailRef.current && !isAuthenticated) emailRef.current.value = "";
      setSelectedCategory("general");

      // Resetar estado após 3 segundos
      setTimeout(() => {
        setIsSubmitted(false);
      }, 3000);
    } catch (error: any) {
      const errorMessage = error?.message || "An unexpected error occurred";
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-black via-neutral-900 to-neutral-800 text-white">
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
            <HelpCircle className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Support Center
          </h1>
          <p className="text-neutral-400 text-lg">
            We're here to help! Submit a support request and we'll get back to you as soon as possible.
          </p>
        </div>

        {isSubmitted ? (
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-600/50 rounded-xl p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-400 mb-2">Request Submitted!</h2>
            <p className="text-neutral-300">
              Your support request has been submitted successfully. Our team will review it and respond to you soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Category Selection */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold mb-4 text-white">Select Category</h2>
              <div className="space-y-2">
                {supportCategories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategory === category.value;
                  return (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => setSelectedCategory(category.value)}
                      className={`w-full p-4 rounded-lg border transition-all text-left ${
                        isSelected
                          ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                          : "bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:border-neutral-600"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isSelected ? "text-blue-400" : "text-neutral-400"}`} />
                        <div>
                          <div className="font-medium">{category.label}</div>
                          <div className="text-xs mt-1 opacity-75">{category.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <form
                onSubmit={handleSubmit}
                className="bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-neutral-700 rounded-xl p-8 shadow-xl"
              >
                {formError && (
                  <div className="mb-6 p-4 bg-red-600/20 border border-red-600/50 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{formError}</p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Title Field */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-neutral-300 mb-2">
                      Subject <span className="text-red-400">*</span>
                    </label>
                    <input
                      ref={titleRef}
                      type="text"
                      id="title"
                      name="title"
                      required
                      placeholder="Brief description of your issue"
                      className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                  </div>

                  {/* Description Field */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-neutral-300 mb-2">
                      Description <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      ref={descriptionRef}
                      id="description"
                      name="description"
                      required
                      rows={8}
                      placeholder="Please provide as much detail as possible about your issue or question..."
                      className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                    />
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                      Your Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      ref={emailRef}
                      type="email"
                      id="email"
                      name="email"
                      required={!isAuthenticated}
                      readOnly={isAuthenticated}
                      placeholder="your.email@example.com"
                      className={`w-full px-4 py-3 bg-neutral-800/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all ${
                        isAuthenticated ? "opacity-75 cursor-not-allowed" : ""
                      }`}
                    />
                    {isAuthenticated && (
                      <p className="mt-2 text-xs text-neutral-500">
                        Email is automatically filled from your account.
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Submit Support Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-neutral-500 text-sm">
            Need immediate assistance? Check out our{" "}
            <a href="/report-bug" className="text-blue-400 hover:text-blue-300 underline">
              bug report page
            </a>
            {" "}or{" "}
            <a href="/review" className="text-blue-400 hover:text-blue-300 underline">
              leave a review
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
