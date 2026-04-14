import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import {
  DiagnosisProb,
  HeartMicroImpulseFeatures,
  HeartMicroImpulseNarrative
} from './heart-micro-impulse-storage';

@Injectable({ providedIn: 'root' })
export class HeartMicroImpulseInterpretationService {
  private ai: GoogleGenAI | null = (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY)
    ? new GoogleGenAI({ apiKey: GEMINI_API_KEY })
    : null;

  async interpret(features: HeartMicroImpulseFeatures, topDiagnoses: DiagnosisProb[], main: DiagnosisProb, scanMode: 'standard' | 'topography' = 'standard'): Promise<HeartMicroImpulseNarrative> {
    const local = this.localNarrative(features, topDiagnoses, main);
    if (!this.ai) return local;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
          role: 'user',
          parts: [{
            text: `Siz yurak mikro impuls skrining tahlilchisiz. Qat'iy tashxis qo'ymang, dori/doza yozmang.
Quyidagi structured featurelar va top ehtimoliy diagnozlar asosida chuqur tibbiy izohni JSON formatda qaytaring.
features=${JSON.stringify(features)}
scanMode=${scanMode}
topDiagnoses=${JSON.stringify(topDiagnoses)}
mainDiagnosis=${JSON.stringify(main)}

JSON schema:
{
  "qisqaXulosa": string,
  "bolishiMumkinHolatlar": string[],
  "otkirVaSurunkaliXavfBelgisi": string[],
  "shoshilinchXavfBelgisi": string[],
  "tavsiyaTekshiruvlar": string[],
  "patogenez": string[],
  "molekulyarMexanizm": string[],
  "biofizikMexanizm": string[],
  "biokimyoviyMexanizm": string[],
  "klinikInterpretatsiya": string[],
  "keyingiQadamlar": string[],
  "soddaIzoh": string[],
  "chuqurIlmiyIzoh": string[],
  "otaChuqurMexanistikIzoh": string[],
  "topografikXaritaIzohi": string[],
  "individualYurakModelIzohi": string[]
}`
          }]
        }],
        config: { responseMimeType: 'application/json' }
      });

      const parsed = JSON.parse(response.text || '{}') as Partial<HeartMicroImpulseNarrative>;
      return this.safety({
        ...local,
        ...parsed,
        bolishiMumkinHolatlar: parsed.bolishiMumkinHolatlar ?? local.bolishiMumkinHolatlar,
        otkirVaSurunkaliXavfBelgisi: parsed.otkirVaSurunkaliXavfBelgisi ?? local.otkirVaSurunkaliXavfBelgisi,
        shoshilinchXavfBelgisi: parsed.shoshilinchXavfBelgisi ?? local.shoshilinchXavfBelgisi,
        tavsiyaTekshiruvlar: parsed.tavsiyaTekshiruvlar ?? local.tavsiyaTekshiruvlar,
        patogenez: parsed.patogenez ?? local.patogenez,
        molekulyarMexanizm: parsed.molekulyarMexanizm ?? local.molekulyarMexanizm,
        biofizikMexanizm: parsed.biofizikMexanizm ?? local.biofizikMexanizm,
        biokimyoviyMexanizm: parsed.biokimyoviyMexanizm ?? local.biokimyoviyMexanizm,
        klinikInterpretatsiya: parsed.klinikInterpretatsiya ?? local.klinikInterpretatsiya,
        keyingiQadamlar: parsed.keyingiQadamlar ?? local.keyingiQadamlar,
        soddaIzoh: parsed.soddaIzoh ?? local.soddaIzoh,
        chuqurIlmiyIzoh: parsed.chuqurIlmiyIzoh ?? local.chuqurIlmiyIzoh,
        otaChuqurMexanistikIzoh: parsed.otaChuqurMexanistikIzoh ?? local.otaChuqurMexanistikIzoh,
        topografikXaritaIzohi: parsed.topografikXaritaIzohi ?? local.topografikXaritaIzohi,
        individualYurakModelIzohi: parsed.individualYurakModelIzohi ?? local.individualYurakModelIzohi
      });
    } catch (error) {
      console.error('Heart interpretation fallback', error);
      return local;
    }
  }

  private safety(input: HeartMicroImpulseNarrative): HeartMicroImpulseNarrative {
    const banned = [/aniq tashxis/i, /sizda aniq/i, /mutlaqo sog'lom/i, /mg\b/i, /retsept/i, /kuniga\s*\d+/i];
    const clean = (x: string) => banned.some((b) => b.test(x))
      ? 'Skrining bo‘yicha mos keluvchi belgilar qayd etildi, qo‘shimcha klinik baholash tavsiya etiladi.'
      : x;
    return {
      ...input,
      qisqaXulosa: clean(input.qisqaXulosa),
      bolishiMumkinHolatlar: input.bolishiMumkinHolatlar.map(clean),
      otkirVaSurunkaliXavfBelgisi: input.otkirVaSurunkaliXavfBelgisi.map(clean),
      shoshilinchXavfBelgisi: input.shoshilinchXavfBelgisi.map(clean),
      tavsiyaTekshiruvlar: input.tavsiyaTekshiruvlar.map(clean),
      patogenez: input.patogenez.map(clean),
      molekulyarMexanizm: input.molekulyarMexanizm.map(clean),
      biofizikMexanizm: input.biofizikMexanizm.map(clean),
      biokimyoviyMexanizm: input.biokimyoviyMexanizm.map(clean),
      klinikInterpretatsiya: input.klinikInterpretatsiya.map(clean),
      keyingiQadamlar: input.keyingiQadamlar.map(clean),
      soddaIzoh: input.soddaIzoh.map(clean),
      chuqurIlmiyIzoh: input.chuqurIlmiyIzoh.map(clean),
      otaChuqurMexanistikIzoh: input.otaChuqurMexanistikIzoh.map(clean),
      topografikXaritaIzohi: input.topografikXaritaIzohi.map(clean),
      individualYurakModelIzohi: input.individualYurakModelIzohi.map(clean)
    };
  }

  private localNarrative(features: HeartMicroImpulseFeatures, top: DiagnosisProb[], main: DiagnosisProb): HeartMicroImpulseNarrative {
    return {
      qisqaXulosa: `Yurak mikro impuls skriningi bo‘yicha asosiy ehtimoliy diagnoz: ${main.name} (${main.percent}%). Bu mustaqil tashxis emas.`,
      bolishiMumkinHolatlar: top.map((t) => `${t.name} yo‘nalishi ${t.percent}% darajada mos kelishi mumkin.`),
      otkirVaSurunkaliXavfBelgisi: [
        `Elektromexanik timing notekisligi: ${features.electromechanicalTimingProxy}%`,
        `Perfuzion beqarorlik proksisi: ${features.perfusionInstabilityProxy}%`,
        `Avtonom stress proksisi: ${features.autonomicStressProxy}%`
      ],
      shoshilinchXavfBelgisi: features.urgency > 70
        ? ['Shoshilinch xavf belgisi yuqori: ko‘krak og‘riq/hansirash bo‘lsa zudlik bilan murojaat qiling.']
        : ['Shoshilinch xavf belgisi past-o‘rta darajada, ammo simptom kuchaysa shifokorga murojaat qiling.'],
      tavsiyaTekshiruvlar: ['12-lead EKG', 'Ehokardiyografiya', 'Holter monitoring', 'Troponin/BNP bilan laborator baholash'],
      patogenez: [
        'Dastlab elektrofiziologik sinxronlik buzilishi mikrosikl notekisligiga olib kelishi mumkin.',
        'Hemodinamik yuklama ortishi bilan mikro-harakat amplitudasi va faza uyg‘unligi o‘zgaradi.',
        'Davom etsa to‘qima remodelling va funksional rezerv pasayishi ehtimoli yuzaga keladi.'
      ],
      molekulyarMexanizm: [
        'Ion kanal oqimlaridagi notekislik (Na/K/Ca) excitation-contraction coupling jarayonini siljitadi.',
        'Calcium handling buzilishi va ROS oshishi kontraktil javobni beqaror qiladi.',
        'Fibroz/remodelling va neurohormonal aktivatsiya ritm barqarorligini pasaytirishi mumkin.'
      ],
      biofizikMexanizm: [
        'Mikrotebranish amplitudasining notekis taqsimlanishi vibroakustik rezonansni siljitadi.',
        'Faza kechikishi va signal dispersiyasi ko‘krak devori orqali tarqalish profilini o‘zgartiradi.',
        'Elektromexanik timing disturbance sikl assimetriyasiga mos keluvchi waveform notekisligini beradi.'
      ],
      biokimyoviyMexanizm: [
        'Ishemiya-metabolik siljishda ATP kamayishi va laktat oshishi energiya samaradorligini pasaytiradi.',
        'Oksidativ stress va yallig‘lanish mediatorlari membrana barqarorligiga ta’sir qiladi.',
        'Elektrolit disbalansi va calcium overload funksional ritmni beqarorlashtirishi mumkin.'
      ],
      klinikInterpretatsiya: [
        `Signal sifati ${features.signalQuality}% va confidence ${features.confidence}% bo‘lib, skrining bo‘yicha risk qatlamlanishi mumkin.`,
        'Natija ehtimoliy diagnoz yo‘nalishini ko‘rsatadi, qat’iy klinik tashxis uchun instrumental tekshiruv zarur.'
      ],
      keyingiQadamlar: ['7 kun ichida qayta skrining qiling', 'Semptom jurnal yuriting', 'Kardiolog ko‘rigini rejalashtiring'],
      soddaIzoh: ['Tizim yurak urishi bilan bog‘liq mikro-harakat va tovush izlarini tahlil qildi.'],
      chuqurIlmiyIzoh: ['Multimodal signal filtratsiyasi orqali ritm beqarorligi va vibroakustik dispersiya proksilari baholandi.'],
      otaChuqurMexanistikIzoh: ['Elektromexanik faza sinxronligi, motion-energy taqsimoti va akustik turbulensiya indekslari integratsiyalashgan inferens modelida birlashtirildi.'],
      topografikXaritaIzohi: [
        `Prekordial dispersiya skori ${features.prekordialDispersiyaSkori}% va rezonans asimmetriyasi ${features.rezonansAsimmetriyaIndeksi}% bo‘yicha zonal notekislik qayd etildi.`,
        `Mexanik tarqalish kechikishi ${features.mexanikTarqalishKechikishi}% darajada baholanib, ko‘krak usti rezonans xaritasi bilan mos talqin qilindi.`
      ],
      individualYurakModelIzohi: [
        `Individual yurak modeli mikrosinxronlik indeksi ${features.mikrosinxronlikIndeksi}% va turbulent vibroakustik ehtimol ${features.turbulentVibroakustikEhtimol}% bilan moslashtirildi.`,
        'Modeldagi chap-o‘ng rezonans tafovuti ehtimoliy mexanik beqarorlik yo‘nalishlarini vizual ko‘rsatadi.'
      ]
    };
  }
}
