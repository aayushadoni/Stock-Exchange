"use client";
import { MarketBar } from "@/app/components/MarketBar";
import { SwapUI } from "@/app/components/SwapUI";
import { TradeView } from "@/app/components/TradeView";
import { Depth } from "@/app/components/depth/Depth";
import { useParams } from "next/navigation";
import OpenOrders from "@/app/components/OpenOrders";

export default function Page() {
    const { market } = useParams();
    
    return <div className="flex flex-row flex-1">
        <div className="flex flex-col flex-1">
            <MarketBar market={market as string} />
            <div className="flex flex-row gap-1 flex-1 h-full">
                <div className="flex flex-col flex-1 h-full overflow-y-hidden">
                    <TradeView market={market as string} />
                    <OpenOrders market={market as string} />
                </div>
                <div className="w-[1px] flex-col "></div>
                <div className="flex flex-col w-[250px]">
                    <Depth market={market as string} /> 
                </div>
            </div>
        </div>
        <div className="w-[1px] flex-col "></div>
        <div>
            <div className="flex flex-col gap-1 w-[250px]">
                <SwapUI market={market as string} />
            </div>
        </div>
    </div>
}