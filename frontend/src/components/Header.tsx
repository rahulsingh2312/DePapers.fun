"use client";
import { useState } from "react";
import Image from "next/image";
import { FaTimes } from "react-icons/fa";
const Header = () => {
  const [openModal, setOpenModal] = useState(false);
  return (
    <div className="w-full z-10 h-16 p-10 text-black flex items-center justify-between">
      <Image
        src="/logov1.png"
        className="rounded-md border border-orange-400 shadow-md"
        alt="logo"
        width={40}
        height={30}
      />
      <div
        onClick={() => {
          setOpenModal(true);
        }}
        className="px-2 py-1 bg-gradient-to-b cursor-pointer text-sm font-medium from-white to-orange-100 rounded-xl border border-orange-400"
      >
        How it Works?
      </div>
      {openModal && (
        <div className="fixed top-0 z-50 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
          <div className="xl:w-1/2 lg:w-8/12 md:w-9/12 h-fit bg-white rounded-xl overflow-clip">
            <div className="flex justify-end">
              <div
                onClick={() => {
                  setOpenModal(false);
                }}
                className="text-2xl font-normal absolute m-4 cursor-pointer"
              >
                <FaTimes />
              </div>
            </div>
              <img src="howitworks.png" alt="" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
