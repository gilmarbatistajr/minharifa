import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PrincipalAutenticado } from '../jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PrincipalAutenticado => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
