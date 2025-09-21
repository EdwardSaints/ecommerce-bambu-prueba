import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DummyjsonService } from './dummyjson/dummyjson.service';

@Module({
  imports: [HttpModule],
  providers: [DummyjsonService],
  exports: [DummyjsonService],
})
export class ExternalModule {}
