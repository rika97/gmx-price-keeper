import * as process from 'process';
import { contracts } from './contracts.config'

export default () => ({
  hmy: {
    name: 'hmy',
    url: process.env.HMY_NODE_URL,
  },
  contracts: {
    fastPriceFeed: contracts.FastPriceFeed,
    positionRouter: contracts.PositionRouter,
    vaultPriceFeed: contracts.VaultPriceFeed,
    vault: contracts.Vault,
  },
  keys: {
    keeper: process.env.KEEPER_KEY
  },
  version: process.env.npm_package_version || '0.0.1',
  name: process.env.npm_package_name || '',
  port: parseInt(process.env.PORT, 10) || 8080,
});
