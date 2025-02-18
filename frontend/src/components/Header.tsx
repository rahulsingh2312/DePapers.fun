import Image from 'next/image'
const Header = () => {
  return (
    <div className='w-full z-10 h-16 p-10 text-black flex items-center justify-start'>
      <Image src='/logo.png' alt='logo' width={40} height={30} />
    </div>
  )
}

export default Header
