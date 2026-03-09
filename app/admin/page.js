"use client";

import { useLayoutEffect, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { firestore } from "../../firebase";
import DashboardTopBar from "../../components/DashboardTopBar";
import Footer from "../../components/Footer";
import { useAuth } from "@/utils/AuthContext";

const ADMIN_EMAIL = "shail40926@gmail.com";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useLayoutEffect(() => {
    document.title = "Code4Community | Admin";
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (!authLoading && user && user.email !== ADMIN_EMAIL) {
      return; // show access denied below
    }
    if (!user) return;

    let cancelled = false;
    async function fetchRequests() {
      try {
        const q = query(
          collection(firestore, "tool_requests"),
          orderBy("submittedAt", "desc")
        );
        const snapshot = await getDocs(q);
        if (!cancelled) {
          setRequests(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load requests.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchRequests();
    return () => { cancelled = true; };
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardTopBar title="Code4Community" showNavLinks={true} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading…</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardTopBar title="Code4Community" showNavLinks={true} />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground mb-2">Access denied</h1>
            <p className="text-muted-foreground mb-4">This page is for administrators only.</p>
            <Link href="/" className="text-primary hover:underline">Back to home</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardTopBar title="Code4Community" showNavLinks={true} />

      <div className="border-t border-border bg-muted/20 flex-1">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-bold text-foreground mb-2">Admin dashboard</h1>
          <p className="text-muted-foreground mb-6">Submitted get-started requests</p>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-muted-foreground">Loading requests…</p>
          ) : requests.length === 0 ? (
            <p className="text-muted-foreground">No submissions yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-background">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 font-medium text-foreground">Date</th>
                    <th className="px-4 py-3 font-medium text-foreground">Name</th>
                    <th className="px-4 py-3 font-medium text-foreground">Email</th>
                    <th className="px-4 py-3 font-medium text-foreground">Organization</th>
                    <th className="px-4 py-3 font-medium text-foreground">Need</th>
                    <th className="px-4 py-3 font-medium text-foreground">Timeline</th>
                    <th className="px-4 py-3 font-medium text-foreground">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-foreground">{r.name || "—"}</td>
                      <td className="px-4 py-3 text-foreground">
                        <a href={`mailto:${r.email}`} className="text-primary hover:underline">{r.email || "—"}</a>
                      </td>
                      <td className="px-4 py-3 text-foreground">{r.organization || "—"}</td>
                      <td className="px-4 py-3 text-foreground">{r.need || "—"}</td>
                      <td className="px-4 py-3 text-foreground">{r.timeline || "—"}</td>
                      <td className="px-4 py-3 text-foreground max-w-xs truncate" title={r.message || ""}>{r.message || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
