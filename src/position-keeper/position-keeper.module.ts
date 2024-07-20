import { Module } from '@nestjs/common';
import { PositionKeeperController } from './position-keeper.controller';
import { PositionKeeperService } from './position-keeper.service';
import { Web3Module } from 'nest-web3';

@Module({
  imports: [
  ],
  controllers: [PositionKeeperController],
  providers: [PositionKeeperService],
})
export class PositionKeeperModule {}
