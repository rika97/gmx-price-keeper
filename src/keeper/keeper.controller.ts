import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { KeeperService } from './keeper.service';

@ApiTags('keeper')
@Controller('keeper')
export class KeeperController {
  constructor(
    private readonly configService: ConfigService,
    private readonly keeperService: KeeperService
  ) { }
  @Get('/version')
  getVersion() {
    return this.configService.get('version');
  }

  @Get('/status')
  getStatus() {
    return 'OK';
  }

  @Get('/config')
  getConfig() {
    return {};
  }

  @Get('/test')
  getTest() {
    return this.keeperService.test();
  }

  @Get('/tokens')
  getTokens() {
    return this.keeperService.tokens();
  }

  @Get('/info')
  getInfo() {
    return this.keeperService.info();
  }
}
