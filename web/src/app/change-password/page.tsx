"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Actualizando contraseña...");
    const token = localStorage.getItem("bingo_access_token");
    const response = await fetch("http://localhost:3000/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` }, body: JSON.stringify({ currentPassword, newPassword }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.message ?? "No fue posible actualizar la contraseña"); return; }
    const stored = localStorage.getItem("bingo_user");
    if (stored) { const user = JSON.parse(stored); localStorage.setItem("bingo_user", JSON.stringify({ ...user, mustChangePassword: false })); }
    router.push("/dashboard");
  }

  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white"><form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">BINGO-WEB</p><h1 className="mt-3 text-2xl font-semibold">Crear contraseña personal</h1><p className="mt-2 text-sm text-slate-400">La contraseña temporal debe cambiarse antes de continuar.</p><label className="mt-6 block text-sm">Contraseña temporal<input required type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" /></label><label className="mt-4 block text-sm">Nueva contraseña<input required minLength={8} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3" /></label><button className="mt-6 w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950">Guardar contraseña</button>{message && <p className="mt-4 text-sm text-amber-200">{message}</p>}</form></main>;
}
