import "./globals.css";
import { DM_Mono, Syne } from "next/font/google";

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-syne",
});

export const metadata = {
  title: "scrobble.stats",
  description: "Music listening dashboard powered by Last.fm",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${dmMono.variable} ${syne.variable} bg-[#0a0a0b]`}
    >
      <body className="font-mono antialiased">{children}</body>
    </html>
  );
}
