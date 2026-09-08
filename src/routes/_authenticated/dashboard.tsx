import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Boxes, UserCheck, Building2, BriefcaseBusiness, Handshake, Coins, Landmark, Receipt, CalendarDays } from "lucide-react";
import { useDivisions, useMyProfile, useProfiles, isSupervisor } from "@/hooks/useProfile";
import { fetchDeals } from "@/lib/deals";
import { fetchDashboardFinance } from "@/lib/transactions";
import { fetchEvents, formatEventDate } from "@/lib/events";
import { formatRupiah } from "@/lib/format";
import { SupervisorOverview } from "@/components/assignments/SupervisorOverview";
import { UrgentBanners } from "@/components/announcements/UrgentBanners";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — OrgTool" },
      { name: "description", content: "Ringkasan anggota dan divisi organisasi kampus." },
      { property: "og:title", content: "Dashboard — OrgTool" },
      { property: "og:description", content: "Ringkasan anggota dan divisi organisasi kampus." },
    ],
  }),
  component: DashboardPage,
});

function StatCard({
  label,
  value,
  icon: Icon,
  valueClassName = "",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <p className={`mt-3 text-3xl font-bold tracking-tight break-words ${valueClassName}`}>{value}</p>
    </div>
  );
}

function DashboardPage() {
  const { data: profile } = useMyProfile();
  const { data: profiles = [], isLoading } = useProfiles();
  const { data: divisions = [] } = useDivisions();

  const { data: deals = [] } = useQuery({ queryKey: ["deals"], queryFn: fetchDeals });
  const { data: finance } = useQuery({ queryKey: ["dashboard-finance"], queryFn: fetchDashboardFinance });
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: fetchEvents });

  const activeEvents = events.filter((e) =>
    ["Planning", "Preparation", "Live"].includes(e.status ?? ""),
  );
  const upcomingEvent = [...events]
    .filter((e) => e.date_start && new Date(e.date_start).getTime() >= Date.now() - 86400000)
    .sort((a, b) => new Date(a.date_start!).getTime() - new Date(b.date_start!).getTime())[0];

  const activeDeals = deals.filter(
    (d) => d.stage !== "Deal" && d.stage !== "Rejected" && d.stage !== "Ghosted",
  ).length;
  const pipelineValue = deals
    .filter((d) => ["Prospect", "Contacted", "Pitched", "Negotiating"].includes(d.stage))
    .reduce((s, d) => s + Number(d.value_idr ?? 0), 0);

  const totalAnggota = profiles.length;
  const anggotaAktif = profiles.filter((p) => p.status === "Active").length;
  const myDivision = divisions.find((d) => d.code === profile?.division);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <UrgentBanners />

      {isSupervisor(profile?.role) && <SupervisorOverview />}

      <section className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Halo, {profile?.nickname || profile?.full_name || "Anggota"}!
        </h1>
        <p className="mt-2 text-sm text-primary-foreground/80">
          Selamat datang kembali di OrgTool. Berikut ringkasan organisasi hari ini.
        </p>
        <Link
          to="/workspace"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-card/90"
        >
          <BriefcaseBusiness className="size-4" />
          Buka Ruang Kerja Saya
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Anggota" value={isLoading ? "…" : totalAnggota} icon={Users} />
        <StatCard label="Total Divisi" value={divisions.length || "…"} icon={Boxes} />
        <StatCard label="Anggota Aktif" value={isLoading ? "…" : anggotaAktif} icon={UserCheck} />
        <StatCard
          label="Divisi Saya"
          value={myDivision?.code ?? "-"}
          icon={Building2}
        />
        <StatCard label="Deal Aktif" value={activeDeals} icon={Handshake} />
        <StatCard label="Total Pipeline Value" value={formatRupiah(pipelineValue)} icon={Coins} />
        <StatCard
          label="Saldo Organisasi"
          value={finance ? formatRupiah(finance.balance) : "…"}
          icon={Landmark}
          valueClassName={finance ? (finance.balance >= 0 ? "text-emerald-600" : "text-red-600") : ""}
        />
        <StatCard
          label="Expense Bulan Ini"
          value={finance ? formatRupiah(finance.monthExpense) : "…"}
          icon={Receipt}
          valueClassName="text-red-600"
        />
        <StatCard label="Event Aktif" value={activeEvents.length} icon={CalendarDays} />

      </section>

      {upcomingEvent && (
        <Link
          to="/events/$id"
          params={{ id: upcomingEvent.id }}
          className="block rounded-2xl border bg-card p-6 shadow-sm transition-colors hover:bg-accent/40"
        >
          <p className="text-sm text-muted-foreground">Event Berikutnya</p>
          <h2 className="mt-1 text-lg font-semibold">{upcomingEvent.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatEventDate(upcomingEvent.date_start, upcomingEvent.date_end)}
            {upcomingEvent.venue ? ` — ${upcomingEvent.venue}` : ""}
          </p>
        </Link>
      )}

      {myDivision && (
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Divisi {myDivision.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {myDivision.description ?? "Belum ada deskripsi divisi."}
          </p>
        </section>
      )}
    </div>
  );
}
