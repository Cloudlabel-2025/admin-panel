const config = {
  appId: 'com.adminpanel.app',
  appName: 'Admin Panel',
  server: {
    url: "https://admin-panel-umber-zeta.vercel.app",
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1a1a1a",
      showSpinner: true,
      spinnerColor: "#d4af37"
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#1a1a1a"
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
    allowsLinkPreview: false
  }
};

module.exports = config;