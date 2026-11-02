"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
export default function SalasPage() {
  const params = useParams<{ id: string; localId: string }>();
  const back = `/organizations/${params.id}/locals/${params.localId}`;
  return <main className="min-h-screen bg-slate-950 p-6 text-white"><div className="mx-auto max-w-5xl"><Link href={back} className="text-sm text-cyan-300">← Volver al local</Link><section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">OPERACIÓN DEL LOCAL</p><h1 className="mt-2 text-3xl font-black">Salas</h1><p className="mt-2 text-slate-400">Administración de salas y espacios de operación.</p><div className="mt-8 rounded-xl border border-dashed border-slate-700 p-10 text-center text-slate-500">Módulo de salas listo para configurar.</div></section></div></main>;
}
