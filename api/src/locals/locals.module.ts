import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LocalsController } from './locals.controller';
import { LocalsService } from './locals.service';

@Module({ imports: [JwtModule.register({ secret: process.env.JWT_SECRET })], controllers: [LocalsController], providers: [LocalsService, JwtAuthGuard] })
export class LocalsModule {}
