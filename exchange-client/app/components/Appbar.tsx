"use client";

import { usePathname } from "next/navigation";
import { PrimaryButton, SuccessButton, SimulationButon } from "./core/Button"
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react"
import { useState } from "react";
import { FaUser, FaClipboardList, FaWallet, FaSignOutAlt } from 'react-icons/fa';
import { useParams } from "next/navigation";
import {startMarketSimulation} from "../../lib/marketSimulation"

export const Appbar = () => {
    const route = usePathname();
    const router = useRouter()
    const { market } = useParams();

    const { data: session } = useSession();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    const handleSimulation = async (query: 'start' | 'stop', market: string) => {
        try {
          const response = await fetch('/api/v1/marketSimulation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ market, query }),
          });
      
          const data = await response.json();
      
          if (response.ok) {
            console.log(data.message);
          } else {
            console.error('Error:', data.error);
          }
        } catch (error) {
          console.error('Error:', error);
        }
      };

    const handleDeposit = async () => {
        try {
          const response = await fetch('/api/v1/onRamp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
    
          const data = await response.json();
    
          if (data.url) {
            router.push(data.url);
          } else {
            console.error('Error creating payment link');
          }
        } catch (error) {
          console.error('Error:', error);
        }
      };

    return (
        <div className="text-white border-b border-slate-800">
            <div className="flex justify-between items-center p-2">
                <div className="flex">
                    <div className={`text-xl pl-4 flex flex-col justify-center cursor-pointer text-white`} onClick={() => router.push('/')}>
                        Exchange
                    </div>
                    {session ? (
                        <>
                            <div className={`text-sm pt-1 flex flex-col justify-center pl-8 cursor-pointer ${route.startsWith('/markets') ? 'text-white' : 'text-slate-500'}`} onClick={() => router.push('/markets')}>
                                Markets
                            </div>
                            <div className={`text-sm pt-1 flex flex-col justify-center pl-8 cursor-pointer ${route.startsWith('/trade') ? 'text-white' : 'text-slate-500'}`} onClick={() => router.push('/trade/TATA_INR')}>
                                Trade
                            </div>
                        </>
                    ) : (
                        <></>
                    )}
                </div>
                <div className="flex items-center">
                    {session ? (
                        <div className="relative">
                            <button
                                onClick={toggleDropdown}
                                className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 rounded-full p-2"
                            >
                                <FaUser className="text-white" />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute z-20 right-0 mt-2 w-32 rounded-md shadow-lg py-1 bg-slate-700 ring-1 ring-black ring-opacity-5">
                                    <button onClick={() => router.push('/orderHistory')} className="flex items-center w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600">
                                        <FaClipboardList className="mr-3" /> All Orders
                                    </button>
                                    <button onClick={() => router.push('/balances')} className="flex items-center w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600">
                                        <FaWallet className="mr-3" /> Balances
                                    </button>
                                    <button onClick={() => signOut()} className="flex items-center w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600">
                                        <FaSignOutAlt className="mr-3" /> Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <SuccessButton onClick={() => router.push('/login')}>Login</SuccessButton>
                            <PrimaryButton onClick={() => router.push('/register')}>Register</PrimaryButton>
                        </>
                    )}
                    {session && (
                        <div className="ml-4 flex">
                            <SuccessButton onClick={handleDeposit}>Deposit</SuccessButton>
                            <PrimaryButton>Withdraw</PrimaryButton>
                            {
                               route.startsWith('/trade') ? <SimulationButon  onClick={() => handleSimulation('start', market as string)}>Market</SimulationButon> : <></>
                            }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}