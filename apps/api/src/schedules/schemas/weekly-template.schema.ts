import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, collection: 'doctor_weekly_templates' })
export class WeeklyTemplateEntry {
  @Prop({ required: true, index: true })
  doctorApplicationId!: string;

  @Prop({ required: true, min: 0, max: 6 })
  dayOfWeek!: number;

  @Prop({ required: true, enum: ['off', 'available', 'unavailable'] })
  status!: 'off' | 'available' | 'unavailable';

  @Prop()
  startTime?: string;

  @Prop()
  endTime?: string;
}

export const WeeklyTemplateEntrySchema =
  SchemaFactory.createForClass(WeeklyTemplateEntry);
WeeklyTemplateEntrySchema.index(
  { doctorApplicationId: 1, dayOfWeek: 1 },
  { unique: true },
);
