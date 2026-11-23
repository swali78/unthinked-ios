# Developer accounts (you do these yourself)

Only the account owner can sign up, pay and verify identity, so Claude can't do these steps for you. Start both now: verification can take from a day to two weeks, and the code work can carry on while you wait.

First decide one thing: **personal or organisation account?**

- **Personal (individual):** fastest. Your own legal name shows as the seller/developer on the store.
- **Organisation:** your company name shows instead, but you need a registered business (for example a Pvt Ltd or LLP) and a free **D-U-N-S number**. Request it at <https://developer.apple.com/enroll/duns-lookup/>; it takes about 5 to 14 days in India. Google Play uses the same D-U-N-S number.

If you don't have a company yet, go personal now. You can transfer the apps to an organisation account later.

---

## Apple Developer Program (iPhone)

**Cost:** US$99 a year, charged in rupees to your card.
**You need:** an Apple ID with two-factor authentication on, your legal name and address, a credit or debit card that works for international payments, and ideally an iPhone.

1. Turn on two-factor authentication for your Apple ID (iPhone: Settings → your name → Sign-In & Security).
2. On your iPhone, install the **Apple Developer** app from the App Store. Enrolling in the app is the quickest route for individuals: open it → **Account** → **Enroll Now**. (No iPhone? Use <https://developer.apple.com/programs/enroll/> in a browser.)
3. Pick **Individual / Sole Proprietor** (or **Organisation** with your D-U-N-S number).
4. Enter your legal name exactly as on your government ID, then your address and phone.
5. Scan your ID if asked, accept the agreement and pay.
6. Wait for the confirmation email ("Welcome to the Apple Developer Program"). Usually 1 to 2 days, longer for organisations.
7. Sign in at <https://appstoreconnect.apple.com>. Go to **Business** (previously Agreements, Tax and Banking) and finish the **Free Apps** agreement. Add bank and tax details later if the app will sell things through Apple.

**You'll also need a Mac** with Xcode to build and upload the iPhone app. If you don't have one, a cloud build service such as Codemagic or Ionic Appflow can build and upload it for you. Tell Claude which you have.

## Google Play Console (Android)

**Cost:** US$25, one time.
**You need:** a Google account (preferably a new one just for the business), a government ID (Aadhaar, PAN or passport), a card for the fee and an Android phone.

1. Go to <https://play.google.com/console/signup> and sign in with the Google account you'll use for the app.
2. Choose **Yourself** (personal) or **An organisation or business** (with your D-U-N-S number).
3. Fill in the developer name shown on the store, your contact email and phone, and a public address if you're an organisation.
4. Pay the US$25 fee.
5. Verify your identity by uploading your ID when asked. This takes a few days.
6. Verify an Android device: install the **Google Play Console** app on your Android phone and sign in when asked.

**New personal accounts have one extra rule:** before you can publish to everyone, you must run a **closed test with at least 12 testers who stay opted in for 14 days in a row**. Line up 12 friends with Android phones and Gmail addresses now. Organisation accounts skip this.

---

## When you're done

Tell Claude in this project:

- which account type you chose (personal or organisation), and the exact developer/seller name;
- your support email for the store pages;
- whether you have a Mac.

Claude will then set the app's legal details, build the apps and prepare the uploads. Nothing is submitted to either store without your go-ahead.
