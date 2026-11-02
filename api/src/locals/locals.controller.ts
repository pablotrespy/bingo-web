import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LocalsService } from './locals.service';

@Controller('locals')
@UseGuards(JwtAuthGuard)
export class LocalsController {
  constructor(private readonly service: LocalsService) {}
  @Get('organization/:organizationId') list(@Param('organizationId') organizationId: string) { return this.service.list(organizationId); }
  @Post() create(@Body() body: { organizationId?: string; name?: string }) { return this.service.create(body); }
}
