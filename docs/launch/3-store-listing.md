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
Unthinked is in early access. Flights, hotels and visa applications use sample data and nothing is charged. The app works without an account; the AI assistant is on the Chat tab. To review accounts and Travel together, sign in with the demo account below (Profile → Create an account → Sign in). Travel together matches users with other travellers and seeded sample profiles; users can report and block from any profile or chat. Account deletion: Profile → account → Delete account.
Demo account: <create one on production and paste the email and password here>
```

**Age rating questionnaire:** Travel together lets adults chat with strangers, so answer **"Unrestricted web access: No"**, **"User-generated content: Yes"** and **"Messaging/chat: Yes"**. Expect **17+** (Apple's rule for apps that connect strangers). Set Travel together to 18+ in the app, which it already is.

**App Privacy ("nutrition label")**, matching `/privacy`. Everything below is *linked to the user's identity*, *not used for tracking*, purpose **App Functionality**, and only collected when the user creates an account:
- **Contact Info:** Name, Email Address
- **User Content:** Other User Content (Travel together profile, plans, expenses), Emails or Text Messages (chats with other travellers)
- **Identifiers:** User ID
- **Sensitive Info:** none. Passport numbers count as *Other Data Types → Other Data*; declare that too.
- **Other User Content** also covers assistant chat messages, which are sent but not stored.
- Not collected: location, contacts, health, financial info, browsing history, usage data, diagnostics.

## Google Play

**Short description** [80]
`Plan trips by asking: flights, stays, visas and travel buddies in one app.` (73)

**Full description** [4000]: use the App Store description above.

**Graphics**
- App icon 512×512: `store/play-icon-512.png`
- Feature graphic 1024×500: `store/play-feature-graphic.png`
- Phone screenshots: `store/screenshots/ios-6.9/*.png` (also valid on Play)

**Data safety form**, matching `/privacy`:
- Does the app collect or share user data? **Collects, does not share.**
- Personal info: **Name, Email address, User IDs**; **Other info** (passport details). Optional (only with an account), for **App functionality** and **Account management**.
- Messages: **Other in-app messages** (chats with travellers, assistant chats). For **App functionality**.
- Is data encrypted in transit? **Yes.**
- Can users request deletion? **Yes**, in the app (Profile → account → Delete account). Also give the web link `https://<your-domain>/support` as the deletion request URL.

**Content rating (IARC):** category "Travel". No violence, sexuality or gambling. **Users can interact: Yes** (chat between users). **Shares personal info: Yes** (profiles visible to matches).

**Target audience:** 18 and over.

**Ads:** No.
