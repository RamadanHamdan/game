import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "EduQuiz",
  description: "Interactive Quiz Game",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Polyfill structuredClone untuk Android WebView lama (sebelum Chrome 98)
              if (typeof structuredClone === 'undefined') {
                globalThis.structuredClone = function(obj) {
                  if (obj === undefined) return undefined;
                  return JSON.parse(JSON.stringify(obj));
                };
              }
              window.onerror = function(msg, url, lineNo, columnNo, error) {
                alert('JS Error: ' + msg + '\\nLine: ' + lineNo + '\\nURL: ' + url);
                return false;
              };
              window.addEventListener('unhandledrejection', function(event) {
                alert('Promise Error: ' + (event.reason && event.reason.message ? event.reason.message : event.reason));
              });
            `
          }}
        />
        {children}
      </body>
    </html>
  );
}
