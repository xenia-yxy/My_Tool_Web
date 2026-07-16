import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xenia | 个人 AI 实践网站",
  description:
    "Xenia 的个人网站，用来记录 AI 实践、工具实验和数字系统构建。部分内容和工具仅登录后可见。",
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

