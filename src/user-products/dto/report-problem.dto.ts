import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, MaxLength, MinLength } from 'class-validator';

export class ReportProblemDto {
  @ApiProperty({
    description: 'Type of problem',
    enum: ['damaged', 'wrong_item', 'missing_item', 'quality_issue', 'shipping_issue', 'not_received', 'other'],
    example: 'damaged'
  })
  @IsEnum(['damaged', 'wrong_item', 'missing_item', 'quality_issue', 'shipping_issue', 'not_received', 'other'])
  problemType: string;

  @ApiProperty({
    description: 'Detailed description of the problem',
    example: 'The product arrived with a tear on the front side',
    minLength: 10,
    maxLength: 2000
  })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({
    description: 'URLs to images showing the problem',
    type: [String],
    example: ['https://storage.example.com/problem-image-1.jpg']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}

export class ReportProblemResponseDto {
  @ApiProperty({ description: 'Whether the report was submitted successfully' })
  success: boolean;

  @ApiProperty({ description: 'The problem report ID' })
  problemId: string;

  @ApiProperty({ description: 'Message about the report' })
  message: string;
}

export class ProblemResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Who responded' })
  respondedBy: string;

  @ApiProperty({ description: 'When the response was made' })
  timestamp: Date;
}

export class OrderProblemDto {
  @ApiProperty({ description: 'Problem ID' })
  _id: string;

  @ApiProperty({ description: 'Order ID' })
  orderId: string;

  @ApiProperty({ description: 'Problem type' })
  problemType: string;

  @ApiProperty({ description: 'Problem description' })
  description: string;

  @ApiProperty({ description: 'Problem status' })
  status: string;

  @ApiPropertyOptional({ description: 'Resolution type' })
  resolution?: string;

  @ApiPropertyOptional({ description: 'Resolution note' })
  resolutionNote?: string;

  @ApiProperty({ description: 'When the problem was reported' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'When the problem was resolved' })
  resolvedAt?: Date;

  @ApiPropertyOptional({ description: 'Responses to the problem', type: [ProblemResponseDto] })
  responses?: ProblemResponseDto[];
}


