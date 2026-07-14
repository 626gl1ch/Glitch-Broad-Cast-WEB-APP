// Safe Ad Mobility Manager for Web & Capacitor Environments

export async function initializeAdMob() {
  try {
    if (typeof window !== "undefined" && window.Capacitor && window.Capacitor.isNativePlatform()) {
      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.initialize({
        requestTrackingAuthorization: true,
        testingDevices: ['2077ef9a63d2b398840261c8221a0c9b'],
        initializeForTesting: true,
      });
      console.log("Native AdMob Initialized");
    } else {
      console.log("Web Ads Mode Active (Google Adsense Ready)");
    }
  } catch (error) {
    console.log("AdMob notice:", error.message);
  }
}

export async function showInterstitialAd() {
  try {
    if (typeof window !== "undefined" && window.Capacitor && window.Capacitor.isNativePlatform()) {
      const { AdMob } = await import('@capacitor-community/admob');
      const options = {
        adId: 'ca-app-pub-3940256099942544/1033173712',
        isTesting: true
      };
      await AdMob.prepareInterstitial(options);
      await AdMob.showInterstitial();
      return true;
    }
    return true;
  } catch (error) {
    console.log("Ad Interstitial notice:", error.message);
    return true; // Never block actions on web
  }
}
