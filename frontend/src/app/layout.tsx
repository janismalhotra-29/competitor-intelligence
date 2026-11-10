import type { Metadata } from "next";
import "@xenon-kit/web/styles.css";
import { XenonProvider } from "@xenon-kit/web";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Competitor Intelligence",
  description: "Autonomous website monitoring and AI-powered competitor intelligence",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-x-theme="dark"
      data-x-accent="lime"
      data-x-radius="5"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[var(--x-bg)] text-[var(--x-text)]">
        <XenonProvider defaultTheme="dark" defaultAccent="lime" defaultRadius={5}>
          {children}
        </XenonProvider>
      </body>
    </html>
  );
}
