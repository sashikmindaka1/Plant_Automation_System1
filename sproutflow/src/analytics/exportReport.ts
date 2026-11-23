// Care Summary export (weekly or monthly): CSV file and PDF, both handed to the system share sheet.

import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';

import { buildCsv, buildReportHtml, periodName } from './analyticsMath';
import type { AnalyticsSummary, MoistureRange } from './types';

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Local date and time for file names, e.g. 2026-11-23-0515. */
const stamp = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}`;

const fileName = (summary: AnalyticsSummary, now: Date, ext: 'csv' | 'pdf') =>
  `sproutflow-${periodName(summary.days).toLowerCase()}-care-summary-${stamp(now)}.${ext}`;

/** Rejects when `p` takes longer than `ms`, so a stuck print job never leaves the export button spinning. */
function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function exportCsv(summary: AnalyticsSummary, range: MoistureRange): Promise<void> {
  const now = new Date();
  const period = periodName(summary.days);
  const csv = buildCsv(summary, range, now);
  try {
    if (!(await Sharing.isAvailableAsync())) throw new Error('sharing unavailable');
    const file = new File(Paths.cache, fileName(summary, now, 'csv'));
    file.write(csv);
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
      dialogTitle: `${period} CSV summary`,
    });
  } catch {
    // Fallback: share the CSV as plain text (works in every runtime, including web).
    await Share.share({ title: `SproutFlow ${period.toLowerCase()} care summary (CSV)`, message: csv });
  }
}

export async function exportPdf(summary: AnalyticsSummary, range: MoistureRange, sourceLabel: string): Promise<void> {
  const now = new Date();
  const html = buildReportHtml(summary, range, now, sourceLabel);
  if (!(await Sharing.isAvailableAsync())) {
    await Print.printAsync({ html });
    return;
  }
  // expo-print writes its PDF outside this app's cache folder, and in Expo Go expo-sharing may only
  // read files inside it ("Not allowed to read file under given URL"). So the PDF bytes are written
  // into Paths.cache under a readable name and that copy is shared.
  const { base64 } = await withTimeout(
    Print.printToFileAsync({ html, base64: true }),
    30_000,
    'Creating the PDF took too long. Please try again.',
  );
  if (!base64) throw new Error('The PDF could not be created.');
  const file = new File(Paths.cache, fileName(summary, now, 'pdf'));
  file.write(base64ToBytes(base64));
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: `${periodName(summary.days)} PDF report`,
  });
}
