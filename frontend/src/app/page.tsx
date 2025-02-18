import Image from "next/image";
import Header from "../components/Header";
import Hero from "../components/Hero";
import PaperFeed from "../components/PaperFeed";
import PumpFunTokens from "../components/PumpFunToken";

export default function Home() {
  return (
    <>
    <Image src="/books.png" alt="books" className="fixed -z-10 right-0 select-none pointer-events-none" draggable="false" width={525.11} height={100} />
    <Header />
    <Hero />
    <PaperFeed />
    <PumpFunTokens />

    </>
  );
}
