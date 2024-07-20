import * as process from 'process';

export default () => ({
  hmy: {
    name: 'hmy',
    url: process.env.HMY_NODE_URL,
    contract:
      process.env.PRICE_FEED_CONTRACT ||
      '0x9740FF91F1985D8d2B71494aE1A2f723bb3Ed9E4',
  },
  contracts: {
    fastPriceEvents: '0x3A78a7CcC5B32e0e776a9e04A2b6c30BCc2e7125',
    fastPriceFeed: '0x00EB64af98ADE7D92c2E3FFB2c171Fba92A1697D',
    vaultPriceFeed: '0xFa10146c9755dd229aDB60a45fB935F00969F94A',
    positionRouter: process.env.POSITION_ROUTER_CONTRACT,
  },
  keys: {
    keeper: process.env.KEEPER_KEY
  },
  version: process.env.npm_package_version || '0.0.1',
  name: process.env.npm_package_name || '',
  port: parseInt(process.env.PORT, 10) || 8080,
});
