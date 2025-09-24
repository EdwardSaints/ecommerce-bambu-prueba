import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { ProductsService } from '../products/products.service';
import { LoggerService } from '../common/logger/logger.service';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private isRunning = false;

  constructor(
    private readonly productsService: ProductsService,
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  // Sincronización automática de productos cada 12 horas
  // Cron expression: "0 */12 * * *" = A las 00:00 y 12:00 de cada día
  @Cron(CronExpression.EVERY_12_HOURS, {
    name: 'syncProducts',
    timeZone: 'America/Mexico_City', // Ajusta según tu zona horaria
  })
  async handleProductSync() {
    // Verificar si ya hay una sincronización en curso
    if (this.isRunning) {
      this.logger.warn('Sincronización ya en progreso, omitiendo esta ejecución');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();

    try {
      this.logger.log('Iniciando sincronización automática de productos...');
      this.loggerService.log(
        'Iniciando sincronización automática de productos',
        'TasksService',
        { scheduledAt: startTime.toISOString() }
      );

      // Ejecutar sincronización
      const result = await this.productsService.syncProductsFromDummyJSON();

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Registrar resultado exitoso
      await this.logSyncResult({
        startTime,
        endTime,
        duration,
        synchronized: result.synchronized,
        errors: result.errors,
        status: 'SUCCESS',
      });

      this.logger.log(
        `Sincronización completada: ${result.synchronized} productos sincronizados, ${result.errors} errores en ${duration}ms`
      );

      this.loggerService.log(
        'Sincronización automática completada exitosamente',
        'TasksService',
        {
          synchronized: result.synchronized,
          errors: result.errors,
          duration,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }
      );

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Registrar error
      await this.logSyncResult({
        startTime,
        endTime,
        duration,
        synchronized: 0,
        errors: 1,
        status: 'FAILED',
        errorMessage: error.message,
      });

      this.logger.error(`Error en sincronización automática: ${error.message}`);
      this.loggerService.error(
        'Error en sincronización automática de productos',
        error.stack,
        'TasksService',
        {
          duration,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          errorMessage: error.message,
        }
      );
    } finally {
      this.isRunning = false;
    }
  }

  // Cron job para limpiar logs antiguos (opcional)
  // Se ejecuta todos los domingos a las 2:00 AM
  @Cron('0 2 * * 0', {
    name: 'cleanupLogs',
    timeZone: 'America/Mexico_City',
  })
  async handleLogCleanup() {
    try {
      this.logger.log('Iniciando limpieza de logs antiguos...');

      // Eliminar logs de más de 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedCount = await this.prismaService.systemLog.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      this.logger.log(`Limpieza completada: ${deletedCount.count} logs eliminados`);
      this.loggerService.log(
        'Limpieza de logs completada',
        'TasksService',
        { deletedLogs: deletedCount.count, cutoffDate: thirtyDaysAgo.toISOString() }
      );

    } catch (error) {
      this.logger.error(`Error en limpieza de logs: ${error.message}`);
      this.loggerService.error(
        'Error en limpieza de logs',
        error.stack,
        'TasksService',
        { errorMessage: error.message }
      );
    }
  }

  // Método para ejecutar sincronización manual (útil para testing)
  async runManualSync(): Promise<{ message: string; result?: any }> {
    if (this.isRunning) {
      return { message: 'Sincronización ya en progreso' };
    }

    try {
      this.logger.log('Ejecutando sincronización manual...');
      const result = await this.productsService.syncProductsFromDummyJSON();
      
      return {
        message: 'Sincronización manual completada',
        result: {
          synchronized: result.synchronized,
          errors: result.errors,
        },
      };
    } catch (error) {
      this.logger.error(`Error en sincronización manual: ${error.message}`);
      throw error;
    }
  }

  // Obtener estado de las tareas programadas
  getTasksStatus() {
    return {
      syncProductsRunning: this.isRunning,
      nextSyncTime: this.getNextCronTime(),
      timezone: 'America/Mexico_City',
      cronExpression: '0 */12 * * *', // Cada 12 horas
    };
  }

  // Registrar resultado de sincronización en la base de datos
  private async logSyncResult(data: {
    startTime: Date;
    endTime: Date;
    duration: number;
    synchronized: number;
    errors: number;
    status: 'SUCCESS' | 'FAILED';
    errorMessage?: string;
  }) {
    try {
      await this.prismaService.systemLog.create({
        data: {
          level: data.status === 'SUCCESS' ? 'INFO' : 'ERROR',
          message: data.status === 'SUCCESS' 
            ? `Sincronización automática completada: ${data.synchronized} productos, ${data.errors} errores`
            : `Sincronización automática falló: ${data.errorMessage}`,
          context: 'TasksService',
          metadata: {
            type: 'SCHEDULED_SYNC',
            startTime: data.startTime.toISOString(),
            endTime: data.endTime.toISOString(),
            duration: data.duration,
            synchronized: data.synchronized,
            errors: data.errors,
            status: data.status,
            ...(data.errorMessage && { errorMessage: data.errorMessage }),
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error al registrar resultado de sincronización: ${error.message}`);
    }
  }

  // Calcular próxima ejecución del cron (aproximada)
  private getNextCronTime(): string {
    const now = new Date();
    const next = new Date(now);
    
    // Si es antes de las 12:00, la próxima será a las 12:00 de hoy
    if (now.getHours() < 12) {
      next.setHours(12, 0, 0, 0);
    } else {
      // Si es después de las 12:00, la próxima será a las 00:00 de mañana
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
    }
    
    return next.toISOString();
  }
}