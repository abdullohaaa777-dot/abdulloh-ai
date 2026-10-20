export const LEADS = ['I','II','III','aVR','aVL','aVF','V1','V2','V3','V4','V5','V6'] as const;
export interface SignalData { samplingRate: number; leads: Record<string, number[]> }
export function parseCsv(csv: string, samplingRate: number): SignalData {
  if (!Number.isInteger(samplingRate) || samplingRate < 100 || samplingRate > 2000) throw new Error('Sampling rate 100–2000 Hz bo‘lishi kerak.');
  const rows = csv.trim().split(/\r?\n/);
  const names = rows.shift()?.split(',').map(v => v.trim()) ?? [];
  if (!names.length || new Set(names).size !== names.length || names.some(n => !LEADS.includes(n as typeof LEADS[number]))) throw new Error('CSV sarlavhasida faqat standart, takrorlanmagan EKG tarmoqlari bo‘lsin.');
  if (rows.length < samplingRate * 5 || rows.length > samplingRate * 60) throw new Error('Signal davomiyligi 5–60 soniya bo‘lsin.');
  const leads: Record<string, number[]> = Object.fromEntries(names.map(n => [n, []]));
  for (const row of rows) {
    const cells = row.split(',');
    if (cells.length !== names.length) throw new Error('CSV ustunlari mos emas.');
    cells.forEach((cell, i) => {
      const value = Number(cell);
      if (!cell.trim() || !Number.isFinite(value) || Math.abs(value) > 20) throw new Error('Signal mV birlikda, −20 va 20 oralig‘ida bo‘lsin.');
      leads[names[i]].push(value);
    });
  }
  return { samplingRate, leads };
}
export function measure(signal: SignalData) {
  const leads = Object.entries(signal.leads).map(([name, values]) => {
    const min = values.reduce((a,b)=>Math.min(a,b),Infinity), max = values.reduce((a,b)=>Math.max(a,b),-Infinity);
    const flat = values.slice(1).filter((v,i) => v === values[i]).length / (values.length - 1);
    const quality = max - min < 0.05 || flat > 0.8 ? 'baholab bo‘lmaydi' : 'cheklangan ma’lumot';
    return { name, minMv: min, maxMv: max, quality, samples: values.length };
  });
  // This detector is intentionally research-only: no rhythm diagnosis follows from peaks.
  const name = signal.leads['II'] ? 'II' : Object.keys(signal.leads)[0];
  const values = signal.leads[name];
  const valid = leads.find(l => l.name === name)?.quality !== 'baholab bo‘lmaydi';
  const sorted = [...values].sort((a,b) => a-b);
  const baseline = sorted[Math.floor(sorted.length / 2)];
  const excursion = values.reduce((a,v)=>Math.max(a,Math.abs(v-baseline)),0);
  const peaks: number[] = [];
  const refractory = Math.round(signal.samplingRate * 0.25);
  if (valid) for (let i=1; i<values.length-1; i++) {
    const amplitude = Math.abs(values[i]-baseline);
    if (amplitude < excursion * 0.6 || amplitude <= Math.abs(values[i-1]-baseline) || amplitude < Math.abs(values[i+1]-baseline)) continue;
    const last = peaks[peaks.length-1];
    if (last === undefined || i-last >= refractory) peaks.push(i);
    else if (amplitude > Math.abs(values[last]-baseline)) peaks[peaks.length-1] = i;
  }
  const rr = peaks.slice(1).map((p,i) => (p-peaks[i])*1000/signal.samplingRate);
  const rrMs = rr.length >= 3 ? rr.reduce((a,b)=>a+b,0)/rr.length : null;
  const heartRate = rrMs && rrMs >= 300 && rrMs <= 2000 ? 60000/rrMs : null;
  return { algorithmVersion:'research-peaks-0.1.0', durationSeconds:values.length/signal.samplingRate,
    leads, missingLeads:LEADS.filter(l => !signal.leads[l]), referenceLead:name, peaks,
    measurements:{ heartRateBpm:heartRate, rrMs:heartRate ? rrMs : null, prMs:null, qrsMs:null, qtMs:null, qtcMs:null, axisDegrees:null },
    limitations:['Klinik validatsiyadan o‘tmagan tadqiqot detektori.', 'PR, QRS, QT/QTc, elektr o‘qi va patologiyalar hozir baholanmaydi.', 'R-peak nomzodlari shifokor tomonidan tekshirilishi kerak.'] };
}
