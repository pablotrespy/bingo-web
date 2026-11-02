import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Get()
  list() { return this.service.list(); }

  @Post()
  create(@Body() body: { name: string; tradeName?: string; taxId?: string; phone?: string; email?: string; postalCode?: string }) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { name?: string; taxId?: string; phone?: string; email?: string; postalCode?: string; status?: string }) {
    return this.service.update(id, body);
  }
}
