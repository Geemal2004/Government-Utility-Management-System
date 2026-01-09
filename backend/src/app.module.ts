import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { CustomersModule } from './customers/customers.module';
import { ConnectionsModule } from './connections/connections.module';
import { LookupModule } from './lookup/lookup.module';
import { DatabaseModule } from './database/database.module';
import { ReadingsModule } from './readings/readings.module';
import { BillingModule } from './billing/billing.module';
import { StripeModule } from './stripe/stripe.module';
import { PaymentsModule } from './payments/payments.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AssetsModule } from './assets/assets.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';

@Module({
  imports: [
    // Configuration module - loads .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Event Emitter Module for event-driven architecture
    EventEmitterModule.forRoot({
      // Use this name if you want wildcards
      wildcard: false,
      // The delimiter used to segment namespaces
      delimiter: '.',
      // Set this to `true` to use wildcards
      newListener: false,
      // Set this to `true` to ignore listener errors
      ignoreErrors: false,
    }),

    // TypeORM module with SQL Server configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mssql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 1433),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE', 'UtilityManagementDB'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // IMPORTANT: Never set to true - schema already exists
        logging: configService.get<string>('NODE_ENV') === 'development',
        options: {
          encrypt: false,
          trustServerCertificate:
            configService.get<string>('DB_TRUST_SERVER_CERTIFICATE') === 'true',
        },
        extra: {
          // For Windows Authentication (Trusted Connection)
          trustedConnection: !configService.get<string>('DB_USERNAME'),
        },
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    DatabaseModule,
    AuthModule,
    EmployeesModule,
    CustomersModule,
    ConnectionsModule,
    LookupModule,
    ReadingsModule,
    BillingModule,

    // Payment & Stripe modules
    StripeModule, // Global Stripe client
    PaymentsModule, // Payment processing
    WebhooksModule, // Stripe webhooks

    // Phase 8: Work Orders & Maintenance modules
    AssetsModule,
    WorkOrdersModule,
  ],
})
export class AppModule {}
