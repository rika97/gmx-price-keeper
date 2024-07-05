import { Module } from '@nestjs/common';
import { KeeperController } from './keeper.controller';
import { KeeperService } from './keeper.service';
import { Web3Module } from 'nest-web3';

@Module({
  imports: [
  ],
  controllers: [KeeperController],
  providers: [KeeperService],
})
export class KeeperModule {}
