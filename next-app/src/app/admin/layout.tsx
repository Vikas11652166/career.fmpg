import { redirect } from "next/navigation";
import { getMeAction } from "@/app/actions/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

// Roles that are permitted to access the admin section
const ALLOWED_ROLES = ["admin", "super-admin", "employee"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // -------------------------------------------------------------------------
  // Auth guard
  // -------------------------------------------------------------------------
  const result = await getMeAction();

  if (!result.success || !result.data) {
    redirect("/login");
  }

  const { name, email, role } = result.data as {
    name: string;
    email: string;
    role: string;
    [key: string]: unknown;
  };

  if (!ALLOWED_ROLES.includes(role as AllowedRole)) {
    redirect("/login");
  }

  // -------------------------------------------------------------------------
  // Layout
  // -------------------------------------------------------------------------
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#fafbfc] bg-grid-pattern">
      {/* Subtle radial gradient background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 10% 0%, rgba(5,150,105,0.06) 0%, transparent 70%), " +
            "radial-gradient(ellipse 60% 50% at 90% 100%, rgba(245,158,11,0.04) 0%, transparent 70%)",
        }}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Sidebar                                                              */}
      {/* ------------------------------------------------------------------ */}
      <AdminSidebar userName={name} userRole={role} userEmail={email} />

      {/* ------------------------------------------------------------------ */}
      {/* Main content area                                                    */}
      {/* ------------------------------------------------------------------ */}
      <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
