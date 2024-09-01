interface TradeData {
    price: string;
    quantity: string;
    time: string;
    marketMaker: boolean;
}

export const TradeTable = ({ trades }: { trades: TradeData[] }) => {
    const relevantTrades = trades.slice(0, 21);
    return (
        <div>
            {relevantTrades.map((t, index) => (
                <Trade key={index} price={t.price} quantity={t.quantity} time={t.time} marketMaker={t.marketMaker} />
            ))}
        </div>
    );
}

function Trade({ price, quantity, time, marketMaker }: { price: string, quantity: string, time: string, marketMaker: boolean }) {
    return (
        <div>
            <div className="flex justify-between text-sm w-full pt-1">
                <   div className={marketMaker ? "text-red-500" : "text-green-500"}>{price}</div>
                <div>{quantity}</div>
                <div className="text-zinc-400">{time}</div>
            </div>
        </div>
    );
}
