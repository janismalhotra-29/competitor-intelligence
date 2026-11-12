import type { Metadata } from "next";
import "@xenon-kit/web/styles.css";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";

export const metadata: Metadata = {
  title: "AI Competitor Intelligence | Xenon Edition",
  description: "Autonomous website monitoring and AI-powered competitor intelligence built with Xenon design system",
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
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
