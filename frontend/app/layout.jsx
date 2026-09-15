import "../src/styles/global.css";
import "../src/styles/layout.css";
import Script from "next/script";
import ErrorBoundary from "../src/components/ErrorBoundary";
import { Providers } from "./providers";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://rythujanasethu.vercel.app"),
  title: "RythuJanaSethu — Fresh Farm Produce Marketplace",
  description: "India's trusted farm based website marketplace. Buy fresh organic vegetables, fruits, grains directly from verified farmers. Voice-powered, multilingual, GPS-enabled.",
  manifest: "/manifest.json",
  keywords: ["farm produce", "organic vegetables", "farmers marketplace", "RythuSethu", "fresh fruits", "Telangana farming", "direct from farm"],
  authors: [{ name: "RythuJanaSethu Team" }],
  creator: "RythuJanaSethu",
  publisher: "RythuJanaSethu",
  applicationName: "RythuJanaSethu",
  appleWebApp: {
    title: "RythuJanaSethu",
    statusBarStyle: "black-translucent",
    capable: true,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://rythujanasethu.vercel.app",
    siteName: "RythuJanaSethu",
    title: "RythuJanaSethu",
    description: "Buy fresh organic produce directly from verified farmers. Voice-powered, multilingual marketplace.",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "RythuJanaSethu Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RythuJanaSethu — Fresh Farm Produce",
    description: "Buy fresh organic produce directly from verified farmers.",
    images: ["/icons/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export const viewport = {
  themeColor: "#1a4a2e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="google" content="notranslate" />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌾</text></svg>" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Poppins:wght@300;400;500;600;700;800&family=Quicksand:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{
          __html: `
          body { top: 0 !important; position: static !important; }
          .skiptranslate, .skiptranslate iframe, iframe.skiptranslate, .goog-te-banner-frame, iframe.goog-te-banner-frame {
            display: none !important; visibility: hidden !important; height: 0 !important; width: 0 !important; opacity: 0 !important; pointer-events: none !important;
          }
          .goog-logo-link, .goog-te-gadget-icon, img.goog-te-gadget-icon { display: none !important; visibility: hidden !important; opacity: 0 !important; }
          .goog-te-gadget { color: transparent !important; font-size: 0 !important; }
          .goog-te-gadget span, .goog-te-gadget a { display: none !important; }
          .goog-te-gadget .goog-te-combo { margin: 0 !important; padding: 4px !important; border-radius: 4px !important; font-size: 14px !important; color: #000 !important; }
          #goog-gt-tt, .goog-te-balloon-frame, .goog-tooltip, .goog-tooltip:hover, .goog-text-highlight { display: none !important; box-shadow: none !important; border: none !important; background: transparent !important; }
          .VIpgJd-ZVi9od-aOH6Bb-sdDASd, .VIpgJd-ZVi9od-ORHb-OEVmcd, .VIpgJd-ZVi9od-vH1Gmf, .VIpgJd-y6EKle { display: none !important; visibility: hidden !important; }
        `}} />
        <script dangerouslySetInnerHTML={{
          __html: `
          if (typeof Node === 'function' && Node.prototype) {
            const originalRemoveChild = Node.prototype.removeChild;
            Node.prototype.removeChild = function (child) {
              if (child.parentNode !== this) return child;
              return originalRemoveChild.apply(this, arguments);
            };
            const originalInsertBefore = Node.prototype.insertBefore;
            Node.prototype.insertBefore = function (newNode, referenceNode) {
              if (referenceNode && referenceNode.parentNode !== this) return newNode;
              return originalInsertBefore.apply(this, arguments);
            };
          }
        `}} />
      </head>
      <body>
        <div id="google_translate_element" style={{ display: "none" }}></div>
        <Script
          id="google-translate-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              function googleTranslateElementInit() {
                new google.translate.TranslateElement({
                  pageLanguage: 'en',
                  includedLanguages: 'en,te,hi,kn,ta,ml,mr,gu,bn,pa,ur,or,as',
                  autoDisplay: false
                }, 'google_translate_element');
              }
            `,
          }}
        />
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="lazyOnload"
        />
        {/* Register Service Worker for PWA */}
        <script dangerouslySetInnerHTML={{
          __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js')
                .then(function(reg) { console.log('🟢 SW registered:', reg.scope); })
                .catch(function(err) { console.warn('SW registration failed:', err); });
            });
          }
        `}} />
        <ErrorBoundary>
          <div id="root">
            <Providers>
              {children}
            </Providers>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
