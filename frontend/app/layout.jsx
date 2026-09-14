import "../src/styles/global.css";
import "../src/styles/layout.css";
import Script from "next/script";
import ErrorBoundary from "../src/components/ErrorBoundary";

export const metadata = {
  title: "RythuJanaSethu",
  description: "Bridging farmers and customers with marketplace for fresh farm produce.",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "RythuJanaSethu",
    statusBarStyle: "black-translucent",
  }
};

export const viewport = {
  themeColor: "#1a4a2e",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="google" content="notranslate" />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌾</text></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Poppins:wght@300;400;500;600;700;800&family=Quicksand:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: `
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
        <script dangerouslySetInnerHTML={{ __html: `
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
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              for(let registration of registrations) {
                registration.unregister();
              }
            });
          }
        `}} />
        <ErrorBoundary>
          <div id="root">
            {children}
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
