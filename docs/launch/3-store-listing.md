# Store listing copy

Draft text for App Store Connect and Google Play Console. Character limits are in brackets. Edit freely, but keep the claims true: the stores reject listings that promise features the app doesn't have.

> While bookings and payments are simulated, the copy says "plan" and "compare" rather than "book". Switch to "book" once real bookings work.

## Shared

- **App name** [30]: `Unthinked: AI Travel Planner` (28)
- **Category:** Travel. Secondary on iOS: Lifestyle.
- **Privacy policy URL:** `https://<your-domain>/privacy`
- **Support URL:** `https://<your-domain>/support`
- **Terms URL:** `https://<your-domain>/terms`
- **Copyright:** `2026 <your legal name or company>`

## App Store (iOS)

**Subtitle** [30]
`Flights, stays & visas, asked` (29)

**Promotional text** [170]
`Tell Unthinked where you want to go. It plans the trip, compares flights and stays, checks your visa, and helps you find someone to travel with.`

**Keywords** [100, comma-separated, no spaces]
`trip,planner,flights,hotels,visa,evisa,itinerary,travel buddy,ai,assistant,holiday,vacation,dubai`

**Description** [4000]

```
Plan a whole trip just by asking.

Unthinked is a travel assistant you talk to like a friend who has been everywhere. Say where you want to go and when, and it pulls the trip together: flights, places to stay, visa rules and a day-by-day plan.

ASK, DON'T SEARCH
Type or tap to talk: "Flights from Dubai to Bali next month", "Do I need a visa for Japan?", "Best hotels in Santorini". The assistant answers with options you can tap into.

FLIGHTS AND STAYS IN ONE PLACE
Compare flights by price, time and stops, pick seats, and browse stays on a map. Save everything to your trip.

VISAS, WITHOUT THE GUESSWORK
Check whether your passport needs a visa, an eVisa or nothing at all, see what documents you need, and track an application.

TRAVEL TOGETHER
Going solo? Get matched with travellers heading the same way on the same dates, chat, and plan a group trip with shared costs.

YOUR TRIPS AND WALLET
Every plan, ticket and document in one place.

Unthinked is in early access: prices, bookings and visa applications are simulated while we connect real partners. Visa information is a guide; always confirm with the official government source before you travel.
```

**App Review notes** (App Store Connect → App Review Information)

```
Unthinked is in early access. Flights, hotels and visa applications use sample data and nothing is charged. No login is required; all features are available from the home screen. The AI assistant is reached from the Chat tab. Travel together matches the user with sample traveller profiles; there is no real user-to-user messaging yet.
```

**Age rating questionnaire:** answer "None" for everything. No real user-generated content or contact between users yet, so expect **4+**. Revisit when Travel together connects real people.

**App Privacy ("nutrition label")**, matching `/privacy`:
- Data collected: **User Content → Other User Content** (chat messages sent to the assistant), *not linked to identity*, *not used for tracking*, purpose **App Functionality**.
- Everything else: not collected.

## Google Play

**Short description** [80]
`Plan trips by asking: flights, stays, visas and travel buddies in one app.` (73)

**Full description** [4000]: use the App Store description above.

**Graphics**
- App icon 512×512: `store/play-icon-512.png`
- Feature graphic 1024×500: `store/play-feature-graphic.png`
- Phone screenshots: `store/screenshots/ios-6.9/*.png` (also valid on Play)

**Data safety form**, matching `/privacy`:
- Does the app collect or share user data? **Yes, collects**: *Messages → Other in-app messages* (assistant chats), processed ephemerally, not shared for advertising, required for the feature.
- Is data encrypted in transit? **Yes.**
- Can users request deletion? **Yes**: data is stored on the device and can be erased in Profile.

**Content rating (IARC):** Reference app, category "Travel". No violence, sexuality, gambling or user interaction yet.

**Target audience:** 18 and over.

**Ads:** No.
