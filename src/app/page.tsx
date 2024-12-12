"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Page = () => {
  const [toggleMenu, setToggleMenu] = useState(false);
  const router = useRouter();

  return (
    <>
      <header className="fixed top-0 left-0 w-full bg-white px-10 py-5 flex justify-between items-center border-b-[0.1px] border-gray-200 z-50">
        <Link href="#">
          <p className="text-black text-2xl font-bold">Your Logo</p>
        </Link>

        <nav className="w-2/3 hidden lg:flex items-center justify-end">
          <nav className="mr-4">
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Login
            </button>
          </nav>
          <nav>
            <button
              onClick={() => router.push('/signup')}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Sign-Up
            </button>
          </nav>
        </nav>

        <button 
          onClick={() => setToggleMenu(!toggleMenu)} 
          className="block lg:hidden"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-12 h-12 text-black"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" 
            />
          </svg>
        </button>
      </header>

      {toggleMenu && (
        <nav className="block lg:hidden bg-white text-black fixed top-20 left-0 w-full">
          <ul className="flex flex-col gap-10 items-center py-10">
            <li>
              <button
                onClick={() => router.push('/signup')}
                className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Sign-Up
              </button>
            </li>
            <li>
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Login
              </button>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
};

export default Page;