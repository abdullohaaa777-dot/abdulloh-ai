import { OrganKey } from '../models/organ-bioelectric';

export const ORGAN_LABELS_UZ: Record<OrganKey, string> = {
  heart: 'Yurak',
  kidney: 'Buyrak',
  brain: 'Miya',
  liver: 'Jigar',
  endocrine: 'Endokrin tizim',
  lung: 'O‘pka'
};

export const ORGAN_SCORE_LABELS_UZ: Record<OrganKey, string> = {
  heart: 'Yurak bioelektr stressi',
  kidney: 'Buyrak funksional bosimi',
  brain: 'Miya-vegetativ regulyatsiya indeksi',
  liver: 'Jigar-metabolik signal indeksi',
  endocrine: 'Endokrin-ion kanal faolligi ehtimoliy disbalansi',
  lung: 'O‘pka-nafas/akustik yuklama indeksi'
};

export const BIOELECTRIC_DISCLAIMER_UZ = 'Bu shifokor tashxisini almashtirmaydi. Natija erta skrining va ehtimoliy funksional bosim yo‘nalishini ko‘rsatadi.';

export const INDIRECT_SIGNAL_NOTE_UZ = 'Buyrak, jigar va endokrin tizim ko‘rsatkichlari bevosita laborator tashxis emas, balki umumiy biofizik va funksional signal belgilariga asoslangan ehtimoliy skrining natijasidir.';

export const SCORE_LEVELS = [
  { min: 0, max: 30, labelUz: 'past', className: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { min: 31, max: 60, labelUz: 'o‘rtacha', className: 'text-amber-600 bg-amber-50 border-amber-100' },
  { min: 61, max: 80, labelUz: 'yuqori', className: 'text-orange-600 bg-orange-50 border-orange-100' },
  { min: 81, max: 100, labelUz: 'juda yuqori', className: 'text-red-600 bg-red-50 border-red-100' }
];
