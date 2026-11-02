"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SessionUser = { fullName?: string; name?: string; email?: string; roles?: string[]; role?: string };
type Organization = { id: string; name?: string };
type Local = { id: string; name?: string };

export default function DashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [localCount, setLocalCount] = useState(0);
  const [localId, setLocalId] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("bingo_user");
    if (storedUser) { try { setUser(JSON.parse(storedUser)); } catch { localStorage.removeItem("bingo_user"); } }
    const token = localStorage.getItem("bingo_access_token");
    const headers = { Authorization: `Bearer ${token ?? ""}` };
    fetch("http://localhost:3000/users", { headers }).then(response => response.ok ? response.json() : []).then((items: unknown[]) => setUserCount(items.length));
    fetch("http://localhost:3000/organizations/mine", { headers }).then(response => response.ok ? response.json() : []).then((items: Organization[]) => { const current = items[0] ?? null; setOrganization(current); if (current) fetch(`http://localhost:3000/locals/organization/${current.id}`, { headers }).then(response => response.ok ? response.json() : []).then((locals: Local[]) => { setLocalCount(locals.length); setLocalId(locals[0]?.id ?? ""); }); });
  }, []);

  const name = user?.fullName || user?.name || user?.email || "Usuario";
  const role = user?.roles?.[0] || user?.role || "USUARIO";
  const isPlatformAdmin = role === "INGENIERIA" || role === "SUPER_ADMIN";
  const localHref = (module: string) => localId && organization ? `/organizations/${organization.id}/locals/${localId}/${module}` : organization ? `/organizations/${organization.id}` : "/dashboard";
  const cardClass = "rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg transition hover:border-cyan-400/60";
  function logout() { localStorage.removeItem("bingo_access_token"); localStorage.removeItem("bingo_user"); window.location.href = "/login"; }

  return <main className="min-h-screen bg-slate-950 text-white"><header className="border-b border-slate-800 bg-slate-900/80"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">BINGO-WEB</p><h1 className="mt-1 text-xl font-semibold">{isPlatformAdmin ? "Panel de Ingeniería" : organization?.name ?? "Organización"}</h1></div><div className="flex items-center gap-4 text-sm"><span className="text-slate-400">{name}</span><button onClick={logout} className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300">Salir</button></div></div></header><div className="mx-auto max-w-7xl px-6 py-10"><div className="mb-8"><p className="text-sm text-cyan-300">Sesión autenticada · {role}</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">{isPlatformAdmin ? "Administración de la plataforma" : "Administración de la organización"}</h2></div><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{isPlatformAdmin && <Link href="/organizations" className={cardClass}><p className="text-sm text-slate-400">Organizaciones</p><p className="mt-4 text-xl font-semibold">Administrar organizaciones</p></Link>}<Link href="/users" className={cardClass}><p className="text-sm text-slate-400">Usuarios</p><p className="mt-4 text-3xl font-semibold">{userCount}</p><p className="mt-2 text-xs text-cyan-300">Administrar usuarios</p></Link><Link href={organization ? `/organizations/${organization.id}` : "/dashboard"} className={cardClass}><p className="text-sm text-slate-400">Locales</p><p className="mt-4 text-3xl font-semibold">{localCount}</p><p className="mt-2 text-xs text-cyan-300">Administrar locales</p></Link><Link href={organization ? `/organizations/${organization.id}` : "/dashboard"} className={cardClass}><p className="text-sm text-slate-400">Salas</p><p className="mt-4 text-xl font-semibold">Configuración</p><p className="mt-2 text-xs text-cyan-300">Administrar salas de los locales</p></Link><Link href={localHref("mesa-control")} className={cardClass}><p className="text-sm text-slate-400">Mesa de control</p><p className="mt-4 text-xl font-semibold">Operar bingo</p><p className="mt-2 text-xs text-cyan-300">Supervisar la partida</p></Link><Link href={localHref("lista-jugadas")} className={cardClass}><p className="text-sm text-slate-400">Lista de jugadas</p><p className="mt-4 text-xl font-semibold">Consultar jugadas</p><p className="mt-2 text-xs text-cyan-300">Ver las jugadas del local</p></Link><div className={cardClass}><p className="text-sm text-slate-400">Auditoría</p><p className="mt-4 text-xl font-semibold text-emerald-300">Activa</p><p className="mt-2 text-xs text-cyan-300">Trazabilidad habilitada</p></div></section></div></main>;
}
