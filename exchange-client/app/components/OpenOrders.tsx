import React, { useEffect, useState } from 'react';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

type Order = {
    price: number;
    quantity: number;
    orderId: string;
    filled: number;
    side: "buy" | "sell";
    userId: string;
};

export default function OpenOrders({ market }: { market: string }) {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`/api/v1/order?market=${market}`);
        const data = await response.json();
        setOrders(data);
        console.log(data)
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="w-full text-gray-300 p-4">
      <h2 className="text-xl font-bold mb-4">Open Orders</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 border-b border-gray-800">
            <th className="text-left py-2 px-4">ORDER ID </th>
            <th className="text-right py-2 px-4">PRICE </th>
            <th className="text-right py-2 px-4">QUANTITY </th>
            <th className="text-right py-2 px-4">FILLED </th>
            <th className="text-center py-2 px-4">SIDE </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.orderId} className="border-b border-gray-800">
              <td className="py-2 px-4 font-mono">{order.orderId}</td>
              <td className="text-right py-2 px-4">{order.price.toFixed(2)}</td>
              <td className="text-right py-2 px-4">{order.quantity}</td>
              <td className="text-right py-2 px-4">{order.filled}</td>
              <td className="text-center py-2 px-4">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  order.side === 'buy' ? 'bg-green-800 text-green-300' : 'bg-red-800 text-red-300'
                }`}>
                  {order.side.toUpperCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}