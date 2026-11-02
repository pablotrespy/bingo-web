"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Local = { id: string; publicCode?: string; name: string; isActive: boolean };

const modules = [
  { key: "mesa-control", title: "Mesa de control", description: "Iniciar y supervisar la partida central.", href: "mesa-control", roles: ["ORG_ADMIN", "LOCAL_ADMIN", "SUPERVISOR", "OPERADOR_BINGO"] },
  { key: "ventas-caja", title: "Ventas y Caja", description: "Registrar ventas, recaudos, pagos y cierre de caja.", href: "ventas-caja", roles: ["ORG_ADMIN", "LOCAL_ADMIN", "SUPERVISOR", "CAJERO_VENDEDOR"] },
  { key: "caja", title: "Resumen de Caja", description: "Consultar el movimiento acumulado y cerrar la jornada del vendedor.", href: "caja", roles: ["ORG_ADMIN", "LOCAL_ADMIN", "SUPERVISOR", "CAJERO_VENDEDOR"] },
  { key: "lista-jugadas", title: "Lista de jugadas", description: "Consultar las jugadas disponibles para este local.", href: "lista-jugadas", roles: ["ORG_ADMIN", "LOCAL_ADMIN", "SUPERVISOR", "OPERADOR_BINGO", "CAJERO_VENDEDOR"] },
];

export default function LocalDashboardPage() {
  const [local, setLocal] = useState<Local | null>(null);
  const [organizationId, setOrganizationId] = useState("");
  const [role, setRole] = useState("USUARIO");

  useEffect(() => {
    const parts = window.location.pathname.split("/");
    const orgId = parts[2] ?? "";
    const localId = parts[4] ?? "";
    setOrganizationId(orgId);
    const stored = localStorage.getItem("bingo_user");
    if (stored) { try { const user = JSON.parse(stored); const firstRole = user.roles?.[0]; setRole(typeof firstRole === "string" ? firstRole : firstRole?.code ?? "USUARIO"); } catch {} }
    const token = localStorage.getItem("bingo_access_token");
    fetch(`http://localhost:3000/locals/organization/${orgId}`, { headers: { Authorization: `Bearer ${token ?? ""}` } }).then((response) => response.ok ? response.json() : []).then((items: Local[]) => setLocal(items.find((item) => item.id === localId) ?? null));
  }, []);

  if (!local) return <main className="min-h-screen bg-slate-950 p-10 text-slate-300">Cargando local...</main>;

  return <main className="min-h-screen bg-slate-950 text-white"><header className="border-b border-slate-800 bg-slate-900/80"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">BINGO-WEB</p><h1 className="mt-1 text-xl font-semibold">Operación del local</h1></div><Link href={`/organizations/${organizationId}`} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-cyan-400">Volver a la organización</Link></div></header><div className="mx-auto max-w-7xl px-6 py-10"><div className="rounded-2xl border border-slate-800 bg-slate-900 p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="font-mono text-sm font-semibold text-cyan-300">{local.publicCode ?? "—"}</p><h2 className="mt-2 text-3xl font-semibold">{local.name}</h2><p className="mt-2 text-sm text-slate-400">Punto de operación y ventas · Rol: {role}</p></div><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">{local.isActive ? "ACTIVO" : "INACTIVO"}</span></div></div><div className="mt-8 grid gap-5 md:grid-cols-2">{modules.filter((module) => module.roles.includes(role) || role === "INGENIERIA" || role === "SUPER_ADMIN").map((module) => <Link key={module.key} href={`/organizations/${organizationId}/locals/${local.id}/${module.href}`} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400"><h3 className="text-xl font-semibold">{module.title}</h3><p className="mt-2 text-sm text-slate-400">{module.description}</p><p className="mt-5 text-sm font-semibold text-cyan-300">Abrir módulo →</p></Link>)}</div></div></main>;
}
