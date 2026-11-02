import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformRoleGuard } from '../auth/platform-role.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({ imports: [JwtModule.register({ secret: process.env.JWT_SECRET })], controllers: [UsersController], providers: [UsersService, JwtAuthGuard, PlatformRoleGuard] })
export class UsersModule {}
