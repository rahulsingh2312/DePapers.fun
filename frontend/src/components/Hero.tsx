import { SiSolana } from "react-icons/si";
import ConnectWallet from "./ConnectWallet";
const Hero = () => {
  return (
    <main className="p-10">
        <div className="flex items-center w-fit">
        <h1 className="text-9xl max-md:text-8xl max-sm:text-6xl font-light bg-gradient-to-br from-black to-[#966300]  bg-clip-text text-transparent">
        Tokenize <br/>Unpublished Papers

        </h1>
        <SiSolana className="text-[#966300]" />

        </div>

        <div className="mt-6 flex items-center justify-center gap-6 w-fit">
            <img src="/publishPaper.png" className="select-none hover:invert cursor-pointer transition-all hover:translate-y-2" draggable="false" alt="" />
            <ConnectWallet  />

        </div>
    </main>
  )
}

export default Hero
