import * as process from 'process';

export default () => ({
  hmy: {
    name: 'hmy',
    url: process.env.HMY_NODE_URL,
  },
  contracts: {
    fastPriceFeed: process.env.FAST_PRICE_FEED_CONTRACT,
    positionRouter: process.env.POSITION_ROUTER_CONTRACT,
    vaultPriceFeed: process.env.VAULT_PRICE_FEED_CONTRACT,
    vault: process.env.VAULT_CONTRACT,
  },
  keys: {
    keeper: process.env.KEEPER_KEY
  },
  version: process.env.npm_package_version || '0.0.1',
  name: process.env.npm_package_name || '',
  port: parseInt(process.env.PORT, 10) || 8080,
});
