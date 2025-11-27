import { Module } from '@nestjs/common';
import { GCSConfigService } from './gcs.config';
import { GCSUploadService } from './gcs-upload.service';

@Module({
  imports: [],
  controllers: [],
  providers: [
    GCSConfigService,
    GCSUploadService,
  ],
  exports: [
    GCSConfigService,
    GCSUploadService,
  ],
})
export class GeminiModule {}
