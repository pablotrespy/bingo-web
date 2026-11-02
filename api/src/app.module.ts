import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';
import { LocalsModule } from './locals/locals.module';
import { RoomsModule } from './rooms/rooms.module';
import { GamesModule } from './games/games.module';
import { CustomersModule } from './customers/customers.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [AuthModule, OrganizationsModule, UsersModule, LocalsModule, RoomsModule, GamesModule, CustomersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
