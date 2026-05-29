import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type HealthMonitoringLogDocument = HydratedDocument<HealthMonitoringLog>;

export type HealthMonitoringTrend =
  | 'stable'
  | 'changed'
  | 'needs_attention'
  | 'first_log';

@Schema({ timestamps: true, collection: 'health_monitoring_logs' })
export class HealthMonitoringLog {
  @Prop({ required: true, index: true })
  patientId!: string;

  @Prop({ required: true, trim: true })
  patientName!: string;

  @Prop({ required: true, trim: true })
  patientEmail!: string;

  @Prop({ required: true, default: Date.now, index: true })
  loggedAt!: Date;

  @Prop()
  systolicBp?: number;

  @Prop()
  diastolicBp?: number;

  @Prop()
  glucoseMgDl?: number;

  @Prop()
  temperatureC?: number;

  @Prop()
  oxygenSaturation?: number;

  @Prop()
  pulseBpm?: number;

  @Prop()
  weightKg?: number;

  @Prop({ type: [String], default: [] })
  symptoms!: string[];

  @Prop({ trim: true })
  notes?: string;

  @Prop({
    required: true,
    enum: ['stable', 'changed', 'needs_attention', 'first_log'],
    default: 'first_log',
  })
  trend!: HealthMonitoringTrend;

  @Prop({ required: true, trim: true })
  analysisSummary!: string;

  @Prop({ type: [String], default: [] })
  flags!: string[];

  @Prop({ required: true, trim: true })
  disclaimer!: string;
}

export const HealthMonitoringLogSchema =
  SchemaFactory.createForClass(HealthMonitoringLog);

HealthMonitoringLogSchema.index(
  { patientId: 1, loggedAt: -1 },
  { name: 'patient_monitoring_timeline' },
);
