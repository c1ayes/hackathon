// At lat 43.25°N: 1° lat ≈ 111 000 m, 1° lng ≈ 81 000 m (cos 43° ≈ 0.731)
// 100 m ≈ 0.000900° lat, 0.001235° lng
function buildSegments(roadBase, waypoints, scoreOffsets) {
  const SEG_M = 100;
  const M_PER_LAT = 111_000;
  const M_PER_LNG = 81_000;
  const segments = [];
  let globalIdx = 0;

  for (let w = 0; w < waypoints.length - 1; w++) {
    const [la1, ln1] = waypoints[w];
    const [la2, ln2] = waypoints[w + 1];
    const dLat = (la2 - la1) * M_PER_LAT;
    const dLng = (ln2 - ln1) * M_PER_LNG;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    const n = Math.max(1, Math.round(dist / SEG_M));

    for (let s = 0; s < n; s++) {
      const t1 = s / n;
      const t2 = (s + 1) / n;
      const slat1 = la1 + (la2 - la1) * t1;
      const slng1 = ln1 + (ln2 - ln1) * t1;
      const slat2 = la1 + (la2 - la1) * t2;
      const slng2 = ln1 + (ln2 - ln1) * t2;
      const offset = scoreOffsets[globalIdx % scoreOffsets.length];
      segments.push({
        ...roadBase,
        id: roadBase.id * 1000 + globalIdx,
        score: Math.max(0, Math.min(100, roadBase.score + offset)),
        lat: (slat1 + slat2) / 2,
        lng: (slng1 + slng2) / 2,
        coords: [[slat1, slng1], [slat2, slng2]],
      });
      globalIdx++;
    }
  }
  return segments;
}

// ── Road 1: ул. Толе би (центр) — Кунаева → Достык, E-W at lat ~43.258 ──
const toleBiSegs = buildSegments(
  { id: 1, name: "ул. Толе би (центр)", score: 92, traffic: "высокий",
    fixCost: 45_000_000, emergencyCost: 180_000_000, savings: 135_000_000,
    incidentCount: 14, segment: "Кунаева — Достык" },
  [
    [43.2582, 76.9155], // Кунаева
    [43.2578, 76.9220], // Панфилова
    [43.2575, 76.9285], // Фурманов
    [43.2572, 76.9355], // Желтоксан
    [43.2569, 76.9415], // Достык
  ],
  [0, 5, -3, 8, -5, 3, 7, -4, 2, 6, -2, 9, -6, 4, -1, 3, -4, 7, 2, -3]
);

// ── Road 2: пр. Аль-Фараби (запад) — Есентай → Ремизовка, curved arc ──
const alFarabiSegs = buildSegments(
  { id: 2, name: "пр. Аль-Фараби (запад)", score: 78, traffic: "высокий",
    fixCost: 28_000_000, emergencyCost: 95_000_000, savings: 67_000_000,
    incidentCount: 8, segment: "Есентай — Ремизовка" },
  [
    [43.2165, 76.9130], // Есентай mall area
    [43.2195, 76.9250], // Ходжи Мукана
    [43.2230, 76.9390], // Достык
    [43.2265, 76.9530], // Омарова
    [43.2295, 76.9660], // Ремизовка
  ],
  [0, -4, 6, -2, 8, -5, 3, 7, -3, 5, -6, 4, 2, -3, 9, -1, 4, -5, 6, -2]
);

// ── Road 3: ул. Саина (юг) — Тимирязев → Момышулы, N-S at lng ~76.890 ──
const sainaSegs = buildSegments(
  { id: 3, name: "ул. Саина (юг)", score: 61, traffic: "средний",
    fixCost: 12_000_000, emergencyCost: 40_000_000, savings: 28_000_000,
    incidentCount: 5, segment: "Тимирязев — Момышулы" },
  [
    [43.2305, 76.8905], // Тимирязев
    [43.2390, 76.8902], // Райымбек
    [43.2475, 76.8900], // Жибек жолы
    [43.2570, 76.8898], // Момышулы
  ],
  [0, 7, -4, 10, -2, 5, -7, 3, 8, -5, 2, 6, -3, 9, -6, 4, 1, -4, 7, -1]
);

// ── Road 4: пр. Райымбек — Саина → Момышулы, E-W at lat ~43.244 ──
const rayimbekSegs = buildSegments(
  { id: 4, name: "пр. Райымбек", score: 45, traffic: "средний",
    fixCost: 8_000_000, emergencyCost: 22_000_000, savings: 14_000_000,
    incidentCount: 3, segment: "Саина — Момышулы" },
  [
    [43.2440, 76.8905], // Саина
    [43.2443, 76.8980], // промежуток
    [43.2447, 76.9060], // Момышулы
  ],
  [0, 6, -5, 3, 10, -3, 7, -6, 4, 2, -4, 8, -1, 5, -7]
);

// ── Road 5: ул. Момышулы (север) — Северное кольцо, N-S at lng ~76.906 ──
const momyshulySegs = buildSegments(
  { id: 5, name: "ул. Момышулы (север)", score: 29, traffic: "низкий",
    fixCost: 5_000_000, emergencyCost: 11_000_000, savings: 6_000_000,
    incidentCount: 2, segment: "Северное кольцо" },
  [
    [43.2660, 76.9065], // south
    [43.2750, 76.9063], // mid
    [43.2850, 76.9060], // north
  ],
  [0, -4, 6, -2, 5, -6, 3, 7, -3, 4, -5, 2, 8, -1, 3]
);

export const roadsData = [
  ...toleBiSegs,
  ...alFarabiSegs,
  ...sainaSegs,
  ...rayimbekSegs,
  ...momyshulySegs,
];

export const camerasData = [
  {
    id: 1,
    name: "пр. Назарбаева / Абай",
    district: "Медеуский",
    roadClass: "Магистраль",
    score: 89,
    status: "ACTIVE",
    gap: false,
    violations: 340,
    revenue: 42_000_000,    
    installCost: 8_500_000,
    annualRevenue: 42_000_000,
    roi: 4.94,
    paybackMonths: 2.4,
    accidents: 5,
    accidentsPrevented: 2,
    postCameraViolationsPerMonth: 12,
    gapDistance: 0,
    linkedRoadId: 1,
    queuePosition: 2,
    districtBudget: 240_000_000,
    bearing: 45, fov: 75, 
    lat: 43.2425,
    lng: 76.9455,
  },
  {
    id: 2,
    name: "ул. Толе би / Ауэзова",
    district: "Алмалинский",
    roadClass: "Магистраль",
    score: 76,
    status: "UNMONITORED",
    gap: false,
    violations: 210,
    revenue: 34_200_000,
    installCost: 8_500_000,
    annualRevenue: 34_200_000,
    roi: 3.02,
    paybackMonths: 3,
    accidents: 8,
    accidentsPrevented: 3,
    postCameraViolationsPerMonth: 87,
    gapDistance: 340,
    linkedRoadId: 1,
    queuePosition: 1,
    districtBudget: 240_000_000,
    bearing: 270, fov: 60,
    lat: 43.2515,
    lng: 76.9000,
  },
  {
    id: 3,
    name: "пр. Суюнбая / Рыскулова",
    district: "Турксибский",
    roadClass: "Районная",
    score: 61,
    status: "UNMONITORED",
    gap: true,
    violations: 0,
    revenue: 22_000_000,
    installCost: 8_500_000,
    annualRevenue: 22_000_000,
    roi: 2.6,
    paybackMonths: 4.6,
    accidents: 3,
    accidentsPrevented: 1,
    postCameraViolationsPerMonth: 54,
    gapDistance: 520,
    linkedRoadId: null,
    queuePosition: 3,
    districtBudget: 180_000_000,
    bearing: 200, fov: 80,
    lat: 43.2700,
    lng: 76.9500,
  },
  {
    id: 4,
    name: "Саина / Тимирязев",
    district: "Бостандыкский",
    roadClass: "Районная",
    score: 52,
    status: "ACTIVE",
    gap: false,
    violations: 180,
    revenue: 18_000_000,
    installCost: 8_500_000,
    annualRevenue: 18_000_000,
    roi: 2.0,
    paybackMonths: 5.7,
    accidents: 2,
    accidentsPrevented: 1,
    postCameraViolationsPerMonth: null,
    gapDistance: 0,
    linkedRoadId: 3,
    queuePosition: 4,
    districtBudget: 200_000_000,
    bearing: 90, fov: 65,
    lat: 43.2380,
    lng: 76.9100,
  },
  {
    id: 5,
    name: "Аль-Фараби / Хаджимукана",
    district: "Бостандыкский",
    roadClass: "Магистраль",
    score: 44,
    status: "UNMONITORED",
    gap: false,
    violations: 120,
    revenue: 14_000_000,
    installCost: 8_500_000,
    annualRevenue: 14_000_000,
    roi: 1.4,
    paybackMonths: 8.6,
    accidents: 1,
    accidentsPrevented: 1,
    postCameraViolationsPerMonth: 31,
    gapDistance: 210,
    linkedRoadId: 2,
    queuePosition: 5,
    districtBudget: 200_000_000,
    bearing: 45, fov: 75,
    lat: 43.2510,
    lng: 76.9300,
  },
];

export const heatmapPoints = [
  [43.2565, 76.9286, 1.0],[43.2550, 76.9270, 0.9],[43.2580, 76.9300, 0.85],
  [43.2530, 76.9250, 0.8],[43.2600, 76.9320, 0.75],[43.2510, 76.9180, 0.9],
  [43.2495, 76.9160, 0.85],[43.2520, 76.9200, 0.7],[43.2475, 76.9140, 0.6],
  [43.2380, 76.8890, 0.95],[43.2365, 76.8870, 0.9],[43.2395, 76.8910, 0.8],
  [43.2350, 76.8850, 0.7],[43.2410, 76.8930, 0.65],[43.2430, 76.9050, 0.75],
  [43.2415, 76.9030, 0.7],[43.2445, 76.9070, 0.65],[43.2460, 76.9100, 0.5],
  [43.2320, 76.9450, 0.6],[43.2305, 76.9430, 0.55],[43.2335, 76.9470, 0.5],
  [43.2290, 76.9410, 0.45],[43.2700, 76.9400, 0.7],[43.2685, 76.9380, 0.65],
  [43.2715, 76.9420, 0.6],[43.2670, 76.9360, 0.5],[43.2480, 76.9550, 0.55],
  [43.2465, 76.9530, 0.5],[43.2495, 76.9570, 0.45],[43.2600, 76.8800, 0.4],
];

export const totalComplaints = 269;

export function formatTenge(amount) {
  return amount.toLocaleString("ru-RU") + " ₸";
}

export function getSeverity(score) {
  if (score >= 70) return "critical";
  if (score >= 45) return "warning";
  return "good";
}