import type { Metadata } from "next";
import "./globals.css";

const title = "Prompt Gym | Practical prompt training";
const description =
  "Write one prompt, run it against six hidden cases, and see exactly what broke. A hands-on game for learning to write prompts that generalise.";

export const metadata: Metadata = {
  metadataBase: new URL("https://prompt-gym-three.vercel.app"),
  title,
  description,
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Prompt Gym",
    title,
    description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Prompt Gym landing page" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700;6..12,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
