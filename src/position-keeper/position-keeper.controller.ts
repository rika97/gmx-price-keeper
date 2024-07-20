import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('position-keeper')
@Controller('position-keeper')
export class PositionKeeperController {
  constructor(private readonly configService: ConfigService) {}
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
}
