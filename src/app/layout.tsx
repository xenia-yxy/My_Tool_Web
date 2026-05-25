import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YXY AI Practice | AI 实践者数字据点",
  description:
    "一个 AI 实践者的公开首页，连接知识库、自研工具、项目展示和 SOP 服务。",
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

