import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CancelOrderDto {
  @ApiPropertyOptional({ 
    description: 'Reason for cancellation',
    example: 'Changed my mind'
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CancelOrderResponseDto {
  @ApiProperty({ description: 'Whether the cancellation was successful' })
  success: boolean;

  @ApiProperty({ description: 'Message about the cancellation' })
  message: string;

  @ApiPropertyOptional({ description: 'Refund ID if a refund was processed' })
  refundId?: string;

  @ApiPropertyOptional({ description: 'Refund amount if a refund was processed' })
  refundAmount?: number;
}


