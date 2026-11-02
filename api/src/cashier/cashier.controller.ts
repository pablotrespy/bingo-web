import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CashierService } from './cashier.service';

@Controller('cashier')
@UseGuards(JwtAuthGuard)
export class CashierController {
  constructor(private readonly service: CashierService) {}
  @Post('locals/:localId/shifts') open(@Param('localId') localId: string, @Req() req: Request) { return this.service.open(localId, String((req as Request & { user?: { sub?: string } }).user?.sub ?? '')); }
  @Get('locals/:localId/shifts/current') current(@Param('localId') localId: string, @Req() req: Request) { return this.service.current(localId, String((req as Request & { user?: { sub?: string } }).user?.sub ?? '')); }
  @Get('shifts/:id/summary') summary(@Param('id') id: string) { return this.service.summary(id); }
  @Patch('shifts/:id/close') close(@Param('id') id: string, @Body() body: { notes?: string }, @Req() req: Request) { return this.service.close(id, String((req as Request & { user?: { sub?: string } }).user?.sub ?? ''), body.notes); }
}
