import Constants from "expo-constants";
import mobileAds, { AdsConsent, TestIds } from "react-native-google-mobile-ads";

// Google AdMob, used only when no direct sponsor fills a slot (see the
// website repo's docs/ADS.md). Google's consent form (UMP) is shown first
// where the law requires it; ads are requested only if Google says we may.

const extra = (Constants.expoConfig?.extra ?? {}) as { admobBannerId?: string };

/** Real unit ID from app.json → extra.admobBannerId; Google's test unit in dev. */
export const ADMOB_BANNER_ID = extra.admobBannerId || (__DEV__ ? TestIds.ADAPTIVE_BANNER : "");

let ready: Promise<boolean> | null = null;

export function admobReady(): Promise<boolean> {
  if (!ADMOB_BANNER_ID) return Promise.resolve(false);
  ready ??= (async () => {
    try {
      await AdsConsent.requestInfoUpdate();
      const info = await AdsConsent.loadAndShowConsentFormIfRequired();
      if (!info.canRequestAds) return false;
      await mobileAds().initialize();
      return true;
    } catch {
      return false;
    }
  })();
  return ready;
}
