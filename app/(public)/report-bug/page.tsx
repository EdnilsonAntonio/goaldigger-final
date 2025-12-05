"use client";

import { useState, useRef, useEffect } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Button } from "@/components/ui/button";
import { Bug, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ReportBugPage() {
  const { isAuthenticated, getUser } = useKindeBrowserClient();
  const user = getUser();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
      toast.error("Please provide a title for the bug report");
      return;
    }

    if (!description) {
      setFormError("Description is required");
      toast.error("Please provide a description of the bug");
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
      // Obter informações do navegador
      const browserInfo = `${navigator.vendor} ${navigator.product}`;
      const userAgent = navigator.userAgent;
      const url = window.location.href;

      const response = await fetch("/api/bug-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          email: isAuthenticated ? user?.email : email,
          browserInfo,
          userAgent,
          url,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to submit bug report");
      }

      const data = await response.json();
      setIsSubmitted(true);
      toast.success("Bug report submitted successfully! Thank you for your feedback.");

      // Limpar formulário
      if (titleRef.current) titleRef.current.value = "";
      if (descriptionRef.current) descriptionRef.current.value = "";
      if (emailRef.current && !isAuthenticated) emailRef.current.value = "";

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
      <section className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600/20 rounded-full mb-4">
            <Bug className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Report a Bug
          </h1>
          <p className="text-neutral-400 text-lg">
            Found something that's not working? Let us know and we'll fix it as soon as possible.
          </p>
        </div>

        {isSubmitted ? (
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-600/50 rounded-xl p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-400 mb-2">Thank You!</h2>
            <p className="text-neutral-300">
              Your bug report has been submitted successfully. We'll review it and get back to you soon.
            </p>
          </div>
        ) : (
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
                  Bug Title <span className="text-red-400">*</span>
                </label>
                <input
                  ref={titleRef}
                  type="text"
                  id="title"
                  name="title"
                  required
                  placeholder="e.g., Button not responding on mobile devices"
                  className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
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
                  placeholder="Please describe the bug in detail. Include steps to reproduce, expected behavior, and actual behavior..."
                  className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all resize-none"
                />
                <p className="mt-2 text-xs text-neutral-500">
                  Be as detailed as possible. Include steps to reproduce the issue, what you expected to happen, and what actually happened.
                </p>
              </div>

              {/* Email Field (only show if not authenticated) */}
              {!isAuthenticated && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                    Your Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    ref={emailRef}
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
                  />
                  <p className="mt-2 text-xs text-neutral-500">
                    We'll use this to contact you about the bug report if needed.
                  </p>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-600/20 border border-blue-600/50 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  <strong className="text-blue-200">Note:</strong> Your browser information and current URL will be automatically included to help us diagnose the issue.
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Bug Report
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-neutral-500 text-sm">
            For urgent issues, please contact our support team directly at{" "}
            <a href="/support" className="text-blue-400 hover:text-blue-300 underline">
              support
            </a>
            .
          </p>
        </div>
            </section>
        </main>
    );
}
