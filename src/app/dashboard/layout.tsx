import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  // فقط التاجر أو الأدمن يقدر يدخل لوحة التحكم
  if (session.role !== "MERCHANT" && session.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <DashboardShell user={{ name: session.name, email: session.email, role: session.role }}>
      {children}
    </DashboardShell>
  );
}
