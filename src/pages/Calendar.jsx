import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { fmtMoney } from "@/lib/format";
import MonthGrid from "@/components/calendar/MonthGrid";
import ContentCalendar from "@/components/calendar/ContentCalendar";
import CadencePanel from "@/components/calendar/CadencePanel";
import ScheduleClipModal from "@/components/calendar/ScheduleClipModal";
import { ChevronLeft, ChevronRight, Wallet, CalendarDays } from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function Calendar() {
  const [view, setView] = useState("payments"); // "payments" | "content"
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [clips, setClips] = useState([]);
  const [cadence, setCadence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  async function load() {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        base44.entities.Payment.list("-dueDate", 1000),
        base44.entities.Client.list("-created_date", 200),
      ]);
      setPayments(p || []);
      setClients(c || []);
      if (view === "content") {
        const [cl, ca] = await Promise.all([
          base44.entities.Clip.list("-created_date", 3000),
          base44.entities.PostingCadence.list("-created_date", 500),
        ]);
        setClips(cl || []);
        setCadence(ca || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function switchView(v) {
    if (v === view) return;
    setView(v);
    if (v === "content" && clips.length === 0) {
      try {
        const [cl, ca] = await Promise.all([
          base44.entities.Clip.list("-created_date", 3000),
          base44.entities.PostingCadence.list("-created_date", 500),
        ]);
        setClips(cl || []);
        setCadence(ca || []);
      } catch {
        /* ignore */
      }
    }
  }

  const clientMap = useMemo(() => {
    const m = {};
    for (const c of clients) m[c.id] = c;
    return m;
  }, [clients]);

  const paymentsByDate = useMemo(() => {
    const m = {};
    for (const p of payments) {
      if (!p.dueDate) continue;
      const key = String(p.dueDate).slice(0, 10);
      (m[key] = m[key] || []).push(p);
    }
    return m;
  }, [payments]);

  const cashCollected = useMemo(
    () => payments.filter((p) => p.status === "PAID").reduce((s, p) => s + (p.amount || 0), 0),
    [payments]
  );

  const monthKey = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
  const monthCollected = useMemo(
    () =>
      payments
        .filter((p) => p.status === "PAID" && p.dueDate && String(p.dueDate).slice(0, 7) === monthKey)
        .reduce((s, p) => s + (p.amount || 0), 0),
    [payments, monthKey]
  );

  const monthClips = useMemo(
    () =>
      clips.filter((c) => {
        const d = c.postedDate || c.scheduledDate;
        return d && String(d).slice(0, 7) === monthKey;
      }),
    [clips, monthKey]
  );

  async function toggle(p) {
    const wasPaid = p.status === "PAID";
    const today = new Date().toISOString().slice(0, 10);
    const updated = await base44.entities.Payment.update(p.id, {
      status: wasPaid ? "PENDING" : "PAID",
      paidDate: wasPaid ? null : today,
    });
    setPayments((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...updated } : x)));
  }

  function move(delta) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight">Calendar</h1>
          <p className="text-[15px] text-muted-foreground mt-1">
            {view === "payments"
              ? "Payment schedule — click a client on their due day to mark it collected."
              : "Scheduled and posted clips — color-coded by platform, per client per day."}
          </p>
        </div>
        {view === "payments" && (
          <div className="glass-card px-5 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(48,209,88,0.14)" }}>
              <Wallet className="w-4 h-4" style={{ color: "#30D158" }} />
            </div>
            <div>
              <div className="text-[12px] text-muted-foreground">Cash collected (all-time)</div>
              <div className="text-[20px] font-semibold tracking-tight tabular-nums">{fmtMoney(cashCollected)}</div>
            </div>
          </div>
        )}
      </div>

      {/* View toggle */}
      <div className="inline-flex rounded-[12px] p-0.5" style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid var(--border)" }}>
        <button
          onClick={() => switchView("payments")}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-[13px] font-medium transition-colors"
          style={view === "payments" ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } : { color: "hsl(var(--muted-foreground))" }}
        >
          <Wallet className="w-4 h-4" /> Payments
        </button>
        <button
          onClick={() => switchView("content")}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-[13px] font-medium transition-colors"
          style={view === "content" ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } : { color: "hsl(var(--muted-foreground))" }}
        >
          <CalendarDays className="w-4 h-4" /> Content
        </button>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => move(-1)}
          className="inline-flex items-center gap-1 h-9 px-3 rounded-[10px] text-[13px] font-medium hover:bg-white/5"
          style={{ border: "0.5px solid var(--border)" }}
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        <h2 className="text-[17px] font-semibold tracking-tight">
          {MONTHS[cursor.month]} {cursor.year}
        </h2>
        <button
          onClick={() => move(1)}
          className="inline-flex items-center gap-1 h-9 px-3 rounded-[10px] text-[13px] font-medium hover:bg-white/5"
          style={{ border: "0.5px solid var(--border)" }}
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {view === "payments" ? (
        <>
          <MonthGrid
            year={cursor.year}
            month={cursor.month}
            paymentsByDate={paymentsByDate}
            clientMap={clientMap}
            onToggle={toggle}
          />
          {monthCollected > 0 && (
            <p className="text-[13px] text-muted-foreground">
              Collected in {MONTHS[cursor.month]}:{" "}
              <span className="font-medium text-foreground">{fmtMoney(monthCollected)}</span>
            </p>
          )}
        </>
      ) : (
        <>
          <ContentCalendar
            year={cursor.year}
            month={cursor.month}
            clips={monthClips}
            clientMap={clientMap}
            onSchedule={() => setScheduleOpen(true)}
          />
          <CadencePanel
            clients={clients}
            cadence={cadence}
            clips={clips}
            onSaved={load}
          />
        </>
      )}

      <ScheduleClipModal
        open={scheduleOpen}
        clients={clients}
        onClose={() => setScheduleOpen(false)}
        onSaved={() => { setScheduleOpen(false); load(); }}
      />
    </div>
  );
}