"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditOrganizationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", taxId: "", phone: "", email: "", postalCode: "", status: "ACTIVE" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/organizations").then((response) => response.json()).then((items) => {
      const organization = items.find((item: { id: string }) => item.id === params.id);
      if (organization) setForm({ name: organization.name ?? "", taxId: organization.taxId ?? "", phone: organization.phone ?? "", email: organization.email ?? "", postalCode: organization.postalCode ?? "", status: organization.status ?? "ACTIVE" });
    });
  }, [params.id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`http://localhost:3000/organizations/${params.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setMessage(response.ok ? "Organización actualizada correctamente." : "No fue posible actualizar la organización.");
    if (response.ok) setTimeout(() => router.push("/organizations"), 700);
  }

  return <main className="min-h-screen bg-slate-950 text-white"><header className="border-b border-slate-800 bg-slate-900/80"><div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5"><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">BINGO-WEB</p><h1 className="mt-1 text-xl font-semibold">Editar organización</h1></div><Link className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-cyan-400" href="/organizations">Volver</Link></div></header><div className="mx-auto max-w-3xl px-6 py-10"><form onSubmit={submit} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"><h2 className="text-2xl font-semibold">Datos de la organización</h2><div className="mt-8 grid gap-5 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-2 block text-sm text-slate-300">Organización</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" /></label><label><span className="mb-2 block text-sm text-slate-300">NIT</span><input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" /></label><label><span className="mb-2 block text-sm text-slate-300">Teléfono</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" /></label><label><span className="mb-2 block text-sm text-slate-300">Correo</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" /></label><label><span className="mb-2 block text-sm text-slate-300">Código postal</span><input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" /></label><label><span className="mb-2 block text-sm text-slate-300">Estado</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"><option value="ACTIVE">Activa</option><option value="INACTIVE">Inactiva</option><option value="SUSPENDED">Suspendida</option></select></label></div>{message && <p className="mt-6 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-sm text-cyan-200">{message}</p>}<div className="mt-8 flex justify-end gap-3"><Link className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300" href="/organizations">Cancelar</Link><button className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950" type="submit">Guardar cambios</button></div></form></div></main>;
}
