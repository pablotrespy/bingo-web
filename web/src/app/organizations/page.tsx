"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Array<{ id: string; publicCode?: string; name: string; legalName?: string; status: string }>>([]);
  const [message, setMessage] = useState("");
  async function changeStatus(id: string, status: string) {
    const response = await fetch(`http://localhost:3000/organizations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (response.ok) setOrganizations((items) => items.map((item) => item.id === id ? { ...item, status } : item));
    else setMessage("No fue posible cambiar el estado");
  }
  useEffect(() => {
    fetch("http://localhost:3000/organizations").then((response) => response.json()).then(setOrganizations).catch(() => setOrganizations([]));
  }, []);
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">BINGO-WEB</p>
            <h1 className="mt-1 text-xl font-semibold">Organizaciones</h1>
          </div>
          <Link className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300" href="/dashboard">Volver al panel</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-cyan-300">Administración central</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Listado de organizaciones</h2>
            <p className="mt-2 text-slate-400">Cada organización tendrá un identificador independiente y un estado operativo propio.</p>
          </div>
          <Link className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300" href="/organizations/new">Crear organización</Link>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="grid grid-cols-[1fr_1.5fr_1fr_1.2fr] gap-4 border-b border-slate-800 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>ID</span><span>Organización</span><span>Estado</span><span className="text-right">Acciones</span>
          </div>
          {message && <div className="border-b border-amber-400/30 bg-amber-400/10 px-6 py-3 text-sm text-amber-200">{message}</div>}
          {organizations.length === 0 ? <div className="px-6 py-14 text-center text-sm text-slate-500">No hay organizaciones registradas todavía.</div> : organizations.map((organization) => (
            <div role="link" tabIndex={0} onClick={() => { window.location.href = `/organizations/${organization.id}`; }} onKeyDown={(event) => { if (event.key === "Enter") window.location.href = `/organizations/${organization.id}`; }} key={organization.id} className="grid cursor-pointer grid-cols-[1fr_1.5fr_1fr_1.2fr] items-center gap-4 border-b border-slate-800 px-6 py-5 text-sm transition hover:bg-slate-800/60 last:border-b-0">
              <span className="font-mono text-sm font-semibold text-cyan-300">{organization.publicCode ?? "—"}</span>
              <span className="font-medium text-slate-200">{organization.name}</span>
              <span><span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-300">{organization.status}</span></span>
              <span className="flex justify-end gap-2"><Link onClick={(event) => event.stopPropagation()} href={`/organizations/${organization.id}/edit`} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-cyan-400">Editar</Link>{organization.status === "ACTIVE" ? <button onClick={(event) => { event.stopPropagation(); changeStatus(organization.id, "INACTIVE"); }} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-amber-400">Desactivar</button> : <button onClick={(event) => { event.stopPropagation(); changeStatus(organization.id, "ACTIVE"); }} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-cyan-400">Activar</button>}</span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
