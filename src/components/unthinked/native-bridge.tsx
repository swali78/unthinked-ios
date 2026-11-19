"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";

/**
 * Native glue for the iOS and Android apps. Does nothing in a browser.
 * - Android's hardware back button walks the in-app history, and leaves the
 *   app from the first screen instead of doing nothing.
 * - Light status bar text over the dark UI.
 */
export function NativeBridge() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cleanup: (() => void) | undefined;
    (async () => {
      const [{ App }, { StatusBar, Style }, { SplashScreen }] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/status-bar"),
        import("@capacitor/splash-screen"),
      ]);
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      SplashScreen.hide().catch(() => {});
      const handle = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) window.history.back();
        else App.exitApp();
      });
      cleanup = () => handle.remove();
    })();
    return () => cleanup?.();
  }, []);
  return null;
}
