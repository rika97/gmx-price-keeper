import { fetchPrices } from "./price-apis"

const BN = require('bn.js')

export function getPriceBits(prices) {
    if (prices.length > 8) {
        throw new Error("max prices.length exceeded")
    }

    let priceBits = new BN('0')

    for (let j = 0; j < 8; j++) {
        let index = j
        if (index >= prices.length) {
            break
        }

        const price = new BN(prices[index])
        if (price.gt(new BN("2147483648"))) { // 2^31
            throw new Error(`price exceeds bit limit ${price.toString()}`)
        }

        priceBits = priceBits.or(price.shln(j * 32))
    }

    return priceBits.toString()
}

export async function fetchPriceBits(symbolsWithPrecisions) {
    const symbols = symbolsWithPrecisions.map(({ symbol }) => symbol);
    const prices = await fetchPrices(symbols);

    const normalizedPrices = symbolsWithPrecisions
        .filter(({ symbol }) => !!prices[symbol])
        .map(({ symbol, precision }) => normalizePrice(prices[symbol], precision));

    return { prices, priceBits: getPriceBits(normalizedPrices) };
}

export function normalizePrice(price, precision) {
    return Math.round(price * precision);
}