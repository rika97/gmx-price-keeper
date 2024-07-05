import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Web3Service } from 'nest-web3';
import priceFeedJson from '../abi/FastPriceFeed';
import positionRouterJson from '../abi/PositionRouter';
import * as redstone from 'redstone-api';
import { fetchPriceBits } from './utils';

const MAX_INCREASE_POSITIONS = 5;
const MAX_DECREASE_POSITIONS = 5;

@Injectable()
export class KeeperService {
    private readonly logger = new Logger(KeeperService.name);
    private client = this.web3Service.getClient('hmy');
    private gasLimit = 9721900;
    private accountAddress: string;

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

    fetchPrices = async (symbols: string[]) => {
        const prices = await redstone.query().symbols(symbols).latest().exec({
            provider: "redstone",
        });

        return prices;
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
        const priceBits = await fetchPriceBits([
            {
                symbol: 'ONE',
                precision: 100000000
            },
            {
                symbol: 'BUSD',
                precision: 100000000
            }
        ]);

        console.log("priceBits", priceBits);

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

            this.logger.log('setPricesWithBitsAndExecute', tx);
        } else {
            const tx = await priceFeedContract.methods
                .setPricesWithBits(priceBits, timestamp)
                .send({
                    from: this.accountAddress,
                    gas: this.gasLimit,
                    gasPrice: 101000000000,
                });

            this.logger.log('setPricesWithBits', tx);
        }
    }

    syncPrice = async () => {
        try {
            this.logger.log(await this.client.eth.getChainId());

            const priceFeedContract = new this.client.eth.Contract(
                priceFeedJson.abi as any,
                this.configService.get('contracts.fastPriceFeed')
            );

            this.logger.log(await priceFeedContract.methods.isInitialized().call());

            this.logger.log(
                await priceFeedContract.methods.getPrice(
                    "0xcF664087a5bB0237a0BAd6742852ec6c8d69A27a", 1, true
                ).call()
            );

            await this.updatePriceBitsAndOptionallyExecute();

            // const price = await redstone.getPrice("ONE");

            // this.logger.log(price?.value);


            // let req = await priceFeedContract.methods.setLatestAnswer(lastPrice).send({
            //     from: account.address,
            //     gas: gasLimit,
            //     gasPrice: 101000000000,
            // });

        } catch (e) {
            this.logger.error('syncPrice', e);
        }

        setTimeout(() => this.syncPrice(), 5000);
    }
}
