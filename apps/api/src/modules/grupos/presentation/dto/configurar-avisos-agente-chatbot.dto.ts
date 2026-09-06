import { IsBoolean, IsOptional } from 'class-validator';

export class ConfigurarAvisosAgenteChatbotDto {
  @IsOptional()
  @IsBoolean()
  avisaCotasRestantes?: boolean;

  @IsOptional()
  @IsBoolean()
  avisaNovoSorteio?: boolean;

  @IsOptional()
  @IsBoolean()
  avisaResultado?: boolean;
}
