import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YXY AI Practice",
  description: "个人网站、AI 实践知识库和自研工具入口。",
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

