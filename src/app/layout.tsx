import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "创作实验室",
  description: "从商品视觉到内容创作的一体化工作台。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

