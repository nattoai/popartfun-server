import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StoreService } from '../store/store.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly storeService: StoreService) {}

  /**
   * Refresh shipping rates cache for all products
   * Runs every day at 2:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    name: 'refreshShippingRates',
    timeZone: 'UTC',
  })
  async handleShippingRatesRefresh(): Promise<{
    success: number;
    failed: number;
    total: number;
  }> {
    this.logger.log('Starting scheduled shipping rates cache refresh...');

    try {
      const result = await this.storeService.refreshAllShippingRatesCaches();

      this.logger.log(
        `Shipping rates cache refresh completed: ${result.success} succeeded, ${result.failed} failed out of ${result.total} total products`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to refresh shipping rates cache: ${error.message}`,
      );
      this.logger.error(error.stack);
      throw error;
    }
  }

  /**
   * Optional: Refresh shipping rates every 12 hours
   * Uncomment if you want more frequent updates
   */
  // @Cron('0 */12 * * *', {
  //   name: 'refreshShippingRatesTwiceDaily',
  //   timeZone: 'UTC',
  // })
  // async handleShippingRatesRefreshTwiceDaily() {
  //   this.logger.log('Starting scheduled shipping rates cache refresh (12-hour)...');
  //
  //   try {
  //     const result = await this.storeService.refreshAllShippingRatesCaches();
  //
  //     this.logger.log(
  //       `Shipping rates cache refresh completed: ${result.success} succeeded, ${result.failed} failed out of ${result.total} total products`
  //     );
  //   } catch (error) {
  //     this.logger.error(`Failed to refresh shipping rates cache: ${error.message}`);
  //     this.logger.error(error.stack);
  //   }
  // }

  /**
   * Optional: Refresh shipping rates every week
   * Uncomment if daily refresh is too frequent
   */
  // @Cron(CronExpression.EVERY_WEEK, {
  //   name: 'refreshShippingRatesWeekly',
  //   timeZone: 'UTC',
  // })
  // async handleShippingRatesRefreshWeekly() {
  //   this.logger.log('Starting weekly shipping rates cache refresh...');
  //
  //   try {
  //     const result = await this.storeService.refreshAllShippingRatesCaches();
  //
  //     this.logger.log(
  //       `Shipping rates cache refresh completed: ${result.success} succeeded, ${result.failed} failed out of ${result.total} total products`
  //     );
  //   } catch (error) {
  //     this.logger.error(`Failed to refresh shipping rates cache: ${error.message}`);
  //     this.logger.error(error.stack);
  //   }
  // }
}
