export interface KhmerVoicePreset {
  id: string;
  name: string;
  gender: 'female' | 'male';
  baseVoice: 'km-KH-SreymomNeural' | 'km-KH-PisethNeural';
  style: string;
  pitch: number;
  speed: number;
  description: string;
  tags: string[];
  sampleText: string;
  provider: string;
  isDefault: boolean;
  createdAt: string;
}

export const KHMER_DEFAULT_VOICES: KhmerVoicePreset[] = [
  // 5 FEMALE VOICES (ស្រី 5 សម្លេង - 100% ដូចមនុស្ស)
  {
    id: 'km-clone-female-1',
    name: 'ស្រីមុំ (Sreymom) — ស្តង់ដារ ផ្អែមពិរោះ',
    gender: 'female',
    baseVoice: 'km-KH-SreymomNeural',
    style: 'general',
    pitch: 0,
    speed: 1.0,
    description: 'សម្លេងតួឯកស្រី ផ្អែមស្រទន់ បែបធម្មជាតិពិតៗ ១០០% (Lead Female / Sweet Natural)',
    tags: ['តួឯកស្រី', 'ផ្អែមស្រទន់', '១០០% ធម្មជាតិ'],
    sampleText: 'ជម្រាបសួរ! ខ្ញុំឈ្មោះស្រីមុំ ជាសម្លេងធម្មជាតិស្តង់ដារ ផ្អែមពិរោះ និងរស់រវើក។',
    provider: 'azure',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'km-clone-female-2',
    name: 'សុគន្ធា (Sokunthea) — យុវតីក្មេង រស់រវើក',
    gender: 'female',
    baseVoice: 'km-KH-SreymomNeural',
    style: 'general',
    pitch: 5,
    speed: 1.06,
    description: 'សម្លេងយុវតីវ័យក្មេង ស្រស់ស្រាយ រស់រវើក រីករាយ (Youthful & Energetic Girl)',
    tags: ['យុវតីក្មេង', 'ស្រស់ស្រាយ', 'រស់រវើក'],
    sampleText: 'សួស្តីបងៗទាំងអស់គ្នា! ខ្ញុំសុគន្ធា សម្លេងក្មេងស្រីស្រស់ស្រាយ រីករាយគ្រប់ពេលវេលា!',
    provider: 'azure',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'km-clone-female-3',
    name: 'បុប្ផា (Bopha) — ស្រទន់ មនោសញ្ចេតនា',
    gender: 'female',
    baseVoice: 'km-KH-SreymomNeural',
    style: 'general',
    pitch: -2,
    speed: 0.94,
    description: 'សម្លេងរំជួលចិត្ត ស្រទន់ ទន់ភ្លន់ បែបរឿងភាគមនោសញ្ចេតនា (Soft & Emotional / Drama)',
    tags: ['មនោសញ្ចេតនា', 'រឿងភាគ', 'ទន់ភ្លន់'],
    sampleText: 'សម្លេងបុប្ផា ស្រទន់ ទន់ភ្លន់ និងពោរពេញដោយមនោសញ្ចេតនា ស័ក្តិសមសម្រាប់រឿងភាគស្នេហា។',
    provider: 'azure',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'km-clone-female-4',
    name: 'កល្យាណ (Kalyan) — ម៉ឺងម៉ាត់ មានអំណាច',
    gender: 'female',
    baseVoice: 'km-KH-SreymomNeural',
    style: 'news',
    pitch: -5,
    speed: 0.96,
    description: 'សម្លេងមនុស្សស្រីចាស់ទុំ ម៉ឺងម៉ាត់ មានអំណាច ឬជាតួអង្គម្តាយ (Mature / Authoritative / Mother)',
    tags: ['ចាស់ទុំ', 'ម៉ឺងម៉ាត់', 'មានអំណាច'],
    sampleText: 'ខ្ញុំជាសម្លេងកល្យាណ មានភាពម៉ឺងម៉ាត់ ចាស់ទុំ និងមានអំណាច ស័ក្តិសមសម្រាប់តួអង្គមេដឹកនាំ ឬតួអង្គម្តាយ។',
    provider: 'azure',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'km-clone-female-5',
    name: 'ទេវី (Devi) — អ្នកអានព័ត៌មាន រៀបរាប់សាច់រឿង',
    gender: 'female',
    baseVoice: 'km-KH-SreymomNeural',
    style: 'news',
    pitch: 2,
    speed: 1.02,
    description: 'សម្លេងអត្ថាធិប្បាយ ព័ត៌មាន ភាពយន្តឯកសារ និងរឿងព្រេង (News & Story Narrator)',
    tags: ['អានព័ត៌មាន', 'អត្ថាធិប្បាយ', 'ភាពយន្តឯកសារ'],
    sampleText: 'សូមស្វាគមន៍មកកាន់ការផ្សាយព័ត៌មាន និងការរៀបរាប់សាច់រឿងជាមួយសម្លេងទេវី។',
    provider: 'azure',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },

  // 5 MALE VOICES (ប្រុស 5 សម្លេង - 100% ដូចមនុស្ស)
  {
    id: 'km-clone-male-1',
    name: 'ពិសិដ្ឋ (Piseth) — ស្តង់ដារ តួឯកប្រុស',
    gender: 'male',
    baseVoice: 'km-KH-PisethNeural',
    style: 'general',
    pitch: 0,
    speed: 1.0,
    description: 'សម្លេងតួឯកប្រុស រឹងមាំ សង្ហា ធម្មជាតិពិតៗ ១០០% (Lead Male Hero)',
    tags: ['តួឯកប្រុស', 'រឹងមាំ', '១០០% ធម្មជាតិ'],
    sampleText: 'ជម្រាបសួរ! ខ្ញុំបាទពិសិដ្ឋ ជាសម្លេងតួឯកប្រុសស្តង់ដារ រឹងមាំ សង្ហា និងធម្មជាតិ ១០០%។',
    provider: 'azure',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'km-clone-male-2',
    name: 'វិបុល (Vibol) — បុរសជ្រៅ ធ្ងន់ តួអង្គកាច/មេដឹកនាំ',
    gender: 'male',
    baseVoice: 'km-KH-PisethNeural',
    style: 'horror',
    pitch: -8,
    speed: 0.94,
    description: 'សម្លេងបុរសជ្រៅ ធ្ងន់ អំណាច តួអង្គកាច ឬមេដឹកនាំកំពូល (Deep Baritone / Boss / Villain)',
    tags: ['ជ្រៅធ្ងន់', 'តួអង្គកាច', 'មេដឹកនាំ'],
    sampleText: 'ឯងគិតថាឯងអាចគេចផុតពីកណ្តាប់ដៃយើងបានមែនទេ? នេះជាសម្លេងវិបុល ជ្រៅ ធ្ងន់ និងពោរពេញដោយអំណាច!',
    provider: 'azure',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'km-clone-male-3',
    name: 'ចាន់ថុល (Chanthol) — យុវជនក្មេង កំប្លែង រហ័សរហួន',
    gender: 'male',
    baseVoice: 'km-KH-PisethNeural',
    style: 'general',
    pitch: 6,
    speed: 1.08,
    description: 'សម្លេងក្មេងប្រុស ឆ្លាតវៃ កំប្លែង រហ័សរហួន រួសរាយ (Youth Boy / Comic / Friendly)',
    tags: ['យុវជនក្មេង', 'កំប្លែង', 'រហ័សរហួន'],
    sampleText: 'ហេឡូបងប្អូន! ខ្ញុំចាន់ថុល សម្លេងក្មេងប្រុសកំប្លែង រហ័សរហួន ធានាថាស្តាប់ហើយសើចសប្បាយហ្មង!',
    provider: 'azure',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'km-clone-male-4',
    name: 'សុវណ្ណ (Sovann) — អ្នកនិទានរឿង ភាពយន្តបុរាណ',
    gender: 'male',
    baseVoice: 'km-KH-PisethNeural',
    style: 'news',
    pitch: -3,
    speed: 0.93,
    description: 'សម្លេងនិទានរឿង ភាពយន្តបុរាណ ភាពយន្តភាគចិន កូរ៉េ (Cinematic Narrator)',
    tags: ['និទានរឿង', 'ភាពយន្តបុរាណ', 'រឿងភាគ'],
    sampleText: 'កាលពីព្រេងនាយ... នៅលើដែនដីសុវណ្ណភូមិ... នេះជាសម្លេងសុវណ្ណ សម្រាប់និទានរឿង និងអានរឿងនិទានបុរាណ។',
    provider: 'azure',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'km-clone-male-5',
    name: 'រស្មី (Reasmey) — សុភាពបុរស ទន់ភ្លន់ មិត្តភក្តិ',
    gender: 'male',
    baseVoice: 'km-KH-PisethNeural',
    style: 'general',
    pitch: 2,
    speed: 0.98,
    description: 'សម្លេងសុភាពរាបសារ កក់ក្តៅ គួរឱ្យទុកចិត្ត (Gentle Warm Gentleman)',
    tags: ['សុភាពបុរស', 'កក់ក្តៅ', 'គួរទុកចិត្ត'],
    sampleText: 'សួស្តីមិត្តភក្តិទាំងអស់គ្នា ខ្ញុំរស្មី សូមជូនពរអោយអ្នកទាំងអស់គ្នាទទួលបានតែភាពរីករាយ និងជោគជ័យ។',
    provider: 'azure',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export function getKhmerVoicePreset(id: string): KhmerVoicePreset | undefined {
  return KHMER_DEFAULT_VOICES.find((v) => v.id === id);
}
