"use client"

import React, { useEffect, useState } from 'react';
import OrderCard from '@/app/components/OrderCard';
import { FaFilter, FaCalendarAlt } from 'react-icons/fa';

type Order = {
  orderid: string;
  market: string;
  price: string;
  quantity:string;
  side: 'buy' | 'sell';
  executedqty: string | null;
  updatedat: string;
};

export default function Page() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [filters, setFilters] = useState({
    side: 'all',
    status: 'all',
    date: '',
  });

  // Fetch orders from the API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/v1/allOrders');
        const data = await response.json();
        const formattedOrders = data.map((order: Order) => ({
          ...order,
          updatedat: new Date(order.updatedat).toLocaleString(), // Format the date here
        }));
        setOrders(formattedOrders);
        setFilteredOrders(formattedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  useEffect(() => {
    let filtered = orders;

    if (filters.side !== 'all') {
      filtered = filtered.filter(order => order.side === filters.side);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(order => {
        const isFinished = order.quantity === order.executedqty;
        return filters.status === 'finished' ? isFinished : !isFinished;
      });
    }

    if (filters.date) {
      filtered = filtered.filter(order => new Date(order.updatedat).toDateString() === new Date(filters.date).toDateString());
    }

    setFilteredOrders(filtered);
  }, [filters, orders]);

  return (
    <div className="w-full flex flex-col justify-center items-center p-4">
      {/* Filter Bar */}
      <div className="w-full max-w-6xl mb-6 bg-gray-900 p-4 rounded-xl shadow-lg">
        <div className="flex items-center mb-4 text-gray-300">
          <FaFilter className="mr-2" />
          <h2 className="text-md font-semibold">Filter Orders</h2>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="side" className="block text-xs font-medium text-gray-400 mb-1">Side</label>
            <select
              id="side"
              name="side"
              value={filters.side}
              onChange={handleFilterChange}
              className="w-full text-sm p-1 bg-gray-700 text-white rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option className="text-sm" value="all">All Sides</option>
              <option className="text-sm" value="buy">Buy</option>
              <option className="text-sm" value="sell">Sell</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label htmlFor="status" className="block text-xs font-medium text-gray-400 mb-1">Status</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full text-sm p-1 bg-gray-700 text-white rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option className="text-sm" value="all">All Statuses</option>
              <option className="text-sm" value="finished">Finished</option>
              <option className="text-sm" value="live">Live</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label htmlFor="date" className="block text-xs font-medium text-gray-400 mb-1">Date</label>
            <div className="relative">
              <input
                type="date"
                id="date"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
                className="w-full text-sm p-1 bg-gray-700 text-white rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-2 gap-4 w-full p-2">
        {filteredOrders?.map((order) => (
          <OrderCard key={order.orderid} o={order} />
        ))}
      </div>
    </div>
  );
}
