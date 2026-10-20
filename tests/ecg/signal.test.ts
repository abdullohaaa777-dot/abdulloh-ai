import {describe,it,expect} from 'vitest';
import {parseCsv,measure} from '../../src/server/ecg/signal';
import {validateInterpretation} from '../../src/server/ecg/claude';
const fs=500;
function csv(flat=false){return 'II\n'+Array.from({length:fs*10},(_,i)=>flat?0:Math.exp(-(((i%fs-100)/8)**2))).join('\n');}
describe('ECG research signal',()=>{
 it('rejects invalid metadata and malformed content',()=>{
  for(const [data,rate] of [['II\n1',500],['II,II\n1,2',500],['II\nNaN',500],[csv(),0],['<xml/>',500]] as const)expect(()=>parseCsv(data,rate)).toThrow();
 });
 it('detects known synthetic peak spacing',()=>{const result=measure(parseCsv(csv(),fs));expect(result.measurements.heartRateBpm).toBeCloseTo(60,1);expect(result.measurements.rrMs).toBeCloseTo(1000,1);expect(result.missingLeads).toHaveLength(11);expect(result.measurements.qtMs).toBeNull();});
 it('abstains on flat signal',()=>{const result=measure(parseCsv(csv(true),fs));expect(result.measurements.heartRateBpm).toBeNull();expect(result.leads[0].quality).toBe('baholab bo‘lmaydi');});
 it('rejects invented numeric claims or missing evidence',()=>{expect(()=>validateInterpretation({summary:'HR 80',evidenceIds:['limitations']},['limitations'])).toThrow();expect(()=>validateInterpretation({summary:'Izoh',evidenceIds:['unknown']},['limitations'])).toThrow();expect(validateInterpretation({summary:'Shifokor tekshiruvi kerak.',evidenceIds:['limitations']},['limitations']).summary).toContain('Shifokor');});
});
