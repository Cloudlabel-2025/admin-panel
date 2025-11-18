"use client";

import { useState, useEffect } from 'react';

// Custom hook for device detection
export const useDeviceDetection = () => {
  const [device, setDevice] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isIOS: false,
    isAndroid: false,
    screenWidth: 0,
    screenHeight: 0,
    orientation: 'portrait'
  });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      const isMobile = screenWidth <= 768;
      const isTablet = screenWidth > 768 && screenWidth <= 1024;
      const isDesktop = screenWidth > 1024;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';

      setDevice({
        isMobile,
        isTablet,
        isDesktop,
        isIOS,
        isAndroid,
        screenWidth,
        screenHeight,
        orientation
      });
    };

    // Initial detection
    detectDevice();

    // Listen for resize events
    const handleResize = () => {
      detectDevice();
    };

    // Listen for orientation change
    const handleOrientationChange = () => {
      setTimeout(detectDevice, 100); // Small delay for orientation change
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return device;
};

// Mobile-specific component wrapper
export const MobileWrapper = ({ children, fallback = null }) => {
  const { isMobile } = useDeviceDetection();
  
  if (typeof window === 'undefined') {
    return children; // Server-side rendering
  }
  
  return isMobile ? children : fallback;
};

// Desktop-specific component wrapper
export const DesktopWrapper = ({ children, fallback = null }) => {
  const { isDesktop } = useDeviceDetection();
  
  if (typeof window === 'undefined') {
    return children; // Server-side rendering
  }
  
  return isDesktop ? children : fallback;
};

// Responsive component that renders different content based on device
export const ResponsiveComponent = ({ mobile, tablet, desktop }) => {
  const { isMobile, isTablet, isDesktop } = useDeviceDetection();
  
  if (typeof window === 'undefined') {
    return mobile; // Default to mobile on server-side
  }
  
  if (isMobile) return mobile;
  if (isTablet) return tablet || mobile;
  if (isDesktop) return desktop || tablet || mobile;
  
  return mobile;
};

// Hook for handling mobile-specific behaviors
export const useMobileBehavior = () => {
  const device = useDeviceDetection();
  
  const preventZoom = () => {
    if (device.isMobile) {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );
      }
    }
  };

  const enableSmoothScrolling = () => {
    if (device.isMobile) {
      document.documentElement.style.scrollBehavior = 'smooth';
      document.body.style.webkitOverflowScrolling = 'touch';
    }
  };

  const handleKeyboardResize = (callback) => {
    if (device.isMobile) {
      let initialHeight = window.innerHeight;
      
      const handleResize = () => {
        const currentHeight = window.innerHeight;
        const heightDifference = initialHeight - currentHeight;
        
        if (heightDifference > 150) {
          // Keyboard is likely open
          callback({ keyboardOpen: true, heightDifference });
        } else {
          // Keyboard is likely closed
          callback({ keyboardOpen: false, heightDifference: 0 });
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  };

  const addTouchFeedback = (element) => {
    if (device.isMobile && element) {
      element.addEventListener('touchstart', () => {
        element.style.transform = 'scale(0.98)';
        element.style.transition = 'transform 0.1s ease';
      });
      
      element.addEventListener('touchend', () => {
        element.style.transform = 'scale(1)';
      });
    }
  };

  return {
    ...device,
    preventZoom,
    enableSmoothScrolling,
    handleKeyboardResize,
    addTouchFeedback
  };
};

// Service Worker registration utility
export const registerServiceWorker = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// PWA install prompt utility
export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      }
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  return {
    showInstallPrompt,
    installPWA,
    dismissInstallPrompt
  };
};

export default {
  useDeviceDetection,
  MobileWrapper,
  DesktopWrapper,
  ResponsiveComponent,
  useMobileBehavior,
  registerServiceWorker,
  usePWAInstall
};