import React, { useState, useRef, useEffect } from "react";
import { X, Download } from "lucide-react";

const FONTS = ["Inter, sans-serif", "Georgia, serif", "Impact, sans-serif", "Courier New, monospace"];

export default function TextOverlayEditor({ imageUrl, onClose }) {
  const containerRef = useRef(null);
  const [text, setText] = useState("YOUR TITLE");
  const [size, setSize] = useState(64);
  const [color, setColor] = useState("#FFFFFF");
  const [bold, setBold] = useState(true);
  const [font, setFont] = useState(FONTS[2]);
  const [pos, setPos] = useState({ x: 0.5, y: 0.85 });
  const [dragging, setDragging] = useState(false);
  const [natural, setNatural] = useState({ w: 1280, h: 720 });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageUrl;
  }, [imageUrl]);

  function onPointerDown(e) {
    setDragging(true);
    updatePos(e);
  }
  useEffect(() => {
    if (!dragging) return;
    const move = (e) => updatePos(e);
    const up = () => setDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [dragging]);

  function updatePos(e) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    setPos({ x, y });
  }

  function save() {
    const canvas = document.createElement("canvas");
    canvas.width = natural.w;
    canvas.height = natural.h;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        ctx.drawImage(img, 0, 0, natural.w, natural.h);
        ctx.font = `${bold ? "bold " : ""}${Math.round(size * (natural.h / 360))}px ${font}`;
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 12;
        ctx.fillText(text, pos.x * natural.w, pos.y * natural.h);
        const u = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = u;
        a.download = `thumbnail-composite-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {
        alert("This image's server blocks canvas export. Try downloading the image and editing locally.");
      }
    };
    img.onerror = () => alert("Could not load the image for export.");
    img.src = imageUrl;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="glass-modal w-full max-w-3xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-semibold tracking-tight">Add text overlay</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div ref={containerRef} className="relative w-full mb-4 rounded-xl overflow-hidden select-none" style={{ aspectRatio: "16 / 9", background: "#000" }}>
          <img src={imageUrl} alt="base" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
          <div
            onMouseDown={onPointerDown}
            className="absolute cursor-move whitespace-nowrap"
            style={{
              left: `${pos.x * 100}%`,
              top: `${pos.y * 100}%`,
              transform: "translate(-50%, -50%)",
              fontSize: size,
              color,
              fontWeight: bold ? 700 : 400,
              fontFamily: font,
              textShadow: "0 2px 12px rgba(0,0,0,0.6)",
              userSelect: "none",
            }}
          >
            {text || "YOUR TITLE"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Overlay text"
            className="h-9 rounded-[8px] px-3 text-[14px] bg-transparent outline-none"
            style={{ border: "0.5px solid var(--border)", background: "rgba(255,255,255,0.04)" }}
          />
          <select value={font} onChange={(e) => setFont(e.target.value)} className="h-9 rounded-[8px] px-3 text-[14px] bg-transparent outline-none" style={{ border: "0.5px solid var(--border)", background: "rgba(255,255,255,0.04)" }}>
            {FONTS.map((f) => <option key={f} value={f}>{f.split(",")[0]}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground w-12">Size</span>
            <input type="range" min={20} max={140} value={size} onChange={(e) => setSize(+e.target.value)} className="flex-1" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground w-12">Color</span>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded bg-transparent" />
            <button onClick={() => setBold((b) => !b)} className="h-8 px-3 rounded-[8px] text-[13px] font-bold" style={{ border: "0.5px solid var(--border)", background: bold ? "rgba(10,132,255,0.18)" : "transparent" }}>B</button>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="h-9 px-4 rounded-[8px] text-[13px] font-medium hover:bg-white/10">Cancel</button>
          <button onClick={save} className="h-9 px-4 rounded-[8px] text-[13px] font-medium inline-flex items-center gap-1.5" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
            <Download className="w-4 h-4" /> Save composite
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">Drag the text to position it. The composite is downloaded as a PNG.</p>
      </div>
    </div>
  );
}