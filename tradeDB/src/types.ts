export type DbMessage = {
    type: "TRADE_ADDED",
    data: {
        id: string,
        isBuyerMaker: boolean,
        price: string,
        quantity: string,
        quoteQuantity: string,
        timestamp: number,
        market: string
    }
} | {
    type: "ORDER_UPDATE",
    data: {
        orderId: string,
        executedQty: number,
        market?: string,
        price?: string,
        quantity?: string,
        side?: "buy" | "sell",
    }
} | {
    type: "BALANCE_UPDATE",
    data: {
        userId: string,
        asset: string,
        available: number,
        locked: number,
    }
} | {
    type: "ORDER_DELETE",
    data: {
        orderId: string,
    }
}