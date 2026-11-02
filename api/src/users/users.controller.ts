import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}
  @Get() list() { return this.service.list(); }
  @Post() create(@Req() request: { user: { roles?: string[] } }, @Body() body: { fullName?: string; identification?: string; email?: string; organizationId?: string; roleCode?: string }) { return this.service.create(body, request.user?.roles ?? []); }
}
