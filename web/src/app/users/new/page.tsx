"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export default function NewOrgAdminPage() {
  const [organizations, setOrganizations] = useState<Array<{ id: string; publicCode?: string; name: string }>>([]);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [selectedRole, setSelectedRole] = useState("SUPERVISOR");
  const roleOptions = ["SUPERVISOR", "AUDITOR", "LOCAL_ADMIN", "OPERADOR_BINGO", "CAJERO_VENDEDOR"];
  useEffect(() => { const token = window.localStorage.getItem("bingo_access_token"); const storedUser = window.localStorage.getItem("bingo_user"); if (storedUser) { try { const user = JSON.parse(storedUser); const roles = Array.isArray(user.roles) ? user.roles.map((role: string | { code?: string }) => typeof role === "string" ? role : role.code) : []; const platform = roles.includes("INGENIERIA") || roles.includes("SUPER_ADMIN"); setIsPlatformAdmin(platform); if (platform) setSelectedRole("ORG_ADMIN"); } catch { setIsPlatformAdmin(false); } } fetch("http://localhost:3000/organizations", { headers: { Authorization: `Bearer ${token ?? ""}` } }).then((r) => r.ok ? r.json() : []).then(setOrganizations); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const token = window.localStorage.getItem("bingo_access_token");
    const response = await fetch("http://localhost:3000/users", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` }, body: JSON.stringify({ fullName: data.get("fullName"), identification: data.get("identification"), email: data.get("email"), organizationId: data.get("organizationId") || undefined, roleCode: data.get("roleCode") }) });
    const result = await response.json();
    window.alert(response.ok ? `Usuario creado. Contraseña inicial: ${result.temporaryPassword}` : (result.message ?? "No fue posible crear el usuario"));
    if (response.ok) window.location.href = "/users";
  }
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">BINGO-WEB</p><h1 className="mt-1 text-xl font-semibold">Nuevo usuario</h1></div>
          <Link className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-cyan-400 hover:text-cyan-300" href="/users">Volver</Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <form onSubmit={submit} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <h2 className="text-2xl font-semibold">Datos del administrador</h2>
          <p className="mt-2 text-sm text-slate-400">Este usuario administrará una organización asignada.</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <label><span className="mb-2 block text-sm text-slate-300">Nombre completo <span className="text-slate-500">(opcional)</span></span><input name="fullName" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" placeholder="Nombre completo" /></label>
            <label><span className="mb-2 block text-sm text-slate-300">Cédula <span className="text-slate-500">(opcional)</span></span><input name="identification" inputMode="numeric" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" placeholder="Número de cédula" /></label>
            <label><span className="mb-2 block text-sm text-slate-300">Correo electrónico <span className="text-slate-500">(opcional)</span></span><input name="email" type="email" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" placeholder="correo@organizacion.com" /></label>
            <label><span className="mb-2 block text-sm text-slate-300">Teléfono <span className="text-slate-500">(opcional)</span></span><input type="tel" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400" placeholder="Número de teléfono" /></label>
            <label><span className="mb-2 block text-sm text-slate-300">Organización <span className="text-slate-500">(opcional)</span></span><select name="organizationId" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"><option value="">Seleccionar organización</option>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.publicCode ? `${organization.publicCode} — ` : ""}{organization.name}</option>)}</select></label>
            <label><span className="mb-2 block text-sm text-slate-300">Rol</span><select name="roleCode" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400">{isPlatformAdmin && <option>ORG_ADMIN</option>}{roleOptions.map((role) => <option key={role}>{role}</option>)}</select></label>
          </div>
          <p className="mt-5 text-xs text-slate-500">El usuario se creará activo. El estado podrá cambiarse desde el listado por un administrador autorizado.</p>
          <div className="mt-8 flex justify-end gap-3"><Link className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 hover:border-slate-500" href="/users">Cancelar</Link><button className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300" type="submit">Guardar usuario</button></div>
        </form>
      </div>
    </main>
  );
}
