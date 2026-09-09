import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useRole } from "@/lib/RoleContext";
import { filterClientsByAccess } from "@/lib/roleAccess";
import { computeEditorPayouts, monthKey } from "@/lib/editorPayouts";
import { fmtMoney, fmtDate } from "@/lib/format";
import {
  Clapperboard, ExternalLink, CalendarDays, StickyNote, ArrowRight,
  CircleDollarSign, Loader2, Check, Inbox,
} from "lucide-react";

const FLOW = ["QUEUED", "EDITING", "REVIEW", "APPROVED", "POSTED"];

const STATUS_STYLE = {
  QUEUED: { bg: "rgba(120,120,128,0.18)", fg: "#98989F" },
  EDITING: { bg: "rgba(10,132,255,0.16)", fg: "#0A84FF" },
  REVIEW: { bg: "rgba(255,159,10,0.16)", fg: "#FF9F0A" },
  APPROVED: { bg: "rgba(191,90,242,0.16)", fg: "#BF5AF2" },
  POSTED: { bg: "rgba(48,209,88,0.16)", fg: "#30D158" },
};

const PLATFORM_LABEL = {
  YOUTUBE_SHORTS: "YT Shorts",
  TIKTOK: "TikTok",
  INSTAGRAM_REELS: "IG Reels",
  X: "X",
  LINKEDIN: "LinkedIn",
};

function nextStatus(current) {
  const i = FLOW.indexOf(current);
  if (i === -1 || i >= FLOW.length - 1) return null;
  return FLOW[i + 1];
}

export default function MyWork() {
  const { role, clientAccess, loading: roleLoading } = useRole();
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [clips, setClips] = useState([]);
  const [team, setTeam] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [advancingId, setAdvancingId] = useState(null);

  const ym = useMemo(() => monthKey(), []);

  useEffect(() => {
    let active = true;
    base44.auth.me().then((u) => { if (active) setUser(u); }).catch(() => {});
    return () => { active = false; };
  }, []);

  const load = useCallback(async () => {
    if (roleLoading || !clientAccess) return;
    setLoading(true);
    try {
      const allClients = await base44.entities.Client.list(500);
      const mine = filterClientsByAccess(allClients, role, clientAccess);
      setClients(mine);

      if (mine.length === 0) {
        setClips([]); setTeam([]); setPayouts([]);
        setLoading(false);
        return;
      }

      const [clipsByClient, teamByClient] = await Promise.all([
        Promise.all(mine.map((c) => base44.entities.Clip.filter({ client: c.id }, "-created_date", 500))),
        Promise.all(mine.map((c) => base44.entities.TeamMember.filter({ client: c.id }, "-created_date", 100))),
      ]);
      const allClips = clipsByClient.flat();
      const allTeam = teamByClient.flat();
      setClips(allClips);
      setTeam(allTeam);

      // Identify this editor's TeamMember by name match against the signed-in user.
      const myName = (user?.full_name || "").trim().toLowerCase();
      const myTeamMembers = myName
        ? allTeam.filter((t) => (t.name || "").trim().toLowerCase() === myName)
        : [];
      const myTeamIds = new Set(myTeamMembers.map((t) => t.id));

      if (myTeamIds.size > 0) {
        const payoutRows = await Promise.all(
          [...myTeamIds].map((tmId) =>
            base44.entities.EditorPayout.filter({ teamMember: tmId }, "-month", 50)
          )
        );
        setPayouts(payoutRows.flat());
      } else {
        setPayouts([]);
      }
    } catch {
      setClips([]); setTeam([]); setPayouts([]);
    } finally {
      setLoading(false);
    }
  }, [role, clientAccess, roleLoading, user]);

  useEffect(() => { load(); }, [load]);

  // Earnings this month (projected) from the payout engine.
  const earnings = useMemo(() => {
    const myName = (user?.full_name || "").trim().toLowerCase();
    const myTeam = myName
      ? team.filter((t) => (t.name || "").trim().toLowerCase() === myName)
      : [];
    if (myTeam.length === 0) return { owed: 0, clipsThisMonth: 0, paid: false, found: false };
    const byEditor = computeEditorPayouts(myTeam, clips, [], ym);
    let owed = 0;
    let clipsThisMonth = 0;
    for (const id of Object.keys(byEditor)) {
      owed += byEditor[id].owed || 0;
      clipsThisMonth += byEditor[id].clipsCount || 0;
    }
    const monthPayout = payouts.find((p) => p.month === ym);
    return {
      owed,
      clipsThisMonth,
      paid: !!monthPayout?.paid,
      paidDate: monthPayout?.paidDate || null,
      found: true,
      paymentType: myTeam[0]?.paymentType,
    };
  }, [team, clips, payouts, user, ym]);

  const clientMap = useMemo(() => {
    const m = {};
    for (const c of clients) m[c.id] = c;
    return m;
  }, [clients]);

  const myClips = useMemo(() => {
    return clips
      .filter((c) => c.status === "QUEUED" || c.status === "EDITING")
      .sort((a, b) => (a.scheduledDate || "9999").localeCompare(b.scheduledDate || "9999"));
  }, [clips]);

  async function advance(clip) {
    const ns = nextStatus(clip.status);
    if (!ns) return;
    setAdvancingId(clip.id);
    try {
      const patch = { status: ns, statusChangedAt: new Date().toISOString() };
      if (ns === "REVIEW" && (!clip.clientApproval || clip.clientApproval === "NOT_REQUIRED")) {
        patch.clientApproval = "PENDING";
      }
      await base44.entities.Clip.update(clip.id, patch);
      await load();
    } catch {
      /* ignore */
    } finally {
      setAdvancingId(null);
    }
  }

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight">My Work</h1>
        <p className="text-[15px] text-muted-foreground mt-1">
          Your queued and in-progress clips, deadlines, and earnings for this month.
        </p>
      </div>

      {/* Earnings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <CircleDollarSign className="w-[18px] h-[18px] text-muted-foreground" />
          <h2 className="text-[20px] font-semibold tracking-tight">Earnings — {ym}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Projected this month" value={fmtMoney(earnings.owed)} />
          <Stat label="Clips this month" value={String(earnings.clipsThisMonth)} />
          <Stat
            label="Payout status"
            value={earnings.found ? (earnings.paid ? "Paid" : "Pending") : "Not set up"}
            tone={earnings.found ? (earnings.paid ? "#30D158" : "#FF9F0A") : "#98989F"}
          />
          <Stat
            label="Pay type"
            value={earnings.paymentType
              ? earnings.paymentType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
              : "—"}
          />
        </div>
        {!earnings.found && (
          <p className="text-[13px] text-muted-foreground mt-4">
            No team member profile matches your account name yet. Ask a manager to add you as a Team Member
            using the exact name on your profile.
          </p>
        )}
      </div>

      {/* Clip queue */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clapperboard className="w-[18px] h-[18px] text-muted-foreground" />
          <h2 className="text-[20px] font-semibold tracking-tight">Your queue</h2>
          <span className="text-[13px] text-muted-foreground">{myClips.length}</span>
        </div>

        {myClips.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <Inbox className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-[15px] text-muted-foreground">
              No queued or in-progress clips assigned to your clients right now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {myClips.map((clip) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                client={clientMap[clip.client]}
                advancing={advancingId === clip.id}
                onAdvance={() => advance(clip)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-[12px] bg-background/50 border border-border p-4">
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div className="text-[20px] font-semibold tracking-tight mt-1" style={tone ? { color: tone } : undefined}>
        {value}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.QUEUED;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      {status}
    </span>
  );
}

function ClipCard({ clip, client, advancing, onAdvance }) {
  const ns = nextStatus(clip.status);
  const deadline = clip.scheduledDate;
  const overdue = deadline && new Date(deadline) < new Date(new Date().toDateString());
  const notes = client?.notes;

  return (
    <div className="glass-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold tracking-tight truncate">{clip.title}</div>
          <div className="text-[13px] text-muted-foreground truncate">{client?.name || "—"}</div>
        </div>
        <StatusPill status={clip.status} />
      </div>

      <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/70" />
          {PLATFORM_LABEL[clip.platform] || clip.platform}
        </span>
        <span className="inline-flex items-center gap-1" style={overdue ? { color: "#FF453A" } : undefined}>
          <CalendarDays className="w-3.5 h-3.5" />
          {deadline ? fmtDate(deadline) : "No deadline"}
          {overdue && " · overdue"}
        </span>
      </div>

      {clip.sourceVideoUrl && (
        <a
          href={clip.sourceVideoUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:opacity-80 w-fit"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Source video
        </a>
      )}

      {notes && (
        <div className="flex items-start gap-2 rounded-[10px] bg-background/40 border border-border p-2.5">
          <StickyNote className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[12px] text-muted-foreground line-clamp-3">{notes}</p>
        </div>
      )}

      <div className="mt-auto pt-1">
        <button
          onClick={onAdvance}
          disabled={!ns || advancing}
          className="w-full h-9 rounded-[10px] text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
        >
          {advancing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : ns ? (
            <>Advance to {ns} <ArrowRight className="w-4 h-4" /></>
          ) : (
            <><Check className="w-4 h-4" /> Final stage</>
          )}
        </button>
      </div>
    </div>
  );
}