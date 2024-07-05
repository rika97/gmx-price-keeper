import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config';
import { Web3Module } from 'nest-web3';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { KeeperModule } from './keeper/keeper.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    Web3Module.forRootAsync({
      useFactory: (configService: ConfigService) => [
        configService.get('hmy'),
      ],
      inject: [ConfigService],
    }),
    // TypeOrmModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: (configService: ConfigService) => ({
    //     type: 'postgres',
    //     host: configService.get('DB_HOST'),
    //     port: +configService.get<number>('DB_PORT'),
    //     username: configService.get('DB_USERNAME'),
    //     password: configService.get('DB_PASSWORD'),
    //     database: configService.get('DB_NAME'),
    //     entities: entities,
    //     synchronize: true,
    //   }),
    //   inject: [ConfigService],
    // }),
    Web3Module,
    KeeperModule,
    PrometheusModule.register(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
