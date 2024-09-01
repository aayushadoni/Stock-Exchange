"use client"

import React, { useState, useEffect } from 'react';
import { FaWallet, FaLock, FaExchangeAlt } from 'react-icons/fa';
import { BiRefresh } from 'react-icons/bi';

interface Balance {
  id: number;
  userid: number;
  asset: string;
  available: number;
  locked: number;
  updatedat: string;
}

const BalancePage: React.FC = () => {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = async (): Promise<void> => {
    setError(null);
    try {
      const response = await fetch('/api/v1/balances');
      if (!response.ok) {
        throw new Error('Failed to fetch balances');
      }
      const data: Balance[] = await response.json();
      setBalances(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  return (
    <div className="min-h-screen bg-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-900 shadow-xl rounded-lg overflow-hidden border border-gray-800">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-800">
            <h1 className="text-2xl font-bold text-white">Your Balances</h1>
            <button 
              onClick={fetchBalances}
              className="flex items-center text-blue-400 hover:text-blue-300"
            >
              <BiRefresh className="mr-1" /> Refresh
            </button>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {error ? (
              <div className="text-center py-4 text-red-400">
                <p>{error}</p>
                <button 
                  onClick={fetchBalances}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                >
                  Try Again
                </button>
              </div>
            ) : balances.length === 0 ? (
              <p className="text-center text-gray-400">No balances found.</p>
            ) : (
              balances.map((balance) => (
                <div key={balance.id} className="mb-6 last:mb-0">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold text-white">{balance.asset}</h2>
                    <span className="text-sm font-medium text-gray-400">
                      Last updated: {new Date(balance.updatedat).toDateString()}
                    </span>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex items-center">
                      <FaWallet className="text-green-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-400">Available</p>
                        <p className="text-lg font-semibold text-white">{balance.available}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FaLock className="text-yellow-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-400">Locked</p>
                        <p className="text-lg font-semibold text-white">{balance.locked}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FaExchangeAlt className="text-blue-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-400">Total</p>
                        <p className="text-lg font-semibold text-white">{balance.available + balance.locked}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalancePage;