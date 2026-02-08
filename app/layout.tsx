import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LangGraph Chat App",
  description: "Chat application powered by LangGraph",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased overflow-hidden selection:bg-blue-500/30" style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)' }}>
        {children}
      </body>
    </html>
  );
}
