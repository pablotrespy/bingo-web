import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CardsService } from './cards.service';
import { GamesService } from './games.service';

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(private readonly service: GamesService, private readonly cardsService: CardsService) {}
  @Get('organization/:organizationId') listOrganization(@Param('organizationId') id: string) { return this.service.listOrganization(id); }
  @Get('local/:localId') listLocal(@Param('localId') id: string) { return this.service.listLocal(id); }
  @Post() create(@Body() body: Record<string, unknown>) { return this.service.create(body); }
  @Post(':id/generate-cards') generateCards(@Param('id') id: string) { return this.cardsService.generate(id); }
  @Get(':id') get(@Param('id') id: string) { return this.service.get(id); }
  @Get(':id/inventory') inventory(@Param('id') id: string) { return this.service.inventory(id); }
  @Get(':id/sales') sales(@Param('id') id: string) { return this.service.listSales(id); }
  @Get(':id/cards') cards(@Param('id') id: string) { return this.service.listCards(id); }
  @Get(':id/draw') state(@Param('id') id: string) { return this.service.drawState(id); }
  @Post(':id/draw') updateDraw(@Param('id') id: string, @Body() body: { started?: boolean; finished?: boolean; current?: number | null; calledNumbers?: number[] }) { return this.service.updateDraw(id, body); }
  @Post(':id/sell') sell(@Param('id') id: string, @Body() body: { quantity?: number; customerId?: string; document?: string; cashierShiftId?: string }, @Req() req: Request) { return this.service.sell(id, { ...body, sellerUserId: String((req as Request & { user?: { sub?: string } }).user?.sub ?? '') }); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: { saleCloseAt?: string; bingoAt?: string }) { return this.service.update(id, body); }
}
