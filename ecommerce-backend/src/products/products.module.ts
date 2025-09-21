import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ExternalModule } from '../external/external.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [ExternalModule, CategoriesModule],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
