import { Lexend } from "next/font/google";
import "./globals.css";
import Link from "next/link";
const lexend = Lexend({
  subsets: ["latin"],
  variable: '--font-lexend',
  display: 'swap',
});

export const metadata = {
  title: "The Smart Companion",
  description: "Neuro-Inclusive Executive Function Support",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={lexend.variable}>
      <body className={`${lexend.variable} font-lexend bg-black text-white antialiased`}>
        {/* Navigation - Minimalist to prevent overwhelm */}
        {children}
      </body>
    </html>
  );
}