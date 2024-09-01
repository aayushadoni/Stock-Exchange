"use client";

interface TradeData {
    price: string;
    quantity: string;
    time: string;
    marketMaker: boolean;
}


import { useEffect, useState } from "react";
import { getDepth, getKlines, getTrades } from "../../utils/httpClient";
import { BidTable } from "./BidTable";
import { AskTable } from "./AskTable";
import { SignalingManager } from "@/app/utils/SignalingManager";
import { TradeTable } from "./TradeTable";

export function Depth({ market }: { market: string }) {
    const [bids, setBids] = useState<[string, string][]>();
    const [asks, setAsks] = useState<[string, string][]>();
    const [tradeData, setTradeData] = useState<TradeData[]>();
    const [price, setPrice] = useState<string>();
    const [selectedTab, setSelectedTab] = useState<'book' | 'trades'>('book');

    useEffect(() => {
        SignalingManager.getInstance().registerCallback("depth", (data: any) => {

            setBids((originalBids) => {
                const bidsAfterUpdate = [...(originalBids || [])];
                for (let i = 0; i < bidsAfterUpdate.length; i++) {
                    for (let j = 0; j < data.bids.length; j++) {
                        if (bidsAfterUpdate[i][0] === data.bids[j][0]) {
                            bidsAfterUpdate[i][1] = data.bids[j][1];
                            break;
                        }
                    }
                }
                return bidsAfterUpdate;
            });

            setAsks((originalAsks) => {
                const asksAfterUpdate = [...(originalAsks || [])];

                for (let i = 0; i < asksAfterUpdate.length; i++) {
                    for (let j = 0; j < data.asks.length; j++) {
                        if (asksAfterUpdate[i][0] === data.asks[j][0]) {
                            asksAfterUpdate[i][1] = data.asks[j][1];
                            break;
                        }
                    }
                }
                return asksAfterUpdate;
            });
        }, `DEPTH-${market}`);

        SignalingManager.getInstance().sendMessage({ "method": "SUBSCRIBE", "params": [`depth.${market}`] });

        getDepth(market).then(d => {
            console.log(d)
            setBids(d.bids.reverse());
            setAsks(d.asks);
        });

        SignalingManager.getInstance().registerCallback("trade", (data: any) => {

            setTradeData((originalTrades) => {
                const newTrade: TradeData = {
                    price: data.price,
                    quantity: data.quantity,
                    time: data.time,
                    marketMaker: data.marketMaker
                };
                const tradesAfterUpdate = [newTrade, ...(originalTrades || [])];
                return tradesAfterUpdate;
            });
            setPrice(data.price);

            

        }, `TRADE-${market}`);

        SignalingManager.getInstance().sendMessage({ "method": "SUBSCRIBE", "params": [`trade.${market}`] });

        // getKlines(market, "1h", 1640099200, 1640100800).then(t => setPrice(t[0].close));
        return () => {
            SignalingManager.getInstance().sendMessage({ "method": "UNSUBSCRIBE", "params": [`depth.${market}`] });
            SignalingManager.getInstance().deRegisterCallback("depth", `DEPTH-${market}`);

            SignalingManager.getInstance().sendMessage({ "method": "UNSUBSCRIBE", "params": [`trade.${market}`] });
            SignalingManager.getInstance().deRegisterCallback("trade", `TRADE-${market}`);
        }
    }, [])

    return <div className="py-3">
        <div className="flex gap-5 ">
            <div>
                <p className={`pb-[2px] cursor-pointer transition-all duration-100 text-sm ${selectedTab === 'book' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:border-b-2 border-white'}`}
                    onClick={() => setSelectedTab('book')}
                >
                    Book
                </p>
            </div>

            <div>
                <p className={`pb-[2px] cursor-pointer transition-all duration-100 text-sm ${selectedTab === 'trades' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:border-b-2 border-white hover:text-white'}`}
                    onClick={() => setSelectedTab('trades')}
                >
                    Trades
                </p>
            </div>
        </div>
        {selectedTab === 'book' ? <div className="py-1">
            <BookTableHeader />
            {asks && <AskTable asks={asks} />}
            {price && <div className="font-medium">{price}</div>}
            {bids && <BidTable bids={bids} />}
        </div> : <div className="py-1">
            <TradeTableHeader />
            {tradeData && <TradeTable trades={tradeData} />}
        </div>}
    </div>
}

function BookTableHeader() {
    return <div className="flex justify-between text-sm pb-2">
        <div className="text-white">Price</div>
        <div className="text-slate-500">Size</div>
        <div className="text-slate-500">Total</div>
    </div>
}

function TradeTableHeader() {
    return <div className="flex justify-between text-sm pb-2">
        <div className="text-white">Price</div>
        <div className="text-slate-500">Qty</div>
        <div className="text-slate-500">Time</div>
    </div>
}