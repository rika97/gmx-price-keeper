import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Web3Service } from 'nest-web3';
import positionRouterJson from '../abi/PositionRouter';
import { Contract } from 'web3-eth-contract';

const MAX_INCREASE_POSITIONS = 50;
const MAX_DECREASE_POSITIONS = 50;

@Injectable()
export class PositionKeeperService {
    private readonly logger = new Logger(PositionKeeperService.name);
    private client = this.web3Service.getClient('hmy');
    private gasLimit = 9721900;
    private accountAddress: string;
    private positionRouterContract: Contract;

    constructor(
        private configService: ConfigService,
        private readonly web3Service: Web3Service
    ) {
        this.client = this.web3Service.getClient('hmy');

        const account = this.client.eth.accounts.privateKeyToAccount('0x' + this.configService.get('keys.keeper'));

        this.client.eth.accounts.wallet.add(account);
        this.client.eth.defaultAccount = account.address;

        this.accountAddress = account.address;

        this.positionRouterContract = new this.client.eth.Contract(
            positionRouterJson.abi as any,
            this.configService.get('contracts.positionRouter')
        );

        this.executePositions();
    }

    getPositionQueueLengths = async () => {
        const positionQueue = await this.positionRouterContract.methods.getRequestQueueLengths().call();

        return {
            increaseKeyStart: Number(positionQueue[0]),
            increaseKeysLength: Number(positionQueue[1]),
            decreaseKeyStart: Number(positionQueue[2]),
            decreaseKeysLength: Number(positionQueue[3]),
        };
    }

    executePositions = async () => {
        try {
            const positionQueue = await this.getPositionQueueLengths();

            if (positionQueue.increaseKeysLength - positionQueue.increaseKeyStart > 0) {
                const maxEndIndexForIncrease = positionQueue.increaseKeyStart + MAX_INCREASE_POSITIONS;

                const endIndexForIncreasePositions = positionQueue.increaseKeysLength > maxEndIndexForIncrease ?
                    maxEndIndexForIncrease : positionQueue.increaseKeysLength;

                const tx = await this.positionRouterContract.methods
                    .executeIncreasePositions(
                        endIndexForIncreasePositions,
                        this.accountAddress
                    ).send({
                        from: this.accountAddress,
                        gas: this.gasLimit,
                        gasPrice: 101000000000,
                    });

                this.logger.log('executeIncreasePositions: ', tx.transactionHash);
            } else {
                this.logger.log('No IncreasePositions')
            }

            if (positionQueue.decreaseKeysLength - positionQueue.decreaseKeyStart > 0) {
                const maxEndIndexForDecrease = positionQueue.decreaseKeyStart + MAX_DECREASE_POSITIONS;

                const endIndexForDecreasePositions = positionQueue.decreaseKeysLength > maxEndIndexForDecrease ?
                    maxEndIndexForDecrease : positionQueue.decreaseKeysLength;

                const tx = await this.positionRouterContract.methods
                    .executeDecreasePositions(
                        endIndexForDecreasePositions,
                        this.accountAddress
                    ).send({
                        from: this.accountAddress,
                        gas: this.gasLimit,
                        gasPrice: 101000000000,
                    });

                this.logger.log('executeDecreasePositions: ', tx.transactionHash);
            } else {
                this.logger.log('No DecreasePositions')
            }
        } catch (e) {
            this.logger.error('executePositions', e);
        }

        setTimeout(() => this.executePositions(), 5000);
    }
}
