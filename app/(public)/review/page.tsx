"use client";

import { useState, useRef, useEffect } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Button } from "@/components/ui/button";
import { Star, Send, CheckCircle2, AlertCircle, Loader2, Heart } from "lucide-react";
import { toast } from "sonner";

export default function ReviewPage() {
  const { isAuthenticated, getUser } = useKindeBrowserClient();
  const user = getUser();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  const commentRef = useRef<HTMLTextAreaElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Preencher email automaticamente se o usuário estiver autenticado
  useEffect(() => {
    if (isAuthenticated && user?.email && emailRef.current) {
      emailRef.current.value = user.email;
    }
    if (isAuthenticated && user?.given_name && nameRef.current) {
      const fullName = `${user.given_name}${user.family_name ? ` ${user.family_name}` : ""}`;
      nameRef.current.value = fullName;
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const comment = commentRef.current?.value.trim() || "";
    const name = nameRef.current?.value.trim() || "";
    const email = emailRef.current?.value.trim() || "";

    // Validação
    if (rating === 0) {
      setFormError("Rating is required");
      toast.error("Please select a rating");
      return;
    }

    // Se não estiver autenticado, nome ou email é obrigatório
    if (!isAuthenticated && !name && !email) {
      setFormError("Name or email is required");
      toast.error("Please provide your name or email");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          comment: comment || undefined,
          name: isAuthenticated ? (user?.given_name ? `${user.given_name}${user.family_name ? ` ${user.family_name}` : ""}` : undefined) : name || undefined,
          email: isAuthenticated ? user?.email : email || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to submit review");
      }

      const data = await response.json();
      setIsSubmitted(true);
      toast.success("Thank you for your review! Your feedback helps us improve.");

      // Limpar formulário
      setRating(0);
      if (commentRef.current) commentRef.current.value = "";
      if (nameRef.current && !isAuthenticated) nameRef.current.value = "";
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

  const renderStars = () => {
    return (
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= (hoveredRating || rating);
          return (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110 focus:outline-none"
            >
              <Star
                className={`w-10 h-10 ${
                  isFilled
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-neutral-600 fill-neutral-600"
                } transition-colors`}
              />
            </button>
          );
        })}
        {rating > 0 && (
          <span className="ml-2 text-neutral-400 text-sm">
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
          </span>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-black via-neutral-900 to-neutral-800 text-white">
      <section className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-600/20 rounded-full mb-4">
            <Heart className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Share Your Experience
          </h1>
          <p className="text-neutral-400 text-lg">
            We'd love to hear your thoughts! Your feedback helps us improve GoalDigger.
          </p>
        </div>

        {isSubmitted ? (
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-600/50 rounded-xl p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-400 mb-2">Thank You!</h2>
            <p className="text-neutral-300">
              Your review has been submitted successfully. We appreciate your feedback!
            </p>
            <p className="text-neutral-400 text-sm mt-2">
              Note: Reviews are moderated before being published.
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
              {/* Rating Field */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-4">
                  Rating <span className="text-red-400">*</span>
                </label>
                {renderStars()}
                {rating === 0 && (
                  <p className="mt-2 text-xs text-neutral-500">
                    Click on a star to rate your experience
                  </p>
                )}
              </div>

              {/* Comment Field */}
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-neutral-300 mb-2">
                  Your Review (Optional)
                </label>
                <textarea
                  ref={commentRef}
                  id="comment"
                  name="comment"
                  rows={6}
                  placeholder="Tell us about your experience with GoalDigger. What did you like? What could be improved?"
                  className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all resize-none"
                />
                <p className="mt-2 text-xs text-neutral-500">
                  Share your thoughts, suggestions, or any feedback you'd like to provide.
                </p>
              </div>

              {/* Name Field (only show if not authenticated) */}
              {!isAuthenticated && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-300 mb-2">
                    Your Name
                  </label>
                  <input
                    ref={nameRef}
                    type="text"
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
                  />
                </div>
              )}

              {/* Email Field (only show if not authenticated) */}
              {!isAuthenticated && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                    Your Email
                  </label>
                  <input
                    ref={emailRef}
                    type="email"
                    id="email"
                    name="email"
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
                  />
                  <p className="mt-2 text-xs text-neutral-500">
                    We'll use this to verify your review if needed. (Name or email is required)
                  </p>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-600/20 border border-blue-600/50 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  <strong className="text-blue-200">Note:</strong> All reviews are moderated before being published to ensure quality and authenticity.
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Review
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-neutral-500 text-sm">
            Have a question or need help? Visit our{" "}
            <a href="/support" className="text-yellow-400 hover:text-yellow-300 underline">
              support page
            </a>
            {" "}or{" "}
            <a href="/report-bug" className="text-yellow-400 hover:text-yellow-300 underline">
              report a bug
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
