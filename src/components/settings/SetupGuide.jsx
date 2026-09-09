import React from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  INTEGRATIONS,
  saveCredentials,
  setClaudeEnabled,
  testIntegrationConnection,
} from "@/lib/integrations";
import {
  Clock,
  Copy,
  Check,
  Loader2,
  ListChecks,
  PlugZap,
  Eye,
  EyeOff,
} from "lucide-react";

function CopyBlock({ code }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="relative mt-2">
      <pre className="glass-card p-3 pr-10 text-[12px] font-mono whitespace-pre-wrap break-all">
        {code}
      </pre>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* ignore */
          }
        }}
        className="absolute right-2 top-2 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10"
        title="Copy"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5" style={{ color: "#30D158" }} />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

export default function SetupGuide({ integrationId, open, onClose, onTested }) {
  const integration = INTEGRATIONS.find((i) => i.id === integrationId);
  const [values, setValues] = React.useState({});
  const [show, setShow] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [testMsg, setTestMsg] = React.useState("");
  const [checks, setChecks] = React.useState({});

  React.useEffect(() => {
    if (!integrationId) return;
    try {
      const raw = localStorage.getItem(`guide_checks_${integrationId}`);
      if (raw) setChecks(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setValues({});
    setSaved(false);
    setTestMsg("");
  }, [integrationId]);

  function toggleCheck(idx) {
    setChecks((prev) => {
      const next = { ...prev, [idx]: !prev[idx] };
      localStorage.setItem(`guide_checks_${integrationId}`, JSON.stringify(next));
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      if (integration.id === "claude") {
        await setClaudeEnabled(true);
      } else {
        await saveCredentials(integration, values);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    setTesting(true);
    setTestMsg("");
    try {
      const res = await testIntegrationConnection(integration.id);
      setTestMsg(res.message || (res.success ? "Connected." : "Test failed."));
      onTested && onTested();
    } catch (e) {
      setTestMsg(e.message || "Test failed.");
    } finally {
      setTesting(false);
    }
  }

  if (!integration) return null;
  const Icon = integration.icon;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] overflow-y-auto glass-modal"
        style={{ borderLeft: "0.5px solid var(--border)" }}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: `${integration.color}22`, border: `0.5px solid ${integration.color}55` }}
            >
              <Icon className="w-5 h-5" style={{ color: integration.color }} />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold tracking-tight">{integration.name}</h2>
              <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                <Clock className="w-3 h-3" /> ~{integration.estMinutes} min
              </span>
            </div>
          </div>
          <p className="text-[13px] text-muted-foreground mb-5">{integration.description}</p>

          <h3 className="text-[14px] font-semibold mb-2">Steps</h3>
          <ol className="space-y-3 mb-5">
            {integration.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-white/10 text-[11px] font-semibold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium">{s.title}</div>
                  {s.body && (
                    <div className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">{s.body}</div>
                  )}
                  {s.code && <CopyBlock code={s.code} />}
                  {s.link && (
                    <a
                      href={s.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[12px] text-primary hover:underline mt-1 inline-block break-all"
                    >
                      {s.link}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {integration.id === "claude" ? (
            <div className="glass-card p-4 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium">Enable AI features</span>
                <button
                  onClick={save}
                  disabled={saving}
                  className="h-8 px-3 rounded-[9px] text-[13px] font-medium inline-flex items-center gap-1.5 disabled:opacity-40"
                  style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
                  {saved ? "Enabled" : "Enable"}
                </button>
              </div>
              <p className="text-[12px] text-muted-foreground mt-1">
                No API key needed — AI runs through Base44's built-in LLM.
              </p>
            </div>
          ) : (
            integration.credentialKeys.length > 0 && (
              <div className="glass-card p-4 mb-5 space-y-3">
                <h3 className="text-[14px] font-semibold">Credentials</h3>
                {integration.credentialKeys.map((f) => (
                  <div key={f.id}>
                    <label className="text-[12px] text-muted-foreground">{f.label}</label>
                    <div className="relative mt-1">
                      <input
                        type={show[f.id] ? "text" : "password"}
                        value={values[f.id] || ""}
                        onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
                        placeholder={`Paste your ${f.label}`}
                        className="w-full h-9 rounded-[9px] px-3 pr-9 text-[13px] outline-none"
                        style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid var(--border)" }}
                      />
                      <button
                        onClick={() => setShow((s) => ({ ...s, [f.id]: !s[f.id] }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {show[f.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={save}
                  disabled={saving || integration.credentialKeys.some((f) => !(values[f.id] || "").trim())}
                  className="h-9 px-4 rounded-[9px] text-[13px] font-medium inline-flex items-center gap-1.5 disabled:opacity-40"
                  style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}{" "}
                  {saved ? "Saved" : "Save credentials"}
                </button>
              </div>
            )
          )}

          <button
            onClick={test}
            disabled={testing}
            className="w-full h-9 rounded-[9px] text-[13px] font-medium inline-flex items-center justify-center gap-1.5 mb-2 disabled:opacity-40"
            style={{ border: "0.5px solid var(--border)" }}
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlugZap className="w-4 h-4" />} Test Connection
          </button>
          {testMsg && <div className="text-[12px] text-muted-foreground mb-3">{testMsg}</div>}

          <div className="mt-2">
            <div className="flex items-center gap-1.5 mb-2">
              <ListChecks className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-[14px] font-semibold">Checklist</h3>
            </div>
            <ul className="space-y-1.5">
              {integration.checklist.map((c, i) => (
                <li key={i}>
                  <button onClick={() => toggleCheck(i)} className="flex items-start gap-2 text-left w-full">
                    <span
                      className="w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: checks[i] ? "hsl(var(--primary))" : "transparent",
                        borderColor: "var(--border)",
                      }}
                    >
                      {checks[i] && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="text-[13px] text-muted-foreground">{c}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}