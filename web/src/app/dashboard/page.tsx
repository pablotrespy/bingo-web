"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SessionUser = {
  fullName?: string;
  name?: string;
  email?: string;
  roles?: string[];
  role?: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [organizationName, setOrganizationName] = useState("Organización");

  useEffect(() => {
    const storedUser = localStorage.getItem("bingo_user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("bingo_user");
      }
    }
    const token = window.localStorage.getItem("bingo_access_token");
    fetch("http://localhost:3000/users", { headers: { Authorization: `Bearer ${token ?? ""}` } }).then((response) => response.ok ? response.json() : []).then((items: unknown[]) => setUserCount(items.length));
    fetch("http://localhost:3000/organizations/mine", { headers: { Authorization: `Bearer ${token ?? ""}` } }).then((response) => response.ok ? response.json() : []).then((items: Array<{ name?: string }>) => { if (items[0]?.name) setOrganizationName(items[0].name); });
  }, []);

  const name = user?.fullName || user?.name || user?.email || "Usuario";
  const role = user?.roles?.[0] || user?.role || "USUARIO";
  const isPlatformAdmin =
    role === "INGENIERIA" || role === "SUPER_ADMIN";

  function logout() {
    localStorage.removeItem("bingo_access_token");
    localStorage.removeItem("bingo_user");
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
              BINGO-WEB
            </p>
            <h1 className="mt-1 text-xl font-semibold">
              {isPlatformAdmin ? "Panel de Ingeniería" : organizationName}
            </h1>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-400">{name}</span>

            <button
              onClick={logout}
              className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm text-cyan-300">
            Sesión autenticada · {role}
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            {isPlatformAdmin
              ? "Administración de la plataforma"
              : "Administración de la organización"}
          </h2>

          <p className="mt-2 max-w-2xl text-slate-400">
            Bienvenido, {name}.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isPlatformAdmin && (
            <Link
              href="/organizations"
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg transition hover:border-cyan-400/60"
            >
              <p className="text-sm text-slate-400">Organizaciones</p>
              <p className="mt-4 text-3xl font-semibold">0</p>
              <p className="mt-2 text-xs text-cyan-300">
                Administrar organizaciones
              </p>
            </Link>
          )}

          <Link
            href="/users"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg transition hover:border-cyan-400/60"
          >
            <p className="text-sm text-slate-400">Usuarios</p>
              <p className="mt-4 text-3xl font-semibold">{userCount}</p>
            <p className="mt-2 text-xs text-cyan-300">
              Usuarios registrados
            </p>
          </Link>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <p className="text-sm text-slate-400">Locales</p>
            <p className="mt-4 text-3xl font-semibold">0</p>
            <p className="mt-2 text-xs text-cyan-300">
              Locales configurados
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
            <p className="text-sm text-slate-400">Auditoría</p>
            <p className="mt-4 text-3xl font-semibold">Activa</p>
            <p className="mt-2 text-xs text-cyan-300">
              Trazabilidad habilitada
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
