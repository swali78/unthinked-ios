import type { Airline, Destination, Hotel, VisaRule } from "./types";

const img = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const AIRLINES: Airline[] = [
  { code: "EK", name: "Emirates" },
  { code: "QR", name: "Qatar Airways", alliance: "oneworld" },
  { code: "EY", name: "Etihad Airways" },
  { code: "TK", name: "Turkish Airlines", alliance: "Star Alliance" },
  { code: "LH", name: "Lufthansa", alliance: "Star Alliance" },
  { code: "BA", name: "British Airways", alliance: "oneworld" },
  { code: "AF", name: "Air France", alliance: "SkyTeam" },
  { code: "SQ", name: "Singapore Airlines", alliance: "Star Alliance" },
  { code: "MS", name: "EgyptAir", alliance: "Star Alliance" },
  { code: "FZ", name: "flydubai" },
  { code: "AI", name: "Air India", alliance: "Star Alliance" },
  { code: "GA", name: "Garuda Indonesia", alliance: "SkyTeam" },
];

export const AIRPORTS: Record<string, string> = {
  DXB: "Dubai",
  AUH: "Abu Dhabi",
  DOH: "Doha",
  IST: "Istanbul",
  CAI: "Cairo",
  HRG: "Hurghada",
  SSH: "Sharm El Sheikh",
  LHR: "London",
  CDG: "Paris",
  FCO: "Rome",
  ATH: "Athens",
  JTR: "Santorini",
  BCN: "Barcelona",
  DPS: "Bali",
  MLE: "Malé",
  SIN: "Singapore",
  BKK: "Bangkok",
  HKT: "Phuket",
  COK: "Kochi",
  BOM: "Mumbai",
  DEL: "Delhi",
  NRT: "Tokyo",
  JFK: "New York",
};

export const DESTINATIONS: Destination[] = [
  { id: "mle", city: "Maldives", country: "Maldives", airport: "MLE", blurb: "Overwater villas, house reefs and glass-clear lagoons.", image: img("photo-1590523277543-a94d2e4eb00b"), themes: ["sea"], bestMonths: "Nov – Apr", fromPrice: 54000 },
  { id: "jtr", city: "Santorini", country: "Greece", airport: "JTR", blurb: "Caldera sunsets, white villages, volcanic beaches.", image: img("photo-1570077188670-e3a8d69ac5ff"), themes: ["sea", "food"], bestMonths: "May – Oct", fromPrice: 61000 },
  { id: "dps", city: "Bali", country: "Indonesia", airport: "DPS", blurb: "Surf in Uluwatu, rice terraces in Ubud.", image: img("photo-1537996194471-e657df975ab4"), themes: ["sea", "culture"], bestMonths: "Apr – Oct", fromPrice: 69000 },
  { id: "ssh", city: "Sharm El Sheikh", country: "Egypt", airport: "SSH", blurb: "Red Sea reefs a short swim from the shore.", image: img("photo-1544551763-46a013bb70d5"), themes: ["sea", "desert"], bestMonths: "Oct – May", fromPrice: 29000 },
  { id: "hkt", city: "Phuket", country: "Thailand", airport: "HKT", blurb: "Long-tail boats to Phi Phi and limestone bays.", image: img("photo-1589394815804-964ed0be2eb5"), themes: ["sea", "food"], bestMonths: "Nov – Apr", fromPrice: 47000 },
  { id: "cai", city: "Cairo", country: "Egypt", airport: "CAI", blurb: "The pyramids of Giza and the Nile at dusk.", image: img("photo-1539650116574-8efeb43e2750"), themes: ["culture", "desert"], bestMonths: "Oct – Apr", fromPrice: 26000 },
  { id: "ist", city: "Istanbul", country: "Türkiye", airport: "IST", blurb: "Two continents, a thousand mosques, endless meze.", image: img("photo-1524231757912-21f4fe3a7200"), themes: ["city", "culture", "food"], bestMonths: "Apr – Jun, Sep – Nov", fromPrice: 33000 },
  { id: "nrt", city: "Tokyo", country: "Japan", airport: "NRT", blurb: "Neon nights, quiet shrines and perfect ramen.", image: img("photo-1540959733332-eab4deabeeaf"), themes: ["city", "food", "culture"], bestMonths: "Mar – May, Oct – Nov", fromPrice: 98000 },
];

export const HOTELS: Hotel[] = [
  { id: "h1", name: "Azure Lagoon Resort", city: "Maldives", country: "Maldives", area: "South Malé Atoll", stars: 5, rating: 9.4, reviews: 1820, pricePerNight: 68000, image: img("photo-1573843981267-be1999ff37cd"), amenities: ["Overwater villa", "House reef", "Spa", "Breakfast"], lat: 3.95, lng: 73.48 },
  { id: "h2", name: "Coral Sands Island", city: "Maldives", country: "Maldives", area: "Baa Atoll", stars: 4, rating: 8.9, reviews: 960, pricePerNight: 39000, image: img("photo-1540541338287-41700207dee6"), amenities: ["Beach villa", "Snorkel gear", "Pool"], lat: 5.2, lng: 73.1 },
  { id: "h3", name: "Caldera Whites", city: "Santorini", country: "Greece", area: "Oia", stars: 5, rating: 9.6, reviews: 2210, pricePerNight: 52000, image: img("photo-1601581875309-fafbf2d3ed3a"), amenities: ["Cave suite", "Plunge pool", "Sunset view"], lat: 36.46, lng: 25.38 },
  { id: "h4", name: "Fira Cliff House", city: "Santorini", country: "Greece", area: "Fira", stars: 4, rating: 8.8, reviews: 1340, pricePerNight: 24000, image: img("photo-1613395877344-13d4a8e0d49e"), amenities: ["Caldera view", "Breakfast", "Hot tub"], lat: 36.42, lng: 25.43 },
  { id: "h5", name: "Ubud Canopy Retreat", city: "Bali", country: "Indonesia", area: "Ubud", stars: 5, rating: 9.3, reviews: 3010, pricePerNight: 31000, image: img("photo-1582719508461-905c673771fd"), amenities: ["Jungle pool", "Yoga", "Spa"], lat: -8.51, lng: 115.26 },
  { id: "h6", name: "Uluwatu Surf Lodge", city: "Bali", country: "Indonesia", area: "Uluwatu", stars: 4, rating: 8.7, reviews: 1120, pricePerNight: 14000, image: img("photo-1559628233-100c798642d4"), amenities: ["Ocean view", "Board rental", "Pool"], lat: -8.83, lng: 115.09 },
  { id: "h7", name: "Seminyak Sunset Villas", city: "Bali", country: "Indonesia", area: "Seminyak", stars: 4, rating: 8.5, reviews: 2440, pricePerNight: 17500, image: img("photo-1571896349842-33c89424de2d"), amenities: ["Private pool", "Beach club access"], lat: -8.69, lng: 115.16 },
  { id: "h8", name: "Red Sea Reef Hotel", city: "Sharm El Sheikh", country: "Egypt", area: "Naama Bay", stars: 5, rating: 9.0, reviews: 4120, pricePerNight: 16000, image: img("photo-1566073771259-6a8506099945"), amenities: ["Private beach", "Dive centre", "All-inclusive"], lat: 27.91, lng: 34.33 },
  { id: "h9", name: "Nabq Bay Palms", city: "Sharm El Sheikh", country: "Egypt", area: "Nabq Bay", stars: 4, rating: 8.4, reviews: 2870, pricePerNight: 9000, image: img("photo-1520250497591-112f2f40a3f4"), amenities: ["Pools", "Kids club", "Reef"], lat: 28.02, lng: 34.43 },
  { id: "h10", name: "Kata Cove Resort", city: "Phuket", country: "Thailand", area: "Kata", stars: 5, rating: 9.1, reviews: 1980, pricePerNight: 22000, image: img("photo-1552465011-b4e21bf6e79a"), amenities: ["Beachfront", "Thai spa", "Pool"], lat: 7.82, lng: 98.3 },
  { id: "h11", name: "Old Town Shophouse", city: "Phuket", country: "Thailand", area: "Phuket Town", stars: 3, rating: 8.6, reviews: 760, pricePerNight: 6000, image: img("photo-1596436889106-be35e843f974"), amenities: ["Rooftop", "Breakfast"], lat: 7.88, lng: 98.39 },
  { id: "h12", name: "Giza Pyramids View", city: "Cairo", country: "Egypt", area: "Giza", stars: 4, rating: 9.2, reviews: 3560, pricePerNight: 11000, image: img("photo-1568322445389-f64ac2515020"), amenities: ["Pyramid view terrace", "Breakfast", "Airport pickup"], lat: 29.98, lng: 31.13 },
  { id: "h13", name: "Nile Corniche Grand", city: "Cairo", country: "Egypt", area: "Garden City", stars: 5, rating: 8.9, reviews: 5240, pricePerNight: 19000, image: img("photo-1542314831-068cd1dbfeeb"), amenities: ["Nile view", "Spa", "Pool"], lat: 30.04, lng: 31.23 },
  { id: "h14", name: "Galata Loft Suites", city: "Istanbul", country: "Türkiye", area: "Beyoğlu", stars: 4, rating: 9.0, reviews: 2290, pricePerNight: 15500, image: img("photo-1551882547-ff40c63fe5fa"), amenities: ["Bosphorus view", "Hammam", "Breakfast"], lat: 41.03, lng: 28.97 },
  { id: "h15", name: "Sultanahmet Courtyard", city: "Istanbul", country: "Türkiye", area: "Sultanahmet", stars: 3, rating: 8.7, reviews: 3180, pricePerNight: 8500, image: img("photo-1564501049412-61c2a3083791"), amenities: ["Walk to Hagia Sophia", "Rooftop"], lat: 41.0, lng: 28.98 },
  { id: "h16", name: "Shibuya Sky Hotel", city: "Tokyo", country: "Japan", area: "Shibuya", stars: 4, rating: 9.1, reviews: 4420, pricePerNight: 26000, image: img("photo-1503899036084-c55cdd92da26"), amenities: ["City view", "Onsen", "Station access"], lat: 35.66, lng: 139.7 },
  { id: "h17", name: "Asakusa Ryokan", city: "Tokyo", country: "Japan", area: "Asakusa", stars: 3, rating: 9.4, reviews: 1650, pricePerNight: 18000, image: img("photo-1528360983277-13d401cdc186"), amenities: ["Tatami rooms", "Kaiseki dinner", "Onsen"], lat: 35.71, lng: 139.79 },
  { id: "h18", name: "Marina Harbour Hotel", city: "Dubai", country: "UAE", area: "Dubai Marina", stars: 5, rating: 9.0, reviews: 6100, pricePerNight: 28000, image: img("photo-1512453979798-5ea266f8880c"), amenities: ["Beach access", "Infinity pool", "Spa"], lat: 25.08, lng: 55.14 },
  { id: "h19", name: "Le Marais Atelier", city: "Paris", country: "France", area: "Le Marais", stars: 4, rating: 8.9, reviews: 2030, pricePerNight: 29000, image: img("photo-1502602898657-3e91760cbb34"), amenities: ["Courtyard", "Breakfast"], lat: 48.86, lng: 2.36 },
  { id: "h20", name: "Trastevere Terrace", city: "Rome", country: "Italy", area: "Trastevere", stars: 4, rating: 9.1, reviews: 1870, pricePerNight: 21000, image: img("photo-1529260830199-42c24126f198"), amenities: ["Roof terrace", "Breakfast", "Bike hire"], lat: 41.89, lng: 12.47 },
];

/** Visa rules for an Indian passport holder, the demo traveler. */
export const VISA_RULES: VisaRule[] = [
  { destination: "Maldives", type: "Visa on arrival", maxStayDays: 30, fee: 0, processingDays: "On arrival", documents: ["Passport valid 6 months", "Return ticket", "Hotel booking", "IMUGA declaration"] },
  { destination: "Thailand", type: "Visa-free", maxStayDays: 60, fee: 0, processingDays: "None", documents: ["Passport valid 6 months", "Return ticket", "Proof of funds"], notes: "Digital Arrival Card required within 72 hours of arrival." },
  { destination: "Indonesia", type: "Visa on arrival", maxStayDays: 30, fee: 3200, processingDays: "On arrival or e-VOA in 1 day", documents: ["Passport valid 6 months", "Return ticket"] },
  { destination: "Egypt", type: "eVisa", maxStayDays: 30, fee: 2500, processingDays: "5–7 days", documents: ["Passport scan", "Passport photo", "Hotel booking", "Return ticket"] },
  { destination: "Türkiye", type: "eVisa", maxStayDays: 30, fee: 4300, processingDays: "Same day", documents: ["Passport valid 6 months", "Valid US/UK/Schengen visa", "Return ticket"], notes: "eVisa available only with a valid Schengen, UK, US or Irish visa or residence permit." },
  { destination: "Greece", type: "Embassy visa", maxStayDays: 90, fee: 9000, processingDays: "15 days", documents: ["Schengen application form", "2 photos", "Travel insurance €30,000", "Bank statements (3 months)", "Flight & hotel bookings", "Employment letter"] },
  { destination: "France", type: "Embassy visa", maxStayDays: 90, fee: 9000, processingDays: "15 days", documents: ["Schengen application form", "2 photos", "Travel insurance €30,000", "Bank statements (3 months)", "Flight & hotel bookings"] },
  { destination: "Italy", type: "Embassy visa", maxStayDays: 90, fee: 9000, processingDays: "15 days", documents: ["Schengen application form", "2 photos", "Travel insurance €30,000", "Bank statements (3 months)", "Flight & hotel bookings"] },
  { destination: "United Kingdom", type: "Embassy visa", maxStayDays: 180, fee: 15500, processingDays: "15 working days", documents: ["Online application", "Biometrics appointment", "Bank statements (6 months)", "Accommodation details"] },
  { destination: "Japan", type: "eVisa", maxStayDays: 90, fee: 600, processingDays: "5 working days", documents: ["Passport scan", "Photo", "Itinerary", "Bank statements"] },
  { destination: "Singapore", type: "eVisa", maxStayDays: 30, fee: 3000, processingDays: "3–5 working days", documents: ["Form 14A", "Photo", "Return ticket", "Hotel booking"] },
  { destination: "UAE", type: "eVisa", maxStayDays: 30, fee: 9000, processingDays: "2–4 days", documents: ["Passport scan", "Photo", "Return ticket"], notes: "Visa on arrival if you hold a US visa, green card, or UK/EU residence permit." },
  { destination: "Qatar", type: "Visa-free", maxStayDays: 30, fee: 0, processingDays: "None", documents: ["Passport valid 6 months", "Return ticket", "Hotel booking via Discover Qatar"] },
  { destination: "United States", type: "Embassy visa", maxStayDays: 180, fee: 18500, processingDays: "Interview wait varies", documents: ["DS-160", "Interview appointment", "Photo", "Financial documents"] },
  { destination: "Sri Lanka", type: "eVisa", maxStayDays: 30, fee: 0, processingDays: "1–2 days", documents: ["Passport scan", "Return ticket"] },
];

export const TRAVELER = {
  firstName: "Khalid",
  nationality: "India",
  homeAirport: "DXB",
  cardLast4: "4242",
};
