import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
@Module({ imports: [JwtModule.register({ secret: process.env.JWT_SECRET })], controllers: [RoomsController], providers: [RoomsService, JwtAuthGuard] })
export class RoomsModule {}
