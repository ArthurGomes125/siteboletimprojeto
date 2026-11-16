import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal Escolar | Boletim",
  description: "Acompanhe o desempenho escolar e consulte seu boletim no Portal Escolar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
