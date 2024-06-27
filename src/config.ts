import * as process from 'process';

export default () => ({
  hmy: {
    name: 'hmy',
    url: process.env.HMY_NODE_URL,
    contract:
      process.env.PRICE_FEED_CONTRACT ||
      '0x9740FF91F1985D8d2B71494aE1A2f723bb3Ed9E4',
  },
  version: process.env.npm_package_version || '0.0.1',
  name: process.env.npm_package_name || '',
  port: parseInt(process.env.PORT, 10) || 8080,
});
