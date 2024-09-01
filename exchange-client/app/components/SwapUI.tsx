"use client";
import { useState } from "react";
import { HiCurrencyRupee } from "react-icons/hi2";
import { SiTata, SiNvidia, SiRelianceindustrieslimited, SiHdfcbank, SiIcicibank, SiAirtel, SiDell, SiHcl, SiHp, SiTcs  } from "react-icons/si";
import { useSession } from "next-auth/react"

export function SwapUI({ market }: { market: string }) {
    const [orderPrice, setOrderPrice] = useState('');
    const [orderQuantity, setOrderQuantity] = useState('')
    const [activeTab, setActiveTab] = useState('buy');
    const [type, setType] = useState('limit');
    const { data: session } = useSession();

    const handleSubmit = async () => {
        const side = activeTab === 'buy' ? 'buy' : 'sell';
        const price = type === 'limit' ? orderPrice : '';
        const quantity = orderQuantity;
        const userId = session?.user.id;

        const response = await fetch('/api/v1/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ market, price, quantity, side, userId }),
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Order successful:', result);
        } else {
            const error = await response.json();
            console.error('Order failed:', error);
        }
    };

    const getMarketIcon = () => {
        switch (market) {
            case 'TATA_INR':
                return <SiTata size={30} className="text-white" />;
            case 'NVIDIA_INR':
                return <SiNvidia size={30} className="text-white" />;
            case 'RELIANCE_INR':
                return <SiRelianceindustrieslimited size={30} className="text-white" />;
            case 'HDFC_INR':
                return <SiHdfcbank size={30} className="text-white" />;
            case 'ICICI_INR':
                return <SiIcicibank size={30} className="text-white" />;
            case 'AIRTEL_INR':
                return <SiAirtel size={30} className="text-white" />;
            case 'DELL_INR':
                return <SiDell size={30} className="text-white" />;
            case 'HCL_INR':
                return <SiHcl size={30} className="text-white" />;
            case 'HP_INR':
                return <SiHp size={30} className="text-white" />;
            case 'TCS_INR':
                return <SiTcs size={30} className="text-white" />;
            default:
                return <HiCurrencyRupee size={30} className="text-green-600" />;
        }
    };



    return <div>
        <div className="flex flex-col mx-1">
            <div className="flex flex-row gap-1 h-[60px]">
                <BuyButton activeTab={activeTab} setActiveTab={setActiveTab} />
                <SellButton activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
            <div className="flex flex-col gap-1">
                <div className="px-3">
                    <div className="flex flex-row flex-0 gap-5 undefined">
                        <LimitButton type={type} setType={setType} />
                        <MarketButton type={type} setType={setType} />
                    </div>
                </div>
                <div className="flex flex-col px-3">
                    <div className="flex flex-col flex-1 gap-3 text-baseTextHighEmphasis">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between flex-row">
                                <p className="text-xs font-normal text-baseTextMedEmphasis">Available Balance</p>
                                {activeTab === 'buy' ? <p className="font-medium text-xs text-baseTextHighEmphasis">36.94 USDC</p> : <p className="font-medium text-xs text-baseTextHighEmphasis">36.94 SOL</p>}
                            </div>
                        </div>
                        {
                            type === "limit" ?

                                <div className="flex flex-col gap-2">
                                    <p className="text-xs font-normal text-baseTextMedEmphasis">
                                        Price
                                    </p>
                                    <div className="flex flex-col relative">
                                        <input step="0.01" placeholder="0" className="h-12 rounded-lg border-2 border-solid border-baseBorderLight bg-[var(--background)] pr-12 text-right text-2xl leading-9 text-[$text] placeholder-baseTextMedEmphasis ring-0 transition focus:border-accentBlue focus:ring-0" type="text" onChange={(e) => setOrderPrice(e.target.value)} />
                                        <div className="flex flex-row absolute right-1 top-1 py-1 px-2">
                                            <div className="relative">
                                                <HiCurrencyRupee size={30} className="text-green-600" />
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs font-normal text-baseTextMedEmphasis">
                                        Quantity
                                    </p>
                                    <div className="flex flex-col relative">
                                        <input step="0.01" placeholder="0" className="h-12 rounded-lg border-2 border-solid border-baseBorderLight bg-[var(--background)] pr-12 text-right text-2xl leading-9 text-[$text] placeholder-baseTextMedEmphasis ring-0 transition focus:border-accentBlue focus:ring-0" type="text" onChange={(e) => setOrderQuantity(e.target.value)} />
                                        <div className="flex flex-row absolute right-1 top-1 py-1 px-2">
                                            <div className="relative">
                                                {getMarketIcon()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end flex-row">
                                        <p className="font-medium pr-2 text-xs text-baseTextMedEmphasis">≈ 0.00 USDC</p>
                                    </div>
                                </div>

                                :

                                activeTab === 'buy' ?

                                    <div className="flex flex-col gap-2">
                                        <p className="text-xs font-normal text-baseTextMedEmphasis">
                                            Order Value
                                        </p>
                                        <div className="flex flex-col relative">
                                            <input step="0.01" placeholder="0" className="h-12 rounded-lg border-2 border-solid border-baseBorderLight bg-[var(--background)] pr-12 text-right text-2xl leading-9 text-[$text] placeholder-baseTextMedEmphasis ring-0 transition focus:border-accentBlue focus:ring-0" type="text" value="134.38" />
                                            <div className="flex flex-row absolute right-1 top-1 py-1 px-2">
                                                <div className="relative">
                                                <HiCurrencyRupee size={30} className="text-green-600" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    :

                                    <div className="flex flex-col gap-2">
                                        <p className="text-xs font-normal text-baseTextMedEmphasis">
                                            Quantity
                                        </p>
                                        <div className="flex flex-col relative">
                                            <input step="0.01" placeholder="0" className="h-12 rounded-lg border-2 border-solid border-baseBorderLight bg-[var(--background)] pr-12 text-right text-2xl leading-9 text-[$text] placeholder-baseTextMedEmphasis ring-0 transition focus:border-accentBlue focus:ring-0" type="text" value="134.38" />
                                            <div className="flex flex-row absolute right-1 top-1 py-1 px-2">
                                            <div className="relative">
                                                {getMarketIcon()}
                                            </div>
                                        </div>
                                        </div>
                                    </div>
                        }

                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-center flex-row mt-2 gap-1">
                            <div className="flex items-center justify-center flex-row rounded-full px-[16px] py-[6px] text-xs cursor-pointer bg-baseBackgroundL2 hover:bg-baseBackgroundL3">
                                25%
                            </div>
                            <div className="flex items-center justify-center flex-row rounded-full px-[16px] py-[6px] text-xs cursor-pointer bg-baseBackgroundL2 hover:bg-baseBackgroundL3">
                                50%
                            </div>
                            <div className="flex items-center justify-center flex-row rounded-full px-[16px] py-[6px] text-xs cursor-pointer bg-baseBackgroundL2 hover:bg-baseBackgroundL3">
                                75%
                            </div>
                            <div className="flex items-center justify-center flex-row rounded-full px-[16px] py-[6px] text-xs cursor-pointer bg-baseBackgroundL2 hover:bg-baseBackgroundL3">
                                Max
                            </div>
                        </div>
                    </div>
                    {activeTab === 'buy' ? <button type="button" className="font-semibold  focus:ring-blue-200 focus:none focus:outline-none text-center h-12 rounded-xl text-base px-4 py-2 my-4 bg-greenPrimaryButtonBackground text-greenPrimaryButtonText active:scale-98" onClick={()=>{handleSubmit()}}>Buy</button> : <button type="button" className="font-semibold  focus:ring-blue-200 focus:none focus:outline-none text-center h-12 rounded-xl text-base px-4 py-2 my-4 bg-redPrimaryButtonBackground text-greenPrimaryButtonText active:scale-98" onClick={()=>{handleSubmit()}}>Sell</button>}
                </div>
            </div>
        </div>
    </div>
}

function LimitButton({ type, setType }: { type: string, setType: any }) {
    return <div className="flex flex-col cursor-pointer justify-center py-2" onClick={() => setType('limit')}>
        <div className={`text-sm font-medium py-1 border-b-2 ${type === 'limit' ? "border-accentBlue text-baseTextHighEmphasis" : "border-transparent text-baseTextMedEmphasis hover:border-baseTextHighEmphasis hover:text-baseTextHighEmphasis"}`}>
            Limit
        </div>
    </div>
}

function MarketButton({ type, setType }: { type: string, setType: any }) {
    return <div className="flex flex-col cursor-pointer justify-center py-2" onClick={() => setType('market')}>
        <div className={`text-sm font-medium py-1 border-b-2 ${type === 'market' ? "border-accentBlue text-baseTextHighEmphasis" : "border-b-2 border-transparent text-baseTextMedEmphasis hover:border-baseTextHighEmphasis hover:text-baseTextHighEmphasis"} `}>
            Market
        </div>
    </div>
}

function BuyButton({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: any }) {
    return <div className={`flex flex-col mb-[-2px] flex-1 cursor-pointer justify-center border-b-2 p-4 ${activeTab === 'buy' ? 'border-b-greenBorder bg-greenBackgroundTransparent' : 'border-b-baseBorderMed hover:border-b-baseBorderFocus'}`} onClick={() => setActiveTab('buy')}>
        <p className="text-center text-sm font-semibold text-greenText">
            Buy
        </p>
    </div>
}

function SellButton({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: any }) {
    return <div className={`flex flex-col mb-[-2px] flex-1 cursor-pointer justify-center border-b-2 p-4 ${activeTab === 'sell' ? 'border-b-redBorder bg-redBackgroundTransparent' : 'border-b-baseBorderMed hover:border-b-baseBorderFocus'}`} onClick={() => setActiveTab('sell')}>
        <p className="text-center text-sm font-semibold text-redText">
            Sell
        </p>
    </div>
}