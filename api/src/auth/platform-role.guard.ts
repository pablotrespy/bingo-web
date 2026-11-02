import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class PlatformRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const user = context.switchToHttp().getRequest().user;
    const allowed = ['INGENIERIA', 'SUPER_ADMIN'];
    if (!user?.roles?.some((role: string) => allowed.includes(role))) throw new ForbiddenException('Permiso insuficiente');
    return true;
  }
}
