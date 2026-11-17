export type Airline = { code: string; name: string; alliance?: string };

export type Flight = {
  id: string;
  airline: Airline;
  flightNumber: string;
  from: string; // IATA
  to: string; // IATA
  fromCity: string;
  toCity: string;
  departAt: string; // ISO
  arriveAt: string; // ISO
  durationMin: number;
  stops: number;
  via?: string;
  cabin: "Economy" | "Premium" | "Business" | "First";
  /** Cents, per traveler. */
  price: number;
  currency: "USD";
  seatsLeft: number;
};

export type Hotel = {
  id: string;
  name: string;
  city: string;
  country: string;
  area: string;
  stars: 3 | 4 | 5;
  rating: number; // 0–10
  reviews: number;
  /** Cents per night. */
  pricePerNight: number;
  image: string;
  amenities: string[];
  lat: number;
  lng: number;
};

export type VisaRule = {
  /** ISO country name of destination. */
  destination: string;
  type: "Visa-free" | "eVisa" | "Visa on arrival" | "Embassy visa";
  maxStayDays: number;
  /** Cents. 0 when free. */
  fee: number;
  processingDays: string;
  documents: string[];
  notes?: string;
};

export type Destination = {
  id: string;
  city: string;
  country: string;
  airport: string;
  blurb: string;
  image: string;
  themes: ("sea" | "city" | "culture" | "mountains" | "desert" | "food")[];
  bestMonths: string;
  fromPrice: number; // cents, round-trip from DXB
};
