import axios from "axios";
const redstone = require("redstone-api");

const ninanceUrl = "https://api.binance.com/api/v3/ticker/price?symbol=";

const getBinancePriceBySymbol = (symbol: string) => {
    return axios.get<{ price: string }>(`${ninanceUrl}${symbol}USDT`)
        .then(res => res.data.price);
}

const fetchPricesBinance = async (symbols: string[]) => {
    const prices = {};

    for (let i = 0; i < symbols.length; i++) {
        try {
            prices[symbols[i]] = await getBinancePriceBySymbol(symbols[i]);
        } catch { }
    }

    return symbols.reduce((acc, v) => {
        acc[v] = prices[v] || 0;
        return acc;
    }, {});
}

const fetchPricesRedstone = async (symbols: string[]) => {
    let prices = {};

    try {
        prices = await redstone.query().symbols(symbols).latest().exec({
            provider: "redstone",
        });
    } catch { }

    return symbols.reduce((acc, v) => {
        acc[v] = prices[v].value || 0;
        return acc;
    }, {});
}

export const fetchPrices = async (symbols: string[]) => {
    const pricesRedstone = await fetchPricesRedstone(symbols);
    const pricesBinance = await fetchPricesBinance(symbols);

    const mulPrices = [pricesRedstone, pricesBinance];

    return symbols.reduce((rez, v) => {
        let summ = 0;
        let count = 0;

        mulPrices.forEach((prices) => {
            summ += Number(prices[v]) || 0;
            count += Number(prices[v]) > 0 ? 1 : 0;
        })

        rez[v] = summ / count;
        return rez;
    }, {});
}
