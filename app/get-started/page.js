"use client";

import { useLayoutEffect, useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { firestore } from "../../firebase";
import DashboardTopBar from "../../components/DashboardTopBar";
import Footer from "../../components/Footer";

const NEED_OPTIONS = [
  { value: "", label: "Select what you need…" },
  { value: "donor-crm", label: "Donor / CRM system" },
  { value: "volunteer-portal", label: "Volunteer portal" },
  { value: "dashboard-reporting", label: "Dashboard or reporting" },
  { value: "custom-web-app", label: "Custom web app" },
  { value: "integration-api", label: "Integration or API" },
  { value: "other", label: "Not sure / Other" },
];

const TIMELINE_OPTIONS = [
  { value: "", label: "Select timeline…" },
  { value: "asap", label: "ASAP" },
  { value: "1-3-months", label: "1–3 months" },
  { value: "3-6-months", label: "3–6 months" },
  { value: "exploring", label: "Just exploring" },
];

export default function GetStarted() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    organization: "",
    need: "",
    timeline: "",
    message: "",
  });

  useLayoutEffect(() => {
    document.title = "Code4Community | Get Started";
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setSubmitting(true);
    try {
      const submission = {
        name: form.name.trim(),
        email: form.email.trim(),
        organization: form.organization?.trim() || "",
        need: form.need?.trim() || "",
        timeline: form.timeline?.trim() || "",
        message: form.message?.trim() || "",
        submittedAt: new Date().toISOString(),
      };
      await addDoc(collection(firestore, "tool_requests"), submission);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardTopBar title="Code4Community" showNavLinks={true} />
        <div className="flex-1 flex flex-col justify-center px-6 py-16">
          <div className="max-w-xl mx-auto text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Thanks for reaching out
            </h1>
            <p className="text-muted-foreground mb-8">
              We&apos;ve received your request and will get back to you within 1–2 business days.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Back to home
            </a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardTopBar title="Code4Community" showNavLinks={true} />

      <div className="relative min-h-[22vh] flex flex-col justify-center px-6 py-12 lg:py-14 overflow-hidden -mt-6">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto w-full">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Get started
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Tell us what you need. We&apos;ll follow up to see how we can help.
          </p>
        </div>
      </div>

      <div className="border-t border-border bg-muted/20 flex-1">
        <div className="max-w-xl mx-auto px-6 py-12">
          <form onSubmit={handleSubmit} className="bg-background rounded-xl border border-border shadow-sm p-6 md:p-8 space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="you@organization.org"
              />
            </div>

            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-foreground mb-1.5">
                Organization
              </label>
              <input
                id="organization"
                name="organization"
                type="text"
                value={form.organization}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Organization name (optional)"
              />
            </div>

            <div>
              <label htmlFor="need" className="block text-sm font-medium text-foreground mb-1.5">
                What do you need?
              </label>
              <select
                id="need"
                name="need"
                value={form.need}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {NEED_OPTIONS.map((opt) => (
                  <option key={opt.value || "empty"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="timeline" className="block text-sm font-medium text-foreground mb-1.5">
                Timeline
              </label>
              <select
                id="timeline"
                name="timeline"
                value={form.timeline}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {TIMELINE_OPTIONS.map((opt) => (
                  <option key={opt.value || "empty"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1.5">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={form.message}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
                placeholder="Tell us a bit more about your project or goals (optional)"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Sending…" : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
