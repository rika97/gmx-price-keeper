import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Web3Service } from 'nest-web3';
import priceFeedJson from '../abi/FastPriceFeed';
import vaultPriceFeedJson from '../abi/VaultPriceFeed';
import vaultJson from '../abi/Vault';
import positionRouterJson from '../abi/PositionRouter';
import { fetchPriceBits } from './utils';
import { tokens } from './tokens';

const MAX_INCREASE_POSITIONS = 5;
const MAX_DECREASE_POSITIONS = 5;
const SYNC_INTERVAL = 10000;

@Injectable()
export class KeeperService {
    private readonly logger = new Logger(KeeperService.name);
    private client = this.web3Service.getClient('hmy');
    private gasLimit = 9721900;
    private accountAddress: string;

    private lastUpdateTime = '';
    private priceLastUpdateTimestamp = 0;
    private lastPrices = {};
    private lastPriceBits = '';
    private lastSuccessTx = '';
    private lastErrorTx = '';
    private lastError = '';

    constructor(
        private configService: ConfigService,
        private readonly web3Service: Web3Service
    ) {
        this.client = this.web3Service.getClient('hmy');

        const account = this.client.eth.accounts.privateKeyToAccount('0x' + this.configService.get('keys.keeper'));

        this.client.eth.accounts.wallet.add(account);
        this.client.eth.defaultAccount = account.address;

        this.accountAddress = account.address;

        this.syncPrice();
    }

    getPositionQueueLengths = async () => {
        const positionRouterContract = new this.client.eth.Contract(
            positionRouterJson.abi as any,
            this.configService.get('contracts.positionRouter')
        );

        const positionQueue = await positionRouterContract.methods.getRequestQueueLengths().call();

        return {
            increaseKeyStart: Number(positionQueue[0]),
            increaseKeysLength: Number(positionQueue[1]),
            decreaseKeyStart: Number(positionQueue[2]),
            decreaseKeysLength: Number(positionQueue[3]),
        };
    }

    updatePriceBitsAndOptionallyExecute = async () => {
        const { prices, priceBits } = await fetchPriceBits(
            tokens.map(t => ({
                symbol: t.symbol,
                precision: t.fastPricePrecision
            }))
        );

        this.lastPrices = prices;
        this.lastPriceBits = priceBits;

        const priceFeedContract = new this.client.eth.Contract(
            priceFeedJson.abi as any,
            this.configService.get('contracts.fastPriceFeed')
        );

        const positionQueue = await this.getPositionQueueLengths();
        const timestamp = Math.floor(Date.now() / 1000);
        if (
            positionQueue.increaseKeysLength - positionQueue.increaseKeyStart > 0 ||
            positionQueue.decreaseKeysLength - positionQueue.decreaseKeyStart > 0
        ) {
            const endIndexForIncreasePositions = positionQueue.increaseKeysLength;
            const endIndexForDecreasePositions = positionQueue.decreaseKeysLength;

            this.logger.log('setPricesWithBitsAndExecute');

            const tx = await priceFeedContract.methods
                .setPricesWithBitsAndExecute(
                    // this.configService.get('contracts.positionRouter'),
                    priceBits,
                    timestamp,
                    endIndexForIncreasePositions,
                    endIndexForDecreasePositions,
                    MAX_INCREASE_POSITIONS,
                    MAX_DECREASE_POSITIONS
                ).send({
                    from: this.accountAddress,
                    gas: this.gasLimit,
                    gasPrice: 101000000000,
                });

            this.logger.log('setPricesWithBitsAndExecute', tx.transactionHash);

            this.lastSuccessTx = tx.transactionHash;
            this.lastUpdateTime = new Date().toISOString();
        } else {
            this.logger.log('setPricesWithBits');

            if (Date.now() - this.priceLastUpdateTimestamp > 120000) {
                const tx = await priceFeedContract.methods
                    .setPricesWithBits(priceBits, timestamp)
                    .send({
                        from: this.accountAddress,
                        gas: this.gasLimit,
                        gasPrice: 101000000000,
                    });

                this.logger.log('setPricesWithBits', tx.transactionHash);
                this.lastSuccessTx = tx.transactionHash;
                this.lastUpdateTime = new Date().toISOString();
                this.priceLastUpdateTimestamp = Date.now();
            } else {
                this.logger.log('skipUpdatePrice');
            }
        }
    }

    syncPrice = async () => {
        try {
            await this.updatePriceBitsAndOptionallyExecute();
        } catch (e) {
            this.logger.error('syncPrice', e);

            this.lastError = e.maessage || e;
        }

        setTimeout(() => this.syncPrice(), SYNC_INTERVAL);
    }

    info = () => {
        return {
            lastUpdateTime: this.lastUpdateTime,
            priceLastUpdateTimestamp: this.priceLastUpdateTimestamp,
            lastPrices: this.lastPrices,
            lastPriceBits: this.lastPriceBits,
            lastSuccessTx: this.lastSuccessTx,
            lastErrorTx: this.lastErrorTx,
            lastError: this.lastError,
            contracts: {
                positionRouter: this.configService.get('contracts.positionRouter'),
                vault: this.configService.get('contracts.vault'),
                fastPriceFeed: this.configService.get('contracts.fastPriceFeed'),
                vaultPriceFeed: this.configService.get('contracts.vaultPriceFeed'),
            },
            SYNC_INTERVAL
        }
    }

    tokens = () => tokens;

    test = async () => {
        const res: any = {};

        res.chainId = await this.client.eth.getChainId();

        const fastPriceFeedContract = new this.client.eth.Contract(
            priceFeedJson.abi as any,
            this.configService.get('contracts.fastPriceFeed')
        );

        const vaultPriceFeedContract = new this.client.eth.Contract(
            vaultPriceFeedJson.abi as any,
            this.configService.get('contracts.vaultPriceFeed')
        );

        const vaultContract = new this.client.eth.Contract(
            vaultJson.abi as any,
            this.configService.get('contracts.vault')
        );

        const tokenAddress = "0xcF664087a5bB0237a0BAd6742852ec6c8d69A27a";

        res['vaultPriceFeedContract.getPrice'] = await vaultPriceFeedContract.methods.getPrice(
            tokenAddress,
            true,
            true,
            false
        ).call();

        res['fastPriceFeedContract.getPriceData'] = await fastPriceFeedContract.methods.getPriceData(
            tokenAddress,
        ).call();

        res['fastPriceFeedContract.getPrice MAX'] = await fastPriceFeedContract.methods.getPrice(
            tokenAddress,
            1,
            true,
        ).call();

        res['fastPriceFeedContract.getPrice MIN'] = await fastPriceFeedContract.methods.getPrice(
            tokenAddress,
            1,
            false,
        ).call();

        res['vaultContract.getMaxPrice'] = await vaultContract.methods.getMaxPrice(tokenAddress).call();

        res['vaultContract.getMinPrice'] = await vaultContract.methods.getMinPrice(tokenAddress).call();

        return res;
    }
}
