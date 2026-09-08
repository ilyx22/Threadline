import Link from "next/link";
import { TooltipProvider } from "@/components/ui/menu";
import { requireInternal } from "@/lib/auth/guard";
import { can } from "@/lib/auth/roles";
import { ADMIN_NAV } from "@/lib/navigation";
import { LogoLink } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { ROLE_META, metaOf } from "@/lib/domain/enums";
import { operatorQueue } from "@/lib/data/admin";
import { logoutAction } from "@/lib/actions/auth";
import { AdminNav, AdminUserMenu } from "./admin-nav";

/**
 * Admin portal shell.
 *
 * Guarded by `requireInternal()` — a client role cannot reach any route beneath
 * this layout, and none of the admin repositories are imported by client routes.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireInternal("admin.view");
  const queue = await operatorQueue();

  const navKeys = ADMIN_NAV.filter((item) => can(admin.role, item.capability)).map((i) => i.key);
  const roleLabel = metaOf(ROLE_META, admin.role).label;

  async function logout() {
    "use server";
    await logoutAction();
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-dvh">
        <header className="sticky top-0 z-40 border-b border-line bg-base/90 backdrop-blur-md">
          <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
            <LogoLink href="/admin" size="sm" suffix="Admin" />

            <AdminNav navKeys={navKeys} queueCount={queue.total} />

            <div className="ml-auto flex items-center gap-3">
              <Link
                href="/app"
                className="hidden text-[12.5px] text-faint transition-colors hover:text-muted sm:inline"
              >
                Client portal
              </Link>
              <Badge tone="accent">{roleLabel}</Badge>
              <AdminUserMenu
                name={admin.user.name}
                email={admin.user.email}
                avatarHue={admin.user.avatarHue}
                onLogout={logout}
              />
            </div>
          </div>
        </header>

        <main className="px-4 py-8 lg:px-6">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </TooltipProvider>
  );
}
