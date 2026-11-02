import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoomsService } from './rooms.service';
@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly service: RoomsService) {}
  @Get('organization/:organizationId') list(@Param('organizationId') organizationId: string) { return this.service.list(organizationId); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() body: { organizationId?: string; localId?: string; name?: string }) { return this.service.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: { localId?: string; name?: string }) { return this.service.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
