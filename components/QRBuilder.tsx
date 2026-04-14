"use client";

import { useEffect, useRef, useState } from "react";

type DotType = "rounded" | "dots" | "classy" | "classy-rounded" | "square" | "extra-rounded";
type CornerType = "square" | "extra-rounded" | "dot";
type AnimationType = "none" | "pulse" | "scan" | "glitch";

interface QROptions {
  dotType: DotType;
  cornerType: CornerType;
  fgColor: string;
  bgColor: string;
  logoUrl: string;
  animation: AnimationType;
}

const DOT_STYLES: { label: string; value: DotType }[] = [
  { label: "Square", value: "square" },
  { label: "Rounded", value: "rounded" },
  { label: "Dots", value: "dots" },
  { label: "Classy", value: "classy" },
  { label: "Classy+", value: "classy-rounded" },
  { label: "XL Round", value: "extra-rounded" },
];

const CORNER_STYLES: { label: string; value: CornerType }[] = [
  { label: "Square", value: "square" },
  { label: "Rounded", value: "extra-rounded" },
  { label: "Dot", value: "dot" },
];

const ANIMATIONS: { label: string; value: AnimationType }[] = [
  { label: "None", value: "none" },
  { label: "Pulse", value: "pulse" },
  { label: "Scan", value: "scan" },
  { label: "Glitch", value: "glitch" },
];

const PRESETS = [
  { label: "Ink", fg: "#0a0a0a", bg: "#f0ece4" },
  { label: "Void", fg: "#c8ff00", bg: "#080808" },
  { label: "Ghost", fg: "#ffffff", bg: "#111111" },
  { label: "Bone", fg: "#1a1a1a", bg: "#e8e0d0" },
  { label: "Neon", fg: "#00ffcc", bg: "#0a0a1a" },
];

export default function QRBuilder() {
  const qrRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qrInstance = useRef<any>(null);

  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [opts, setOpts] = useState<QROptions>({
    dotType: "rounded",
    cornerType: "extra-rounded",
    fgColor: "#c8ff00",
    bgColor: "#080808",
    logoUrl: "",
    animation: "none",
  });

  // Build qr-code-styling options
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildQROptions = (target: string): any => ({
    width: 300,
    height: 300,
    type: "svg",
    data: target,
    margin: 16,
    dotsOptions: {
      color: opts.fgColor,
      type: opts.dotType,
    },
    cornersSquareOptions: {
      color: opts.fgColor,
      type: opts.cornerType === "dot" ? "dot" : opts.cornerType,
    },
    cornersDotOptions: {
      color: opts.fgColor,
      type: opts.cornerType === "dot" ? "dot" : undefined,
    },
    backgroundOptions: {
      color: opts.bgColor,
    },
    ...(opts.logoUrl
      ? {
          image: opts.logoUrl,
          imageOptions: { crossOrigin: "anonymous", margin: 6 },
        }
      : {}),
  });

  const renderQR = async (target: string) => {
    if (!qrRef.current) return;
    qrRef.current.innerHTML = "";

    // Dynamic import (client-only)
    const QRCodeStyling = (await import("qr-code-styling")).default;
    const qr = new QRCodeStyling(buildQROptions(target));
    qrInstance.current = qr;
    qr.append(qrRef.current);
  };

  // Re-render whenever options change (if already generated)
  useEffect(() => {
    if (shortUrl && generated) {
      renderQR(shortUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts, shortUrl]);

  const handleGenerate = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setGenerated(false);

    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setShortUrl(data.shortUrl);
      setSlug(data.slug);
      setGenerated(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!qrInstance.current) return;
    await qrInstance.current.download({ name: `qr-${slug}`, extension: "png" });
  };

  const handleDownloadSVG = async () => {
    if (opts.animation !== "none") {
      const svgEl = qrRef.current?.querySelector("svg");
      if (!svgEl) return;

      const clone = svgEl.cloneNode(true) as SVGSVGElement;
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      while (clone.childNodes.length > 0) g.appendChild(clone.childNodes[0]);
      clone.appendChild(g);

      let css = "";
      switch (opts.animation) {
        case "pulse":
          css = `@keyframes p{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}g{animation:p 2.5s ease-in-out infinite;transform-origin:50% 50%;}`;
          break;
        case "scan": {
          css = `@keyframes s{0%{transform:translateY(-3px)}100%{transform:translateY(300px)}}line.scan{animation:s 2s linear infinite;}`;
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("class", "scan");
          line.setAttribute("x1", "0");
          line.setAttribute("y1", "0");
          line.setAttribute("x2", "300");
          line.setAttribute("y2", "0");
          line.setAttribute("stroke", opts.fgColor);
          line.setAttribute("stroke-width", "2");
          line.setAttribute("opacity", "0.5");
          clone.appendChild(line);
          break;
        }
        case "glitch":
          css = `@keyframes gl{0%,84%,90%,100%{transform:translate(0)}85%{transform:translate(-3px,1px) skewX(0.5deg)}86%{transform:translate(3px,-1px)}87%{transform:translate(-1px,2px)}88%{transform:translate(0)}}g{animation:gl 5s ease-in-out infinite;transform-origin:50% 50%;}`;
          break;
      }

      if (css) {
        const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
        style.textContent = css;
        clone.insertBefore(style, clone.firstChild);
      }

      const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
        type: "image/svg+xml",
      });
      const urlObj = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = `qr-${slug}-animated.svg`;
      a.href = urlObj;
      a.click();
      URL.revokeObjectURL(urlObj);
    } else if (qrInstance.current) {
      await qrInstance.current.download({ name: `qr-${slug}`, extension: "svg" });
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setPreset = (fg: string, bg: string) => {
    setOpts((o) => ({ ...o, fgColor: fg, bgColor: bg }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setOpts((o) => ({ ...o, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logoBlock}>
          <span style={styles.logo}>QRCUSTO</span>
          <span style={styles.tagline}>QR codes, but yours.</span>
        </div>
        <div style={styles.headerRule} />
      </header>

      <main className="qr-main" style={styles.main}>
        {/* Left — Controls */}
        <div style={styles.panel}>
          {/* URL Input */}
          <section style={styles.section}>
            <label>Destination URL</label>
            <div style={styles.inputRow}>
              <input
                type="url"
                placeholder="https://your-link.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
              <button
                onClick={handleGenerate}
                disabled={loading || !url.trim()}
                style={{
                  ...styles.btnPrimary,
                  opacity: loading || !url.trim() ? 0.4 : 1,
                }}
              >
                {loading ? "..." : "GEN"}
              </button>
            </div>
            {error && <p style={styles.error}>{error}</p>}
          </section>

          {/* Dot Style */}
          <section style={styles.section}>
            <label>Dot Style</label>
            <div style={styles.chipGrid}>
              {DOT_STYLES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setOpts((o) => ({ ...o, dotType: d.value }))}
                  style={{
                    ...styles.chip,
                    ...(opts.dotType === d.value ? styles.chipActive : {}),
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </section>

          {/* Corner Style */}
          <section style={styles.section}>
            <label>Corner Style</label>
            <div style={styles.chipGrid}>
              {CORNER_STYLES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setOpts((o) => ({ ...o, cornerType: c.value }))}
                  style={{
                    ...styles.chip,
                    ...(opts.cornerType === c.value ? styles.chipActive : {}),
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </section>

          {/* Color Presets */}
          <section style={styles.section}>
            <label>Color Presets</label>
            <div style={styles.chipGrid}>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setPreset(p.fg, p.bg)}
                  style={{
                    ...styles.presetBtn,
                    background: p.bg,
                    color: p.fg,
                    border:
                      opts.fgColor === p.fg && opts.bgColor === p.bg
                        ? `1px solid ${p.fg}`
                        : "1px solid #333",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </section>

          {/* Custom Colors */}
          <section style={styles.section}>
            <label>Custom Colors</label>
            <div style={styles.colorRow}>
              <div style={styles.colorField}>
                <span style={styles.colorLabel}>FG</span>
                <input
                  type="color"
                  value={opts.fgColor}
                  onChange={(e) => setOpts((o) => ({ ...o, fgColor: e.target.value }))}
                  style={styles.colorPicker}
                />
                <span style={{ ...styles.colorHex, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {opts.fgColor}
                </span>
              </div>
              <div style={styles.colorField}>
                <span style={styles.colorLabel}>BG</span>
                <input
                  type="color"
                  value={opts.bgColor}
                  onChange={(e) => setOpts((o) => ({ ...o, bgColor: e.target.value }))}
                  style={styles.colorPicker}
                />
                <span style={{ ...styles.colorHex, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {opts.bgColor}
                </span>
              </div>
            </div>
          </section>

          {/* Logo */}
          <section style={styles.section}>
            <label>Logo (optional)</label>
            <div style={styles.logoRow}>
              <input
                type="text"
                placeholder="https://example.com/logo.png"
                value={opts.logoUrl.startsWith("data:") ? "" : opts.logoUrl}
                onChange={(e) => setOpts((o) => ({ ...o, logoUrl: e.target.value }))}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={styles.btnGhost}
              >
                UPLOAD
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </div>
            {opts.logoUrl && (
              <button
                type="button"
                onClick={() => {
                  setOpts((o) => ({ ...o, logoUrl: "" }));
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                style={{ ...styles.btnGhost, marginTop: 8, padding: "6px 12px", fontSize: 10 }}
              >
                CLEAR LOGO
              </button>
            )}
          </section>

          {/* Animation */}
          <section style={styles.section}>
            <label>Animation</label>
            <div style={styles.chipGrid}>
              {ANIMATIONS.map((a) => (
                <button
                  key={a.value}
                  onClick={() => setOpts((o) => ({ ...o, animation: a.value }))}
                  style={{
                    ...styles.chip,
                    ...(opts.animation === a.value ? styles.chipActive : {}),
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right — Preview */}
        <div className="qr-preview" style={styles.preview}>
          <div
            className={opts.animation !== "none" ? `qr-anim-${opts.animation}` : undefined}
            style={{
              ...styles.qrWrap,
              background: generated ? opts.bgColor : "#111",
              color: opts.fgColor,
            }}
          >
            {!generated && (
              <div style={styles.placeholder}>
                <span style={styles.placeholderText}>YOUR QR</span>
                <span style={styles.placeholderSub}>paste a URL → GEN</span>
              </div>
            )}
            <div
              ref={qrRef}
              style={{ display: generated ? "block" : "none" }}
            />
          </div>

          {generated && (
            <>
              <div style={styles.shortUrlBox}>
                <span style={styles.shortUrlText}>{shortUrl}</span>
                <button onClick={handleCopy} style={styles.btnGhost}>
                  {copied ? "COPIED" : "COPY"}
                </button>
              </div>

              <div style={styles.downloadRow}>
                <button onClick={handleDownload} style={styles.btnPrimary}>
                  ↓ PNG
                </button>
                <button onClick={handleDownloadSVG} style={styles.btnGhost}>
                  ↓ {opts.animation !== "none" ? "ANIM" : "SVG"}
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <footer style={styles.footer}>
        <span>© {new Date().getFullYear()} QRCUSTO</span>
        <span style={{ color: "#333" }}>—</span>
        <span style={{ color: "#444" }}>FREE. NO TRACKING. NO ADS.</span>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 24px",
  },
  header: {
    paddingTop: 40,
    paddingBottom: 32,
  },
  logoBlock: {
    display: "flex",
    alignItems: "baseline",
    gap: 16,
    marginBottom: 24,
  },
  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 52,
    letterSpacing: "0.04em",
    color: "#f0ece4",
    lineHeight: 1,
  },
  tagline: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    color: "#555",
    letterSpacing: "0.08em",
  },
  headerRule: {
    height: 1,
    background: "#1e1e1e",
  },
  main: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    gap: 48,
    paddingTop: 40,
    paddingBottom: 40,
  },
  panel: {
    display: "flex",
    flexDirection: "column",
    gap: 32,
  },
  section: {
    display: "flex",
    flexDirection: "column",
  },
  inputRow: {
    display: "flex",
    gap: 8,
  },
  logoRow: {
    display: "flex",
    gap: 8,
  },
  chipGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    background: "transparent",
    border: "1px solid #222",
    color: "#888",
    padding: "7px 14px",
    fontSize: 11,
    letterSpacing: "0.06em",
  },
  chipActive: {
    border: "1px solid #c8ff00",
    color: "#c8ff00",
    background: "rgba(200,255,0,0.06)",
  },
  presetBtn: {
    padding: "7px 14px",
    fontSize: 11,
    letterSpacing: "0.06em",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  colorRow: {
    display: "flex",
    gap: 24,
  },
  colorField: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  colorLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: "#555",
    letterSpacing: "0.1em",
  },
  colorPicker: {
    width: 32,
    height: 32,
    border: "1px solid #222",
    background: "none",
    cursor: "pointer",
    padding: 2,
  },
  colorHex: {
    fontSize: 12,
    color: "#666",
  },
  preview: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    position: "sticky",
    top: 40,
    alignSelf: "flex-start",
  },
  qrWrap: {
    width: 300,
    height: 300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s",
  },
  placeholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    border: "1px dashed #222",
    width: "100%",
    height: "100%",
    justifyContent: "center",
  },
  placeholderText: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 36,
    color: "#222",
    letterSpacing: "0.1em",
  },
  placeholderSub: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: "#333",
    letterSpacing: "0.06em",
  },
  shortUrlBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: 300,
    border: "1px solid #1e1e1e",
    padding: "10px 12px",
    gap: 8,
  },
  shortUrlText: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: "#888",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
  downloadRow: {
    display: "flex",
    gap: 8,
    width: 300,
  },
  btnPrimary: {
    background: "#c8ff00",
    color: "#080808",
    border: "none",
    padding: "12px 20px",
    fontWeight: 500,
    flex: 1,
  },
  btnGhost: {
    background: "transparent",
    border: "1px solid #222",
    color: "#888",
    padding: "12px 20px",
  },
  error: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: "#ff4444",
    marginTop: 8,
  },
  footer: {
    display: "flex",
    gap: 16,
    padding: "24px 0",
    borderTop: "1px solid #1a1a1a",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: "#333",
    letterSpacing: "0.06em",
  },
};
