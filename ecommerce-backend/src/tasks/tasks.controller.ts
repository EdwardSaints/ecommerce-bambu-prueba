import { 
  Controller, 
  Post, 
  Get, 
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Tareas Programadas')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('sync-products')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Ejecutar sincronización manual de productos', 
    description: 'Ejecuta manualmente la sincronización de productos desde DummyJSON (solo administradores)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Sincronización ejecutada exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Sincronización manual completada'
        },
        result: {
          type: 'object',
          properties: {
            synchronized: {
              type: 'number',
              example: 194
            },
            errors: {
              type: 'number',
              example: 0
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Sincronización ya en progreso' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No autorizado - Token inválido' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Prohibido - Se requieren permisos de administrador' 
  })
  async runManualSync() {
    return this.tasksService.runManualSync();
  }

  @Get('status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Obtener estado de las tareas programadas', 
    description: 'Devuelve información sobre el estado actual de las tareas programadas (solo administradores)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado de las tareas obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        syncProductsRunning: {
          type: 'boolean',
          example: false,
          description: 'Indica si hay una sincronización en progreso'
        },
        nextSyncTime: {
          type: 'string',
          example: '2024-01-01T12:00:00.000Z',
          description: 'Próxima ejecución programada'
        },
        timezone: {
          type: 'string',
          example: 'America/Mexico_City',
          description: 'Zona horaria configurada'
        },
        cronExpression: {
          type: 'string',
          example: '0 */12 * * *',
          description: 'Expresión cron para la sincronización'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No autorizado - Token inválido' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Prohibido - Se requieren permisos de administrador' 
  })
  getTasksStatus() {
    return this.tasksService.getTasksStatus();
  }
}
