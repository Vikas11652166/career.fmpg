import React from "react";
import { redirect } from "next/navigation";
import { getMeAction } from "@/app/actions/auth";
import { getCandidateApplicationsAction } from "@/app/actions/applications";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CandidateDashboard from "@/components/dashboard/CandidateDashboard";

export default async function DashboardPage() {
  const meRes = await getMeAction();

  if (!meRes.success || !meRes.data) {
    redirect("/login");
  }

  const user = meRes.data;

  // If the user has an admin or employee role, redirect them to the admin panel
  const isAdmin = ["admin", "super-admin", "employee"].includes(user.role);
  if (isAdmin) {
    redirect("/admin/dashboard");
  }

  // Fetch applications
  const appRes = await getCandidateApplicationsAction();
  const applications = appRes.success ? appRes.data : [];

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Navbar />
      
      {/* Dashboard Main Content Container */}
      <section className="flex-grow max-w-7xl mx-auto px-6 md:px-12 py-16">
        <CandidateDashboard applications={applications} user={user} />
      </section>

      <Footer />
    </div>
  );
}
