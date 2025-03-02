import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import WalletContextProvider from "@/components/WalletProvider";
import "@/styles/wallet.css";
import { Toaster } from "sonner";


const dm_sans = DM_Sans({ 
  subsets: ["latin"], 
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"] // Include all available weights
});

export const metadata: Metadata = {
  title: "Depapers.fun",
  description: "Tokenize your research papers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dm_sans.className} antialiased`}>
      <Toaster position="top-center" richColors />

      <WalletContextProvider>{children}</WalletContextProvider>
      </body>
    </html>
  );
}
