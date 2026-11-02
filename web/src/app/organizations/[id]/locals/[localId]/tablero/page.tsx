"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const BALL_MAX = 42;
const BALL_MIN = 28;
const GAP = 4;
const HPAD = 12;
const VPAD = 4;
const LEFT = 24;
const RIGHT = 8;
const STRIP_TOP = 16;
const STRIP_HEIGHT = 64;
const VTOP = 80;
const VBOTTOM = 24;
const MAX_COLUMNS = 3;

type BallPosition = { x: number; y: number }; type WinnerPopup = { type:"line"|"bingo"; cards:{cardNumber:number;grid:(number|null)[][]}[]; called:number[]; expiresAt:number };

type TubeLayout = {
  ball: number;
  gap: number;
  pitch: number;
  horizontalCount: number;
  rows: number;
  columns: number;
  positions: BallPosition[];
};

function computeTubeLayout(count: number, width: number, height: number): TubeLayout | null {
  if (width <= 0 || height <= 0) return null;

  const availableWidth = width - LEFT - RIGHT - HPAD * 2;
  const verticalInner = height - VTOP - VBOTTOM - VPAD * 2;

  let ball = BALL_MAX;
  let pitch = BALL_MAX + GAP;
  let horizontalCount = 0;
  let rows = 0;

  for (let size = BALL_MAX; size >= BALL_MIN; size -= 2) {
    const candidatePitch = size + GAP;
    const candidateHorizontal = Math.floor((availableWidth + GAP) / candidatePitch);
    const candidateRows = Math.floor((verticalInner + GAP) / candidatePitch);
    ball = size;
    pitch = candidatePitch;
    horizontalCount = candidateHorizontal;
    rows = candidateRows;
    if (
      candidateHorizontal > 0 &&
      candidateRows > 0 &&
      candidateHorizontal + MAX_COLUMNS * candidateRows >= count
    ) {
      break;
    }
  }

  horizontalCount = Math.max(1, horizontalCount);
  rows = Math.max(1, rows);

  const fullRow = count >= horizontalCount && horizontalCount > 1;
  const horizontalPitch = fullRow ? (availableWidth - ball) / (horizontalCount - 1) : pitch;
  const horizontalY = STRIP_TOP + (STRIP_HEIGHT - ball) / 2;
  const horizontalShown = Math.min(count, horizontalCount);

  const positions: BallPosition[] = [];

  for (let index = 0; index < horizontalShown; index += 1) {
    positions.push({ x: LEFT + HPAD + index * horizontalPitch, y: horizontalY });
  }

  for (let index = horizontalCount; index < count; index += 1) {
    const offset = index - horizontalCount;
    const column = Math.floor(offset / rows);
    const row = offset % rows;
    positions.push({
      x: width - RIGHT - VPAD - ball - column * pitch,
      y: VTOP + VPAD + row * pitch,
    });
  }

  const remaining = Math.max(0, count - horizontalCount);
  const columns = Math.min(MAX_COLUMNS, Math.max(2, Math.ceil(remaining / rows)));

  return { ball, gap: GAP, pitch, horizontalCount, rows, columns, positions };
}

const formatMoney = (value: string | number) =>
  new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(Number(value) || 0);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("es-CO", { timeZone: "America/Bogota", day: "2-digit", month: "2-digit", year: "numeric" });

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("es-CO", { timeZone: "America/Bogota", hour: "2-digit", minute: "2-digit", hour12: false });

export default function TableroPage() {
  const params = useParams<{ id: string; localId: string }>();
  const [called, setCalled] = useState<number[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [game, setGame] = useState<{ linePrize?: string | number; bingoPrize?: string | number; bingoAt?: string } | null>(null);
  const [lineDone, setLineDone] = useState(false);
  const [drawStarted, setDrawStarted] = useState(false); const [winnerPopup,setWinnerPopup]=useState<WinnerPopup|null>(null);
  const [prizeIndex, setPrizeIndex] = useState(0);

  useEffect(() => {
    const load = () => { const popupSaved=localStorage.getItem(`bingo-winners-${params.localId}`); if(popupSaved){try{const popup=JSON.parse(popupSaved) as WinnerPopup;setWinnerPopup(popup.expiresAt>Date.now()?popup:null);if(popup.expiresAt<=Date.now())localStorage.removeItem(`bingo-winners-${params.localId}`)}catch{setWinnerPopup(null)}}else setWinnerPopup(null);
      const id = localStorage.getItem(`bingo-selected-game-${params.localId}`);
      if (!id) {
        setCalled([]);
        setCurrent(null);
        setGame(null);
        setLineDone(false);
        setDrawStarted(false);
        return;
      }
      const token = localStorage.getItem("bingo_access_token");
      fetch(`http://localhost:3000/games/${id}/draw`, { headers: { Authorization: `Bearer ${token ?? ""}` } })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (data) {
            const saved = localStorage.getItem(`bingo-draw-${params.localId}`);
            const local = saved ? JSON.parse(saved) : null;
            const apiNumbers = Array.isArray(data.calledNumbers) ? data.calledNumbers : [];
            const localNumbers = Array.isArray(local?.called) ? local.called : [];
            const numbers = apiNumbers.length >= localNumbers.length ? apiNumbers : localNumbers;
            setCalled(numbers);
            setCurrent(numbers.length ? numbers[numbers.length - 1] : (data.current ?? local?.current ?? null));
            setDrawStarted(Boolean(data.started) || numbers.length > 0);
            setLineDone(localStorage.getItem(`bingo-phase-${params.localId}`) === "bingo");
          }
        })
        .catch(() => {
          const saved = localStorage.getItem(`bingo-draw-${params.localId}`);
          const local = saved ? JSON.parse(saved) : null;
          if (local) {
            setCalled(local.called ?? []);
            setCurrent(local.current ?? null); setDrawStarted(Boolean(local.started) || Array.isArray(local.called) && local.called.length > 0); setLineDone(localStorage.getItem(`bingo-phase-${params.localId}`) === "bingo");
            setDrawStarted(Boolean(local.started));
          } else {
            setDrawStarted(false);
          }
        });
      fetch(`http://localhost:3000/games/${id}`, { headers: { Authorization: `Bearer ${token ?? ""}` } })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (data) setGame(data);
        })
        .catch(() => undefined);
      const drawSaved = localStorage.getItem(`bingo-draw-${params.localId}`);
      if (drawSaved) {
        try {
          const draw = JSON.parse(drawSaved);
          setLineDone(localStorage.getItem(`bingo-phase-${params.localId}`) === "bingo");
          if (draw?.started !== undefined) {
            setDrawStarted(Boolean(draw.started));
          }
        } catch {
          setLineDone(false);
        }
      } else {
        setLineDone(false);
      }
    };
    load();
    const timer = window.setInterval(load, 1000);
    return () => window.clearInterval(timer);
  }, [params.localId]);

  useEffect(() => {
    if (drawStarted) return;
    const timer = window.setInterval(() => setPrizeIndex((previous) => (previous + 1) % 2), 5000);
    return () => window.clearInterval(timer);
  }, [drawStarted]);

  const sectionRef = useRef<HTMLElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;
    const update = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const localHref = `/organizations/${params.id}/locals/${params.localId}`;
  const tubeBalls = useMemo(() => called.slice(0, -1).reverse(), [called]);
  const layout = useMemo(
    () => computeTubeLayout(tubeBalls.length, size.width, size.height),
    [tubeBalls.length, size.width, size.height],
  );
  const verticalWidth = layout
    ? layout.columns * layout.pitch - layout.gap + VPAD * 2
    : 2 * (BALL_MAX + GAP) - GAP + VPAD * 2;

  return (
    <main className="min-h-screen bg-slate-950 p-3 text-white sm:p-6">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">BINGO-WEB</p>
            <p className="text-sm text-slate-400">Tablero de números</p>
          </div>
          <Link href={localHref} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300">
            Volver al local
          </Link>
        </div>

        {winnerPopup&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"><div className="w-full max-w-5xl rounded-2xl border-2 border-yellow-400 bg-slate-950 p-5 text-white"><h2 className="text-center text-3xl font-black text-yellow-300">{winnerPopup.type==="line"?"PREMIO DE LÍNEA":"PREMIO DE BINGO"}</h2><p className="mt-2 text-center text-cyan-300">Cartones ganadores: {winnerPopup.cards.map(card=>card.cardNumber).join(", ")}</p><div className="mt-5 flex flex-wrap justify-center gap-5">{winnerPopup.cards.map(card=><div key={card.cardNumber} className="w-full max-w-2xl rounded-xl border-2 border-cyan-400/60 bg-white p-6 md:w-[calc(50%-0.625rem)]"><p className="mb-4 text-2xl font-black text-black">Cartón {card.cardNumber}</p>{card.grid.map((row,rowIndex)=>{const winRow=row.filter((n):n is number=>n!==null&&n!==undefined).length>0&&row.filter((n):n is number=>n!==null&&n!==undefined).every(n=>winnerPopup.called.includes(n));return <div key={rowIndex} className="grid grid-cols-9 gap-0">{row.map((n,col)=>{const called=n!==null&&n!==undefined&&winnerPopup.called.includes(n);const red=called&&(winnerPopup.type==="bingo"||(winnerPopup.type==="line"&&winRow));return <span key={`${rowIndex}-${col}`} className={`flex h-20 items-center justify-center rounded-none border border-black text-3xl font-black ${n===null||n===undefined?"bg-white text-blue-700":red?"bg-red-500 text-white":called?"bg-emerald-500 text-slate-950":"bg-white text-slate-950"}`}>{n??"🌐"}</span>})}</div>})}</div>)}</div></div></div>}        <section
          ref={sectionRef}
          className="relative overflow-hidden rounded-2xl border-2 border-slate-400 bg-slate-900 p-4 pt-40 pr-24 shadow-none sm:p-6 sm:pt-44 sm:pr-[168px]"
        >
          <div className="pointer-events-none absolute right-16 top-4 z-30 text-right">
            {game?.bingoAt && (
              <p className="text-base font-bold text-cyan-300">
                {formatDate(game.bingoAt)} - {formatTime(game.bingoAt)}
              </p>
            )}
            {drawStarted && (
              <p className="mt-1 text-xl font-black uppercase tracking-widest text-yellow-300">
                {lineDone ? "Para Bingo" : "Para Línea"}
              </p>
            )}
          </div>
          <div className="hidden">
            <div className="pointer-events-none absolute left-6 right-2 top-4 z-0 h-16 rounded-l-xl rounded-r-none bg-slate-950 shadow-[inset_0_2px_10px_rgba(0,0,0,0.7)]" />
            <div
              className="pointer-events-none absolute bottom-6 right-2 top-20 z-0 rounded-br-xl rounded-bl-xl rounded-tr-none rounded-tl-none bg-slate-950 shadow-[inset_0_2px_10px_rgba(0,0,0,0.7)]"
              style={{ width: verticalWidth }}
            />

            {tubeBalls.length === 0 && (
              <div className="pointer-events-none absolute left-6 right-2 top-4 z-10 flex h-16 items-center px-3 text-sm text-slate-500">
                Aún no se han extraído balotas.
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 z-10">
              {layout &&
                tubeBalls.map((number, index) => {
                  const position = layout.positions[index];
                  if (!position) return null;
                  return (
                    <span
                      key={number}
                      className="absolute left-0 top-0 transition-transform duration-500 ease-out will-change-transform"
                      style={{
                        width: layout.ball,
                        height: layout.ball,
                        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
                      }}
                    >
                      <span
                        className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 font-black leading-none tracking-tight text-white shadow-lg ring-1 ring-orange-200/80 ${
                          index === 0 ? "bingo-ball-enter" : ""
                        }`}
                        style={{ fontSize: Math.round(layout.ball * 0.46) }}
                      >
                        {number}
                      </span>
                    </span>
                  );
                })}
            </div>
          </div>

          <div
            className="pointer-events-none absolute bottom-6 right-[10px] z-10 flex flex-col items-center justify-start gap-1"
            style={{ top: "180px", width: verticalWidth + 22 }}
          >
            {called
              .slice(-8)
              .reverse()
              .map((number, index) => (
                <span
                  key={`${number}-${called.length - index}`}
                  className={`flex items-center justify-center rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 font-black text-white shadow-lg ring-1 ring-orange-200/80 ${
                    index === 0 ? "bingo-ball-enter" : ""
                  }`}
                  style={{
                    width: 88,
                    height: 88,
                    fontSize: 38,
                  }}
                >
                  {number}
                </span>
              ))}
          </div>

          <div className="pointer-events-none absolute inset-x-6 top-8 z-20 flex h-24 items-center">
            <div className="absolute left-0 mt-8 flex h-40 w-40 items-center justify-center rounded-full border-4 border-orange-500 bg-blue-400 text-6xl font-black text-red-500 shadow-lg sm:mt-8 sm:h-44 sm:w-44 sm:text-8xl">
              {current ?? "--"}
            </div>
            <div className="absolute left-[37%] flex -translate-x-1/2 items-center gap-4">
              <div className="flex min-h-[112px] min-w-[300px] max-w-[32vw] items-center justify-center rounded-2xl border-2 border-yellow-400 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-8 py-5 text-center shadow-[0_10px_60px_rgba(250,204,21,0.25)]">
                {lineDone || (!drawStarted && prizeIndex === 1) ? (
                  <div>
                    <p className="text-base font-black uppercase tracking-[0.4em] text-yellow-300">PREMIO BINGO</p>
                    <p className="mt-1 text-5xl font-black text-red-500 sm:text-6xl">
                      {game?.bingoPrize != null ? `$ ${formatMoney(game.bingoPrize)}` : "$ --"}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-base font-black uppercase tracking-[0.4em] text-yellow-300">PREMIO LÍNEA</p>
                    <p className="mt-1 text-5xl font-black text-red-500 sm:text-6xl">
                      {game?.linePrize != null ? `$ ${formatMoney(game.linePrize)}` : "$ --"}
                    </p>
                  </div>
                )}
              </div>
              <div className="absolute left-[calc(50%+250px)] flex items-center gap-2 sm:left-[calc(50%+280px)]">
                <div className="flex min-h-[120px] min-w-[150px] flex-col justify-center rounded-xl border border-slate-700 bg-slate-950 px-8 py-6 text-center">
                  <p className="text-lg font-black text-yellow-300">B.C.</p>
                  <p className="mt-1 text-6xl font-black text-red-500">{called.length}</p>
                </div>
                <div className="flex min-h-[120px] min-w-[150px] flex-col justify-center rounded-xl border border-slate-700 bg-slate-950 px-8 py-6 text-center">
                  <p className="text-lg font-black text-yellow-300">B.T.</p>
                  <p className="mt-1 text-6xl font-black text-red-500">--</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[150px_1fr]">
            <aside className="order-first flex flex-col items-center gap-3 pt-12 lg:items-start">
              <div className="relative h-[380px] w-[150px] overflow-hidden rounded-t-[40%] rounded-b-[16px] border-4 border-slate-600 bg-gradient-to-b from-slate-900 to-slate-950 shadow-[inset_0_16px_70px_rgba(0,0,0,0.9)]">
                {[1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49].map((n, i) => (
                  <span
                    key={`ball-${n}`}
                    className={`${game ? "bingo-bounce-real" : ""} pointer-events-none absolute flex h-8 w-8 items-center justify-center rounded-full bg-white text-[10px] font-black text-red-600 shadow-[0_4px_10px_rgba(0,0,0,0.6)] ring-1 ring-slate-300/80`}
                    style={{
                      left: `${(i % 4) * 26 + 16}px`,
                      top: game ? `${Math.floor(i / 4) * 36 + 70}px` : `${Math.floor(i / 4) * 38 + 210}px`,
                      animationDelay: game ? `${i * 0.05}s` : "0s",
                      animationDuration: game ? `${0.8 + (i % 6) * 0.14}s` : "0s",
                    }}
                  >
                    {n}
                  </span>
                ))}
                {[2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50].map((n, i) => (
                  <span
                    key={`ball2-${n}`}
                    className={`${game ? "bingo-bounce-real-alt" : ""} pointer-events-none absolute flex h-7 w-7 items-center justify-center rounded-full bg-white text-[9px] font-black text-red-600 shadow-[0_4px_10px_rgba(0,0,0,0.6)] ring-1 ring-slate-300/80`}
                    style={{
                      left: `${(i % 4) * 28 + 20}px`,
                      top: game ? `${Math.floor(i / 4) * 40 + 92}px` : `${Math.floor(i / 4) * 42 + 226}px`,
                      animationDelay: game ? `${i * 0.07}s` : "0s",
                      animationDuration: game ? `${0.9 + (i % 5) * 0.12}s` : "0s",
                    }}
                  >
                    {n}
                  </span>
                ))}
              </div>
            </aside>

              <div className="grid grid-cols-10 gap-0 overflow-hidden rounded-xl border-2 border-slate-300 bg-black">
              {Array.from({ length: 90 }, (_, index) => index + 1).map((number) => (
                <div
                  key={number}
                  className={`flex items-center justify-center border border-slate-700 px-0 py-[8px] font-black leading-none ${
                    number === current
                      ? "bg-[#D32F2F] text-[#A5F3FC]"
                      : called.includes(number)
                        ? "bg-[#FACC15] text-black"
                        : "bg-black text-slate-100"
                  }`}
                  style={{ fontSize: "clamp(1.5rem, 3.5vw, 4rem)" }}
                >
                  {number}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
