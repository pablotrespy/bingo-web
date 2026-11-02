import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CashierController } from './cashier.controller';
import { CashierService } from './cashier.service';

@Module({ imports: [JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '8h' } })], controllers: [CashierController], providers: [CashierService] })
export class CashierModule {}
