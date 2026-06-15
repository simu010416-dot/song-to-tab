import { useEffect, useRef, useState } from "react";
import {
  checkAdvanced,
  transcribe,
  type Degree,
  type Engine,
  type Quantize,
  type TranscriptionResult,
} from "./api";
import TabView from "./TabView";

interface Opt<T> {
  id: T;
  title: string;
  desc: string;
}

const ENGINES: Opt<Engine>[] = [
  { id: "realistic", title: "务实", desc: "librosa 单声部旋律识别，稳定可用" },
  { id: "advanced", title: "进阶", desc: "basic-pitch 多声部识别（需安装）" },
];

const DEGREES: Opt<Degree>[] = [
  { id: "simple", title: "简化", desc: "只扒主旋律（单音）" },
  { id: "medium", title: "中等", desc: "旋律 + 主要和弦" },
  { id: "full", title: "完整", desc: "尽可能多的音符（进阶引擎更佳）" },
];

const QUANTS: Opt<Quantize>[] = [
  { id: "none", title: "不量化", desc: "保留原始时值" },
  { id: "quarter", title: "1/4 拍", desc: "对齐到四分音符" },
  { id: "eighth", title: "1/8 拍", desc: "对齐到八分音符" },
  { id: "sixteenth", title: "1/16 拍", desc: "对齐到十六分音符" },
];

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [engine, setEngine] = useState<Engine>("realistic");
  const [degree, setDegree] = useState<Degree>("simple");
  const [quant, setQuant] = useState<Quantize>("none");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [advancedOk, setAdvancedOk] = useState<boolean | null>(null);
  const [view, setView] = useState<"svg" | "ascii">("svg");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAdvanced().then(setAdvancedOk);
  }, []);

  const pickFile = (f: File | null | undefined) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
  };

  const run = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await transcribe(file, { engine, degree, quantize: quant });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const copyTab = () => {
    if (result?.ascii_tab) navigator.clipboard.writeText(result.ascii_tab);
  };

  const downloadTab = () => {
    if (!result?.ascii_tab) return;
    const blob = new Blob([result.ascii_tab], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(result.filename || "tab").replace(/\.[^.]+$/, "")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <header className="hero">
        <h1>
          听歌<span className="pick">扒谱</span>
        </h1>
        <p>上传音频，自动识别并生成吉他六线谱（TAB）</p>
      </header>

      {/* 上传区 */}
      <div className="panel">
        <div
          className={`dropzone ${drag ? "drag" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            pickFile(e.dataTransfer.files?.[0]);
          }}
        >
          <div className="big">🎵 点击或拖拽上传音频</div>
          <div className="sub">支持 mp3 / wav / m4a / flac / ogg（≤ 30MB）</div>
          {file && <div className="file">{file.name}</div>}
          <input
            ref={inputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg"
            style={{ display: "none" }}
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
        </div>
      </div>

      {/* 选项区 */}
      <div className="panel">
        <div className="controls">
          <div className="control">
            <h3>谱面类型</h3>
            <div className="segment">
              <div className="opt active">
                <div className="t">🎸 吉他六线谱 (TAB)</div>
                <div className="d">标准调弦 EADGBE</div>
              </div>
            </div>
          </div>

          <div className="control">
            <h3>扒谱引擎</h3>
            <div className="segment">
              {ENGINES.map((o) => {
                const disabled = o.id === "advanced" && advancedOk === false;
                return (
                  <div
                    key={o.id}
                    className={`opt ${engine === o.id ? "active" : ""} ${
                      disabled ? "disabled" : ""
                    }`}
                    onClick={() => !disabled && setEngine(o.id)}
                  >
                    <div className="t">
                      {o.title}
                      {o.id === "advanced" && (
                        <span className={`badge ${advancedOk ? "on" : ""}`}>
                          {advancedOk === null
                            ? "检测中"
                            : advancedOk
                            ? "可用"
                            : "未安装"}
                        </span>
                      )}
                    </div>
                    <div className="d">{o.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="control">
            <h3>扒谱程度</h3>
            <div className="segment">
              {DEGREES.map((o) => (
                <div
                  key={o.id}
                  className={`opt ${degree === o.id ? "active" : ""}`}
                  onClick={() => setDegree(o.id)}
                >
                  <div className="t">{o.title}</div>
                  <div className="d">{o.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="control">
            <h3>节奏量化</h3>
            <div className="segment">
              {QUANTS.map((o) => (
                <div
                  key={o.id}
                  className={`opt ${quant === o.id ? "active" : ""}`}
                  onClick={() => setQuant(o.id)}
                >
                  <div className="t">{o.title}</div>
                  <div className="d">{o.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="row" style={{ marginTop: 20 }}>
          <button className="btn" disabled={!file || loading} onClick={run}>
            {loading && <span className="spinner" />}
            {loading ? "正在扒谱…" : "开始扒谱"}
          </button>
          {loading && (
            <span style={{ color: "var(--muted)", fontSize: 13 }}>
              首次运行进阶引擎可能较慢（加载模型）
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="panel">
          <div className="error">⚠️ {error}</div>
        </div>
      )}

      {/* 结果区 */}
      {result && (
        <div className="panel">
          <div className="meta">
            <span>
              文件: <b>{result.filename}</b>
            </span>
            <span>
              速度: <b>{result.tempo.toFixed(0)} BPM</b>
            </span>
            <span>
              时长: <b>{result.duration.toFixed(1)}s</b>
            </span>
            <span>
              音符数: <b>{result.notes.length}</b>
            </span>
            <span>
              小节: <b>{result.measures}</b>
            </span>
            {result.chords.length > 0 && (
              <span>
                和弦: <b>{result.chords.length}</b>
              </span>
            )}
          </div>

          {result.warnings.map((w, i) => (
            <div className="warn" key={i}>
              ⚠ {w}
            </div>
          ))}

          <div className="tabs-switch">
            <button
              className={view === "svg" ? "active" : ""}
              onClick={() => setView("svg")}
            >
              可视化谱
            </button>
            <button
              className={view === "ascii" ? "active" : ""}
              onClick={() => setView("ascii")}
            >
              ASCII 六线谱
            </button>
            <div style={{ flex: 1 }} />
            <button className="btn ghost" onClick={copyTab}>
              复制
            </button>
            <button className="btn ghost" onClick={downloadTab}>
              下载 .txt
            </button>
          </div>

          {result.notes.length === 0 ? (
            <div className="warn">没有可显示的音符。</div>
          ) : view === "svg" ? (
            <TabView
              notes={result.notes}
              chords={result.chords}
              tuning={result.tuning}
              duration={result.duration}
            />
          ) : (
            <pre className="tab-ascii">{result.ascii_tab}</pre>
          )}
        </div>
      )}

      <footer>
        song-to-tab · 生成的谱子为辅助草稿，建议人工校对 · 单声部/主旋律识别最可靠
      </footer>
    </div>
  );
}
