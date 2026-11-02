"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("pablotrespy@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Validando acceso...");

    try {
      const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message ?? "No fue posible iniciar sesión");
      }

      window.localStorage.setItem("bingo_access_token", data.accessToken);
      window.localStorage.setItem("bingo_user", JSON.stringify(data.user));
      router.push(data.user.mustChangePassword ? "/change-password" : "/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible conectar con el backend");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-white">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">BINGO-WEB</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Acceso a la plataforma</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">Ingresa con tu cuenta autorizada de administración.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Correo electrónico</span>
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Contraseña</span>
            <span className="relative block">
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-cyan-300"
              >
                {showPassword ? (
                  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.5C5.6 5.9 8.42 4 12 4c3.58 0 6.4 1.9 8.02 4.5a2.9 2.9 0 010 3C18.4 14.1 15.58 16 12 16c-3.58 0-6.4-1.9-8.02-4.5a2.9 2.9 0 010-3z" />
                    <circle cx="12" cy="10" r="2.5" />
                    <path strokeLinecap="round" d="M4 4l16 16" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.5C5.6 5.9 8.42 4 12 4c3.58 0 6.4 1.9 8.02 4.5a2.9 2.9 0 010 3C18.4 14.1 15.58 16 12 16c-3.58 0-6.4-1.9-8.02-4.5a2.9 2.9 0 010-3z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                )}
              </button>
            </span>
          </label>

          <button className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-900" type="submit">
            Iniciar sesión
          </button>
        </form>

        {message && <p className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">{message}</p>}
        <p className="mt-8 text-center text-xs text-slate-500">Acceso protegido y auditado</p>
      </section>
    </main>
  );
}
