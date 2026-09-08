import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Radar,
  User,
  Users,
  Boxes,
  LogOut,
  Menu,
  X,
  Megaphone,
  Settings,
  BriefcaseBusiness,
  TrendingUp,
  Wallet,
  ShieldCheck,
  NotebookPen,
  CalendarDays,
  PiggyBank,
  GraduationCap,
  ClipboardList,
  Building2,
  KanbanSquare,
  FileSignature,
  Receipt,
  Tags,
  Mic,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase-external";
import { isBPH, isSupervisor, useMyProfile } from "@/hooks/useProfile";
import { usePendingAssignmentCount } from "@/hooks/useAssignments";
import { canApproveFunds } from "@/lib/fund-requests";
import { canManageCategories } from "@/lib/transactions";
import { fetchOrgSettings, resolveLogoUrl } from "@/lib/announcements";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: AppLayout,
});

const navSections = [
  {
    label: "UTAMA",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/workspace", label: "Ruang Kerja Saya", icon: BriefcaseBusiness },
      { to: "/calendar", label: "Kalender", icon: CalendarDays },
      { to: "/mentor-tasks", label: "Tugas dari Pembina", icon: GraduationCap },
    ] as const,
  },
  {
    label: "KOMUNIKASI",
    items: [{ to: "/announcements", label: "Pengumuman", icon: Megaphone }] as const,
  },
  {
    label: "KEUANGAN",
    items: [
      { to: "/fund-requests", label: "Pengajuan Dana", icon: Wallet },
      { to: "/budgets", label: "Anggaran", icon: PiggyBank },
      { to: "/transactions", label: "Feed Keuangan", icon: Receipt },
      { to: "/admin/categories", label: "Kelola Kategori", icon: Tags, requires: "categoryAdmin" },
    ] as const,
  },
  {
    label: "STRATEGI",
    items: [
      { to: "/command-center", label: "Command Center", icon: Radar },
      { to: "/member-progress", label: "Progres Anggota", icon: TrendingUp },
    ] as const,
  },
  {
    label: "EKSTERNAL",
    items: [
      { to: "/companies", label: "Perusahaan", icon: Building2 },
      { to: "/pipeline", label: "Pipeline", icon: KanbanSquare },
      { to: "/mous", label: "MoU", icon: FileSignature },
    ] as const,

  },
  {
    label: "EVENT",
    items: [
      { to: "/events", label: "Events", icon: CalendarDays },
      { to: "/speakers", label: "Speaker", icon: Mic },
    ] as const,
  },
  {
    label: "ORGANISASI",
    items: [
      { to: "/profile", label: "Profil Saya", icon: User },
      { to: "/members", label: "Anggota", icon: Users },
      { to: "/divisions", label: "Divisi", icon: Boxes },
      { to: "/meetings", label: "Rapat", icon: NotebookPen },
    ] as const,
  },
] as const;


function AppLayout() {
  const { data: profile } = useMyProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: org } = useQuery({ queryKey: ["org-settings"], queryFn: fetchOrgSettings });
  const { data: logoUrl } = useQuery({
    queryKey: ["org-logo", org?.logo_url],
    queryFn: () => resolveLogoUrl(org?.logo_url),
    enabled: !!org?.logo_url,
  });
  const canManageOrg = isBPH(profile?.role);
  const canApprove = canApproveFunds(profile?.role);
  const supervisor = isSupervisor(profile?.role);
  const categoryAdmin = canManageCategories(profile?.role);
  const pendingAssignments = usePendingAssignmentCount();

  async function handleLogout() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-muted">
      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={org?.org_name ?? "Logo organisasi"}
              className="h-9 max-w-[160px] object-contain"
            />
          ) : (
            <span className="text-lg font-bold tracking-tight">{org?.org_name ?? "OrgTool"}</span>
          )}
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Tutup menu">
            <X className="size-5" />
          </button>
        </div>
        <nav className="space-y-4 p-3">
          {navSections.map((section) => (
            <div key={section.label} className="space-y-1">
              <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-sidebar-foreground/50">
                {section.label}
              </p>
              {section.items.map((item) => (
                ("requires" in item && item.requires === "categoryAdmin" && !categoryAdmin) ? null :
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeProps={{
                    className:
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground",
                  }}
                >
                  <item.icon className="size-4" />
                  <span className="flex-1">{item.label}</span>
                  {item.to === "/mentor-tasks" && pendingAssignments > 0 && (
                    <span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-semibold text-destructive-foreground">
                      {pendingAssignments}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ))}

          {supervisor && (
            <div className="space-y-1">
              <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-sidebar-foreground/50">
                PEMBINA
              </p>
              <Link
                to="/mentor/assignments"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{
                  className:
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground",
                }}
              >
                <ClipboardList className="size-4" />
                Kelola Tugas
              </Link>
            </div>
          )}

          {canApprove && (
            <div className="space-y-1">
              <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-sidebar-foreground/50">
                KONTROL KEUANGAN
              </p>
              <Link
                to="/fund-approvals"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{
                  className:
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground",
                }}
              >
                <ShieldCheck className="size-4" />
                Persetujuan Dana
              </Link>
            </div>
          )}

          {canManageOrg && (
            <div className="space-y-1 border-t border-sidebar-border pt-3">
              <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-sidebar-foreground/50">
                SISTEM
              </p>
              <Link
                to="/settings/organization"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{
                  className:
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground",
                }}
              >
                <Settings className="size-4" />
                Pengaturan
              </Link>
            </div>
          )}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-card px-4 lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Buka menu">
            <Menu className="size-5" />
          </button>
          <div className="flex flex-1 items-center justify-end gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{profile?.full_name ?? "Pengguna"}</p>
              <p className="text-xs text-muted-foreground">{profile?.role ?? "Anggota"}</p>
            </div>
            <UserAvatar path={profile?.photo_url} name={profile?.full_name} className="size-9" />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
