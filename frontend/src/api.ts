export type Engine = "realistic" | "advanced";
export type Degree = "simple" | "chords" | "medium" | "full";
export type ChordComplexity = "rich" | "standard" | "simple" | "minimal";
export type Quantize = "none" | "quarter" | "eighth" | "sixteenth";
export type Separate = "none" | "no_vocals" | "vocals" | "other";

export interface Note {
  midi: number;
  name: string;
  start: number;
  end: number;
  velocity: number;
  string: number; // 0 = 低音E弦 ... 5 = 高音e弦
  fret: number;
}

export interface Chord {
  name: string;
  start: number;
  end: number;
}

export interface TranscriptionResult {
  engine: Engine;
  degree: Degree;
  chord_complexity: ChordComplexity;
  quantize: Quantize;
  separate: Separate;
  tempo: number;
  duration: number;
  sample_rate: number;
  tuning: string[];
  notes: Note[];
  chords: Chord[];
  measures: number;
  ascii_tab: string;
  ascii_tab_chords?: string;
  staff_musicxml: string;
  tab_musicxml: string;
  tab_musicxml_chords?: string;
  dual_musicxml: string;
  warnings: string[];
  filename?: string;
  processed_audio_base64?: string | null;
}

export interface SeparationResult {
  separate: Separate;
  duration: number;
  sample_rate: number;
  warnings: string[];
  filename?: string;
  processed_audio_base64?: string | null;
}

export interface TranscribeOptions {
  engine: Engine;
  degree: Degree;
  chord_complexity: ChordComplexity;
  quantize: Quantize;
  separate: Separate;
}

const API_BASE = "/api";

async function parseError(res: Response): Promise<string> {
  let detail = `请求失败 (${res.status})`;
  try {
    const data = await res.json();
    if (data?.detail) {
      detail =
        typeof data.detail === "string"
          ? data.detail
          : JSON.stringify(data.detail);
    }
  } catch {
    /* ignore */
  }
  return detail;
}

export async function transcribe(
  file: File,
  opts: TranscribeOptions
): Promise<TranscriptionResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("engine", opts.engine);
  form.append("degree", opts.degree);
  form.append("chord_complexity", opts.chord_complexity);
  form.append("quantize", opts.quantize);
  form.append("separate", opts.separate);

  const res = await fetch(`${API_BASE}/transcribe`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}

export async function separateAudio(
  file: File,
  mode: Exclude<Separate, "none">
): Promise<SeparationResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("separate", mode);

  const res = await fetch(`${API_BASE}/separate`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}

export interface Capabilities {
  advanced: boolean;
  separate: boolean;
}

export async function fetchSeparateCapability(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/capabilities/separate`);
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.available);
  } catch {
    return false;
  }
}

export async function fetchAdvancedCapability(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/capabilities/advanced`);
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data?.available);
  } catch {
    return false;
  }
}

export async function checkCapabilities(): Promise<Capabilities> {
  const [separate, advanced] = await Promise.all([
    fetchSeparateCapability(),
    fetchAdvancedCapability(),
  ]);
  return { separate, advanced };
}

/** @deprecated use checkCapabilities */
export async function checkAdvanced(): Promise<boolean> {
  const caps = await checkCapabilities();
  return caps.advanced;
}

export function separationResultToFile(
  result: SeparationResult,
  fallbackName = "separated.wav"
): File | null {
  const b64 = result.processed_audio_base64;
  if (!b64) return null;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const base = (result.filename || fallbackName).replace(/\.[^.]+$/, "");
  const mode = result.separate !== "none" ? result.separate : "separated";
  return new File([bytes], `${base}_${mode}.wav`, { type: "audio/wav" });
}
