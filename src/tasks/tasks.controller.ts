import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('refresh-shipping-rates')
  @ApiOperation({
    summary: 'Manually trigger shipping rates cache refresh',
    description:
      'Triggers the same job that runs automatically via cron schedule',
  })
  @ApiResponse({
    status: 200,
    description: 'Shipping rates refresh completed',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        success: { type: 'number' },
        failed: { type: 'number' },
        total: { type: 'number' },
      },
    },
  })
  async manuallyRefreshShippingRates() {
    const result = await this.tasksService.handleShippingRatesRefresh();
    return {
      message: 'Shipping rates cache refresh completed',
      ...result,
    };
  }
}
