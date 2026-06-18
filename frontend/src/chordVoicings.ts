import type { Instrument } from "./instruments";

const CHORD_RE = /^([A-G])([#b]?)(m(in(or)?)?)?$/i;

const ROOT_PC: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** 解析和弦名，与后端 staff.CHORD_RE 一致。 */
export function parseChordName(
  name: string
): { rootPc: number; minor: boolean } | null {
  const m = CHORD_RE.exec(name.trim());
  if (!m) return null;
  const step = m[1].toUpperCase();
  const acc = m[2];
  let rootPc = ROOT_PC[step];
  if (rootPc === undefined) return null;
  if (acc === "#") rootPc = (rootPc + 1) % 12;
  else if (acc === "b") rootPc = (rootPc + 11) % 12;
  return { rootPc, minor: Boolean(m[3]) };
}

/** 三和弦音程：根音、三度、五度（半音）。 */
function triadIntervals(minor: boolean): [number, number, number] {
  return minor ? [0, 3, 7] : [0, 4, 7];
}

/** 将 pitch class 放到 [baseMidi, baseMidi+11] 区间。 */
function pcToMidi(pc: number, baseMidi: number): number {
  const basePc = ((baseMidi % 12) + 12) % 12;
  let midi = baseMidi - basePc + pc;
  if (midi < baseMidi) midi += 12;
  return midi;
}

const BASE_MIDI: Record<Instrument, number> = {
  guitar: 48, // C3 附近
  ukulele: 55,
  piano: 60, // C4
};

/**
 * 和弦名 → 三音 MIDI 列表（根音在上）。
 * 试听用封闭三和弦，不模拟具体把位。
 */
export function chordNameToMidi(
  name: string,
  instrument: Instrument = "guitar"
): number[] {
  const parsed = parseChordName(name);
  if (!parsed) return [];

  const base = BASE_MIDI[instrument];
  const [i0, i1, i2] = triadIntervals(parsed.minor);
  const pcs = [
    (parsed.rootPc + i0) % 12,
    (parsed.rootPc + i1) % 12,
    (parsed.rootPc + i2) % 12,
  ];

  const rootMidi = pcToMidi(parsed.rootPc, base);
  const midis = [rootMidi];
  for (let k = 1; k < pcs.length; k++) {
    let m = pcToMidi(pcs[k], rootMidi);
    while (m <= midis[midis.length - 1]) m += 12;
    midis.push(m);
  }
  return midis;
}
