import { IsBoolean, IsOptional } from 'class-validator';

export class ConfigurarAvisosAgenteChatbotDto {
  @IsOptional()
  @IsBoolean()
  avisaCotasRestantes?: boolean;

  @IsOptional()
  @IsBoolean()
  avisaNovaCampanha?: boolean;

  @IsOptional()
  @IsBoolean()
  avisaResultado?: boolean;
}
