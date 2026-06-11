import type { Metadata } from "next";
import { Fraunces, Schibsted_Grotesk } from "next/font/google";
import { SiteNav } from "@/components/shared/SiteNav";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "IELTS Writing Coach",
    template: "%s",
  },
  description:
    "Step-by-step IELTS Writing Task 2 feedback for Nepali students. Build your essay one section at a time, or get a full analysis with band score estimates.",
  openGraph: {
    title: "IELTS Writing Coach",
    description:
      "Step-by-step IELTS Writing Task 2 feedback for Nepali students. Every piece of feedback quotes your own words.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${schibsted.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteNav />
        <div className="bg-ruled flex flex-1 flex-col print:bg-none">{children}</div>
      </body>
    </html>
  );
}
