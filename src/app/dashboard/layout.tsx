import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  // فقط التاجر أو الأدمن يقدر يدخل لوحة التحكم
  if (session.role !== "MERCHANT" && session.role !== "ADMIN") {
    redirect("/");
  }

  const stores = await prisma.store.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      active: true,
      customDomain: true,
      customDomainStatus: true,
    },
  });

  return (
    <DashboardShell
      user={{ name: session.name, email: session.email, role: session.role }}
      stores={stores}
    >
      {children}
    </DashboardShell>
  );
}
