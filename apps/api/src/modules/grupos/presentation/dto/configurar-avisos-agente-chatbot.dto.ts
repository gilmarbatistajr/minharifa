import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ConfigurarAvisosAgenteChatbotDto {
  @IsOptional()
  @IsBoolean()
  avisa50PorCentoVendido?: boolean;

  @IsOptional()
  @IsBoolean()
  avisa80PorCentoVendido?: boolean;

  @IsOptional()
  @IsBoolean()
  avisa90PorCentoVendido?: boolean;

  @IsOptional()
  @IsBoolean()
  avisaNovaCampanha?: boolean;

  @IsOptional()
  @IsBoolean()
  avisaResultado?: boolean;

  @IsOptional()
  @IsString()
  mensagem50PorCentoVendido?: string;

  @IsOptional()
  @IsString()
  mensagem80PorCentoVendido?: string;

  @IsOptional()
  @IsString()
  mensagem90PorCentoVendido?: string;

  @IsOptional()
  @IsString()
  mensagemNovaCampanha?: string;

  @IsOptional()
  @IsString()
  mensagemResultado?: string;
}
