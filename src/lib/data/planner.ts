const img = (id: string, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export type PlannerCountry = {
  id: string;
  name: string;
  image: string;
  /** Cities with their airport (for the flight search). */
  cities: { name: string; airport: string }[];
};

export const PLANNER_COUNTRIES: PlannerCountry[] = [
  {
    id: "egypt",
    name: "Egypt",
    image: img("photo-1539650116574-8efeb43e2750"),
    cities: [
      { name: "Cairo", airport: "CAI" },
      { name: "Giza", airport: "CAI" },
      { name: "Alexandria", airport: "CAI" },
      { name: "Luxor", airport: "CAI" },
      { name: "Aswan", airport: "CAI" },
      { name: "Sharm El Sheikh", airport: "SSH" },
      { name: "Hurghada", airport: "HRG" },
    ],
  },
  {
    id: "greece",
    name: "Greece",
    image: img("photo-1570077188670-e3a8d69ac5ff"),
    cities: [
      { name: "Athens", airport: "ATH" },
      { name: "Santorini", airport: "JTR" },
      { name: "Mykonos", airport: "ATH" },
      { name: "Crete", airport: "ATH" },
      { name: "Naxos", airport: "ATH" },
    ],
  },
  {
    id: "indonesia",
    name: "Bali",
    image: img("photo-1537996194471-e657df975ab4"),
    cities: [
      { name: "Ubud", airport: "DPS" },
      { name: "Uluwatu", airport: "DPS" },
      { name: "Seminyak", airport: "DPS" },
      { name: "Canggu", airport: "DPS" },
      { name: "Nusa Penida", airport: "DPS" },
    ],
  },
  {
    id: "japan",
    name: "Japan",
    image: img("photo-1540959733332-eab4deabeeaf"),
    cities: [
      { name: "Tokyo", airport: "NRT" },
      { name: "Kyoto", airport: "NRT" },
      { name: "Osaka", airport: "NRT" },
      { name: "Hakone", airport: "NRT" },
      { name: "Nara", airport: "NRT" },
    ],
  },
  {
    id: "thailand",
    name: "Thailand",
    image: img("photo-1589394815804-964ed0be2eb5"),
    cities: [
      { name: "Bangkok", airport: "BKK" },
      { name: "Phuket", airport: "HKT" },
      { name: "Chiang Mai", airport: "BKK" },
      { name: "Krabi", airport: "HKT" },
      { name: "Koh Samui", airport: "BKK" },
    ],
  },
  {
    id: "turkiye",
    name: "Türkiye",
    image: img("photo-1524231757912-21f4fe3a7200"),
    cities: [
      { name: "Istanbul", airport: "IST" },
      { name: "Cappadocia", airport: "IST" },
      { name: "Antalya", airport: "IST" },
      { name: "Bodrum", airport: "IST" },
    ],
  },
];

export const BUDGETS = [
  { id: "easy", label: "Easy on the wallet", hint: "Under $1,000" },
  { id: "comfort", label: "Comfortable", hint: "$1,000 – 2,500" },
  { id: "treat", label: "Treat myself", hint: "$2,500 – 5,000" },
  { id: "nolimit", label: "No limits", hint: "$5,000+" },
] as const;

export const VIBES = ["Beaches", "Food", "History", "Nightlife", "Nature", "Shopping", "Wellness", "Adventure", "Slow mornings"] as const;

/** Next six months as chips: "Dec 2026" etc. */
export function upcomingMonths(n = 6) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i + (now.getDate() > 20 ? 1 : 0), 1);
    return {
      id: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-GB", { month: "short", year: i === 0 || d.getMonth() === 0 ? "numeric" : undefined }),
    };
  });
}
