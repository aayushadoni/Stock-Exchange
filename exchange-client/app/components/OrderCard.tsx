import React from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

type Order = {
  orderid: string;
  market: string;
  price: string;
  quantity: string;
  side: 'buy' | 'sell';
  executedqty: string | null;
  updatedat: string;
};

interface OrderCardProps {
  o: Order;
}

const OrderCard: React.FC<OrderCardProps> = ({ o }) => {
  const isLiveOrder = o.quantity !== o.executedqty;
  const sideColor = o.side === 'buy' ? 'bg-green-400' : 'bg-red-400';
  const sideColorPing = o.side === 'buy' ? 'bg-green-500' : 'bg-red-500';
  
  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] max-w-6xl">
      <div className={`h-1 ${sideColor} ${isLiveOrder ? 'animate-pulse' : ''}`} />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-full ${sideColor}`}>
              {o.side === 'buy' ? (
                <FaArrowUp className="text-white" />
              ) : (
                <FaArrowDown className="text-white" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{o.market}</h2>
              <p className={`text-sm font-medium ${o.side === 'buy' ? 'text-green-400' : 'text-red-400'} uppercase`}>
                {o.side}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Order ID</p>
            <p className="text-sm font-medium text-gray-300">{o.orderid}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Quantity</p>
            <p className="font-medium text-white">{o.quantity}</p>
          </div>
          <div>
            <p className="text-gray-400">Executed</p>
            <p className="font-medium text-white">{o.executedqty || '0'}</p>
          </div>
          <div>
            <p className="text-gray-400">Price</p>
            <p className="font-medium text-white">{o.price}</p>
          </div>
          <div>
            <p className="text-gray-400">Updated</p>
            <p className="font-medium text-white">{o.updatedat}</p>
          </div>
        </div>
        
        {isLiveOrder ? (
          <div className="mt-4 text-xs font-medium text-gray-400 flex relative items-center">
            <span className={`inline-block w-2 h-2 rounded-full ${sideColor} mr-2 animate-ping`}></span>
            <span className={`absolute w-3 h-3 rounded-full ${sideColorPing} mr-2 `}></span>
            Live Order
          </div>
        ) : 
        (
          <div className="mt-4 text-xs font-medium text-gray-400 flex items-center">
            <span className={`inline-block w-2 h-2 rounded-full ${sideColor} mr-2`}></span>
            Finished Order
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;