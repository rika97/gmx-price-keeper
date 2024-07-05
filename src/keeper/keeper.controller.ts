import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('keeper')
@Controller('keeper')
export class KeeperController {
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
