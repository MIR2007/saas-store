import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import Logo from "@/components/Logo";
import { VERSION } from "@/lib/version";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-surface flex">
      <aside className="w-64 bg-white border-l border-border flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo size="sm" />
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 text-sm">
          <Link href="/dashboard" className="block px-3 py-2 rounded-lg text-muted hover:bg-surface hover:text-foreground">
            نظرة عامة
          </Link>
          <Link href="/dashboard/stores" className="block px-3 py-2 rounded-lg text-muted hover:bg-surface hover:text-foreground">
            متاجري
          </Link>
        </nav>
        <div className="p-4 border-t border-border">
          <div className="text-sm text-foreground font-medium mb-2 truncate">{session.name}</div>
          <div className="text-xs text-muted truncate mb-3">{session.email}</div>
          <LogoutButton />
          <div className="text-[10px] text-muted mt-3">v{VERSION}</div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}