"use client";

import { useEffect, useRef, useState } from "react";

type DotType = "rounded" | "dots" | "classy" | "classy-rounded" | "square" | "extra-rounded";
type CornerType = "square" | "extra-rounded" | "dot";
type AnimationType = "none" | "pulse" | "scan" | "glitch" | "bounce" | "spin" | "fade" | "float" | "shake";
type AnimSpeed = "slow" | "normal" | "fast";
type AnimIntensity = "subtle" | "normal" | "strong";

interface QROptions {
  dotType: DotType;
  cornerType: CornerType;
  fgColor: string;
  bgColor: string;
  logoUrl: string;
  animation: AnimationType;
  animSpeed: AnimSpeed;
  animIntensity: AnimIntensity;
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
  { label: "Bounce", value: "bounce" },
  { label: "Spin", value: "spin" },
  { label: "Float", value: "float" },
  { label: "Fade", value: "fade" },
  { label: "Shake", value: "shake" },
  { label: "Scan", value: "scan" },
  { label: "Glitch", value: "glitch" },
];

const ANIM_SPEEDS: { label: string; value: AnimSpeed }[] = [
  { label: "Slow", value: "slow" },
  { label: "Normal", value: "normal" },
  { label: "Fast", value: "fast" },
];

const ANIM_INTENSITIES: { label: string; value: AnimIntensity }[] = [
  { label: "Subtle", value: "subtle" },
  { label: "Normal", value: "normal" },
  { label: "Strong", value: "strong" },
];

const PRESETS = [
  { label: "Ink", fg: "#1a1a1a", bg: "#fafaf8" },
  { label: "Midnight", fg: "#fafaf8", bg: "#1a1a1a" },
  { label: "Ocean", fg: "#0066cc", bg: "#f0f4f8" },
  { label: "Berry", fg: "#8b1a4a", bg: "#fdf2f5" },
  { label: "Forest", fg: "#1a5c2a", bg: "#f0f5f1" },
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
    fgColor: "#1a1a1a",
    bgColor: "#fafaf8",
    logoUrl: "",
    animation: "none",
    animSpeed: "normal",
    animIntensity: "normal",
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

      const speedMap = { slow: 2, normal: 1, fast: 0.5 };
      const intensityMap = { subtle: 0.5, normal: 1, strong: 1.8 };
      const sp = speedMap[opts.animSpeed];
      const it = intensityMap[opts.animIntensity];

      let css = "";
      switch (opts.animation) {
        case "pulse": {
          const s = 1 + 0.04 * it;
          css = `@keyframes p{0%,100%{transform:scale(1)}50%{transform:scale(${s})}}g{animation:p ${2.5*sp}s ease-in-out infinite;transform-origin:50% 50%;}`;
          break;
        }
        case "bounce": {
          const s = 1 + 0.08 * it;
          css = `@keyframes b{0%,100%{transform:scale(1) translateY(0)}40%{transform:scale(1,${1-0.04*it}) translateY(${4*it}px)}55%{transform:scale(${s}) translateY(${-8*it}px)}70%{transform:scale(1) translateY(0)}}g{animation:b ${1.2*sp}s ease-in-out infinite;transform-origin:50% 100%;}`;
          break;
        }
        case "spin":
          css = `@keyframes sp{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}g{animation:sp ${3*sp}s linear infinite;transform-origin:50% 50%;}`;
          break;
        case "float": {
          const d = 6 * it;
          css = `@keyframes f{0%,100%{transform:translateY(0)}50%{transform:translateY(${-d}px)}}g{animation:f ${3*sp}s ease-in-out infinite;transform-origin:50% 50%;}`;
          break;
        }
        case "fade":
          css = `@keyframes fa{0%,100%{opacity:1}50%{opacity:${Math.max(0.1,1-0.6*it)}}}g{animation:fa ${2.5*sp}s ease-in-out infinite;}`;
          break;
        case "shake": {
          const d = 3 * it;
          css = `@keyframes sh{0%,100%{transform:translateX(0)}10%{transform:translateX(${-d}px)}20%{transform:translateX(${d}px)}30%{transform:translateX(${-d}px)}40%{transform:translateX(${d}px)}50%{transform:translateX(0)}}g{animation:sh ${0.8*sp}s ease-in-out infinite;transform-origin:50% 50%;}`;
          break;
        }
        case "scan": {
          css = `@keyframes s{0%{transform:translateY(-3px)}100%{transform:translateY(300px)}}line.scan{animation:s ${2*sp}s linear infinite;}`;
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("class", "scan");
          line.setAttribute("x1", "0");
          line.setAttribute("y1", "0");
          line.setAttribute("x2", "300");
          line.setAttribute("y2", "0");
          line.setAttribute("stroke", opts.fgColor);
          line.setAttribute("stroke-width", String(1 + it));
          line.setAttribute("opacity", String(0.3 + 0.2 * it));
          clone.appendChild(line);
          break;
        }
        case "glitch": {
          const d = 3 * it;
          css = `@keyframes gl{0%,84%,90%,100%{transform:translate(0)}85%{transform:translate(${-d}px,${d*0.3}px) skewX(${0.5*it}deg)}86%{transform:translate(${d}px,${-d*0.3}px)}87%{transform:translate(${-d*0.3}px,${d*0.6}px)}88%{transform:translate(0)}}g{animation:gl ${5*sp}s ease-in-out infinite;transform-origin:50% 50%;}`;
          break;
        }
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
                type="text"
                placeholder="your-link.com"
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
            {opts.animation !== "none" && (
              <div style={{ display: "flex", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
                <div>
                  <label style={{ marginBottom: 6 }}>Speed</label>
                  <div style={styles.chipGrid}>
                    {ANIM_SPEEDS.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setOpts((o) => ({ ...o, animSpeed: s.value }))}
                        style={{
                          ...styles.chip,
                          padding: "5px 10px",
                          fontSize: 10,
                          ...(opts.animSpeed === s.value ? styles.chipActive : {}),
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ marginBottom: 6 }}>Intensity</label>
                  <div style={styles.chipGrid}>
                    {ANIM_INTENSITIES.map((i) => (
                      <button
                        key={i.value}
                        onClick={() => setOpts((o) => ({ ...o, animIntensity: i.value }))}
                        style={{
                          ...styles.chip,
                          padding: "5px 10px",
                          fontSize: 10,
                          ...(opts.animIntensity === i.value ? styles.chipActive : {}),
                        }}
                      >
                        {i.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right — Preview */}
        <div className="qr-preview" style={styles.preview}>
          <div
            className={opts.animation !== "none" ? `qr-anim-${opts.animation} qr-speed-${opts.animSpeed} qr-intensity-${opts.animIntensity}` : undefined}
            style={{
              ...styles.qrWrap,
              background: generated ? opts.bgColor : "#dedad2",
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
        <span style={{ color: "#aaa" }}>—</span>
        <span style={{ color: "#888" }}>FREE. NO TRACKING. NO ADS.</span>
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
    paddingBottom: 12,
  },
  logoBlock: {
    display: "flex",
    alignItems: "baseline",
    gap: 16,
    marginBottom: 12,
    flexWrap: "nowrap",
  },
  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 56,
    letterSpacing: "0.04em",
    color: "#1a1a1a",
    lineHeight: 1,
    borderLeft: "5px solid #1a1a1a",
    paddingLeft: 12,
  },
  tagline: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 13,
    color: "#666",
    letterSpacing: "0.06em",
    whiteSpace: "nowrap",
  },
  headerRule: {
    height: 3,
    background: "#1a1a1a",
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
    gap: 28,
    border: "3px solid #1a1a1a",
    padding: 28,
  },
  section: {
    display: "flex",
    flexDirection: "column",
  },
  inputRow: {
    display: "flex",
    gap: 0,
  },
  logoRow: {
    display: "flex",
    gap: 0,
  },
  chipGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    background: "transparent",
    border: "2px solid #aaa",
    color: "#666",
    padding: "8px 14px",
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.06em",
  },
  chipActive: {
    border: "2px solid #1a1a1a",
    color: "#fff",
    background: "#1a1a1a",
  },
  presetBtn: {
    padding: "8px 14px",
    fontSize: 11,
    letterSpacing: "0.06em",
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 500,
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
    color: "#666",
    letterSpacing: "0.1em",
    fontWeight: 500,
  },
  colorPicker: {
    width: 32,
    height: 32,
    border: "2px solid #1a1a1a",
    background: "none",
    cursor: "pointer",
    padding: 2,
  },
  colorHex: {
    fontSize: 12,
    color: "#888",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  preview: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 0,
    position: "sticky",
    top: 40,
    alignSelf: "flex-start",
    border: "3px solid #1a1a1a",
  },
  qrWrap: {
    width: 340,
    height: 340,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s",
    padding: 20,
  },
  placeholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    border: "2px dashed #aaa",
    width: "100%",
    height: "100%",
    justifyContent: "center",
  },
  placeholderText: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 36,
    color: "#bbb",
    letterSpacing: "0.1em",
  },
  placeholderSub: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: "#aaa",
    letterSpacing: "0.06em",
  },
  shortUrlBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    borderTop: "3px solid #1a1a1a",
    padding: "12px 16px",
    gap: 8,
  },
  shortUrlText: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: "#666",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
  downloadRow: {
    display: "flex",
    gap: 0,
    width: "100%",
    borderTop: "3px solid #1a1a1a",
  },
  btnPrimary: {
    background: "#1a1a1a",
    color: "#e8e4de",
    border: "none",
    padding: "14px 20px",
    fontWeight: 500,
    flex: 1,
    fontSize: 12,
  },
  btnGhost: {
    background: "transparent",
    border: "none",
    borderLeft: "3px solid #1a1a1a",
    color: "#666",
    padding: "14px 20px",
    fontWeight: 500,
    fontSize: 12,
  },
  error: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: "#d93025",
    marginTop: 8,
    fontWeight: 500,
  },
  footer: {
    display: "flex",
    gap: 16,
    padding: "24px 0",
    borderTop: "3px solid #1a1a1a",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: "#888",
    letterSpacing: "0.06em",
  },
};
