import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      message: 'eCommerce API funcionando correctamente!',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
