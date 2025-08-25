import { Roboto } from "next/font/google";
import "./globals.css";
import PreloadMapImages from "../components/PreloadMapImages";

const roboto = Roboto({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata = {
  title: "POLRES BERAU - Peta Lantai Interaktif",
  description: "Sistem peta lantai interaktif Polres Berau Kalimantan Timur",
  keywords: "polres berau, peta lantai, kalimantan timur, polri",
};

// ✅ viewport dipisah dari metadata
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: "no",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/* Font Awesome tetap manual */}
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/css/all.min.css"
          rel="stylesheet"
        />
      </head>
      <body className={`${roboto.variable} antialiased font-roboto`}>
        <PreloadMapImages />
        {children}
      </body>
    </html>
  );
}
