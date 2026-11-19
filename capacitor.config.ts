import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Native iOS and Android shells for Unthinked.
 *
 * The app has server routes (the AI chat at /api/chat), so it can't be a
 * static export bundled into the binary. Instead the native app loads the
 * deployed site from UNTHINKED_APP_URL, and `native-shell/` is only the
 * offline fallback page Capacitor needs as its webDir.
 *
 *   UNTHINKED_APP_URL=https://your-deploy.example npx cap sync
 *
 * For a phone on the same Wi-Fi as `npm run dev`, point it at your machine:
 *   UNTHINKED_APP_URL=http://192.168.1.20:3000 npx cap run android
 */
const appUrl = process.env.UNTHINKED_APP_URL;

const config: CapacitorConfig = {
  // The bundle ID is permanent once the app is on a store. Change it before
  // the first upload if you want a different one (reverse domain you own).
  appId: "app.unthinked.travel",
  appName: "Unthinked",
  webDir: "native-shell",
  backgroundColor: "#0b0b0c",
  server: appUrl
    ? {
        url: appUrl,
        cleartext: appUrl.startsWith("http://"),
        errorPath: "index.html",
      }
    : undefined,
  ios: {
    contentInset: "never",
    scheme: "Unthinked",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#0b0b0c",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0b0b0c",
      overlaysWebView: true,
    },
  },
};

export default config;
