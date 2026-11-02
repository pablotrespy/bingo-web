import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Get()
  list() { return this.service.list(); }

  @Get('mine')
  mine(@Req() req: Request) { return this.service.mine(String((req as Request & { user?: { sub?: string } }).user?.sub ?? '')); }

  @Post()
  create(@Body() body: { name: string; tradeName?: string; taxId?: string; phone?: string; email?: string; postalCode?: string }) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { name?: string; taxId?: string; phone?: string; email?: string; postalCode?: string; status?: string }) {
    return this.service.update(id, body);
  }
}
