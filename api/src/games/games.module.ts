import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { CardsService } from './cards.service';
@Module({ imports: [JwtModule.register({ secret: process.env.JWT_SECRET })], controllers: [GamesController], providers: [GamesService, CardsService, JwtAuthGuard] }) export class GamesModule {}
