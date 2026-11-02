"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function UsersPage() {
  const [users, setUsers] = useState<Array<{ id: string; publicCode?: string; fullName: string; email: string; isActive: boolean; roleCode?: string }>>([]);
  const [sessionUser, setSessionUser] = useState<{ fullName?: string; email?: string; roles?: Array<string | { code?: string }> }>({});
  useEffect(() => { const token = window.localStorage.getItem("bingo_access_token"); const storedUser = window.localStorage.getItem("bingo_user"); if (storedUser) { try { setSessionUser(JSON.parse(storedUser)); } catch { setSessionUser({}); } } fetch("http://localhost:3000/users", { headers: { Authorization: `Bearer ${token ?? ""}` } }).then((r) => r.ok ? r.json() : []).then(setUsers); }, []);
  const currentName = sessionUser.fullName || sessionUser.email || "Usuario";
  const currentRole = typeof sessionUser.roles?.[0] === "string" ? sessionUser.roles[0] : sessionUser.roles?.[0]?.code || "USUARIO";
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">BINGO-WEB</p>
            <h1 className="mt-1 text-xl font-semibold">Usuarios de la organización</h1>
          </div>
          <div className="flex items-center gap-4"><div className="text-right"><p className="text-sm text-slate-200">{currentName}</p><p className="text-xs text-cyan-300">{currentRole}</p></div><Link className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300" href="/dashboard">Volver al panel</Link></div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-cyan-300">Administración central</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Usuarios de la organización</h2>
            <p className="mt-2 text-slate-400">Administración de usuarios y roles de la organización.</p>
          </div>
          <Link className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300" href="/users/new">Crear usuario</Link>
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="grid grid-cols-[1fr_1.4fr_1.4fr_1fr_1.2fr] gap-4 border-b border-slate-800 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>ID</span><span>Nombre</span><span>Correo</span><span>Estado</span><span className="text-right">Acciones</span>
          </div>
          {users.length === 0 ? <div className="px-6 py-14 text-center text-sm text-slate-500">No hay usuarios registrados todavía.</div> : users.map((user) => <div key={user.id} className="grid grid-cols-[1fr_1.4fr_1.4fr_1fr_1.2fr] gap-4 border-b border-slate-800 px-6 py-5 text-sm"><span className="font-mono text-sm font-semibold text-cyan-300">{user.publicCode ?? "—"}</span><span>{user.fullName}</span><span>{user.email}</span><span className="text-cyan-300">{user.isActive ? "ACTIVO" : "INACTIVO"}</span><span className="text-right text-xs text-slate-400">{user.roleCode ?? "—"}</span></div>)}
        </section>
      </div>
    </main>
  );
}
