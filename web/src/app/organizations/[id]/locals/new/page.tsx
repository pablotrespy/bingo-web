"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";

function NewLocalForm() {
  const [organizationId, setOrganizationId] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => { const parts = window.location.pathname.split("/"); setOrganizationId(parts[2] ?? ""); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const token = localStorage.getItem("bingo_access_token");
    const response = await fetch("http://localhost:3000/locals", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` }, body: JSON.stringify({ organizationId, name: data.get("name") }) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.message ?? "No fue posible crear el local"); return; }
    setMessage(`Local creado con ID ${result.publicCode}`);
    event.currentTarget.reset();
  }
  return <main className="min-h-screen bg-slate-950 text-white"><header className="border-b border-slate-800 bg-slate-900/80"><div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5"><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">BINGO-WEB</p><h1 className="mt-1 text-xl font-semibold">Nuevo local</h1></div><Link href={organizationId ? `/organizations/${organizationId}` : "/organizations"} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300">Volver</Link></div></header><div className="mx-auto max-w-3xl px-6 py-10"><form onSubmit={submit} className="rounded-2xl border border-slate-800 bg-slate-900 p-6"><h2 className="text-2xl font-semibold">Datos del local</h2><p className="mt-2 text-sm text-slate-400">El local se crea activo por defecto.</p><label className="mt-8 block text-sm text-slate-300">Nombre del local<input name="name" required className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" placeholder="Ejemplo: Platinum Bingo 1" /></label>{message && <p className="mt-5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-sm text-cyan-200">{message}</p>}<button className="mt-8 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950">Guardar local</button></form></div></main>;
}

export default function NewLocalPage() { return <Suspense fallback={<main className="min-h-screen bg-slate-950 p-10 text-slate-300">Cargando...</main>}><NewLocalForm /></Suspense>; }
