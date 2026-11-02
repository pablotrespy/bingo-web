"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function NewOrganizationPage() {
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("http://localhost:3000/organizations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), taxId: form.get("taxId"), phone: form.get("phone"), email: form.get("email"), postalCode: form.get("postalCode") }) });
    const data = await response.json();
    setMessage(response.ok ? `Organización creada con ID: ${data.id}` : (data.message ?? "No fue posible crear la organización"));
    if (response.ok) formElement.reset();
  }
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">BINGO-WEB</p><h1 className="mt-1 text-xl font-semibold">Nueva organización</h1></div>
          <Link className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-cyan-400 hover:text-cyan-300" href="/organizations">Volver</Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <form onSubmit={submit} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <h2 className="text-2xl font-semibold">Datos de la organización</h2>
          <p className="mt-2 text-sm text-slate-400">La organización quedará activa por defecto. Ingeniería podrá cambiar su estado cuando sea necesario.</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="mb-2 block text-sm text-slate-300">Organización</span><input name="name" required className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" placeholder="Ejemplo: Platinum S.A.S." /></label>
            <label><span className="mb-2 block text-sm text-slate-300">Identificación fiscal / NIT</span><input name="taxId" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" placeholder="Opcional" /></label>
            <label><span className="mb-2 block text-sm text-slate-300">Teléfono</span><input name="phone" type="tel" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" placeholder="Opcional" /></label>
            <label><span className="mb-2 block text-sm text-slate-300">Correo electrónico</span><input name="email" type="email" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" placeholder="Opcional" /></label>
            <label><span className="mb-2 block text-sm text-slate-300">Código postal</span><input name="postalCode" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" placeholder="Opcional" /></label>
          </div>
          {message && <p className="mt-6 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-sm text-cyan-200">{message}</p>}
          <div className="mt-8 flex justify-end gap-3"><Link className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 hover:border-slate-500" href="/organizations">Cancelar</Link><button className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300" type="submit">Guardar organización</button></div>
        </form>
      </div>
    </main>
  );
}
