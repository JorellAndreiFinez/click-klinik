import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, collection: 'doctor_schedule_slots' })
export class ScheduleSlot {
  @Prop({ required: true, index: true })
  doctorApplicationId!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  doctorEmail!: string;

  @Prop({ required: true })
  startAt!: Date;

  @Prop({ required: true })
  endAt!: Date;

  @Prop({ required: true, enum: ['available', 'unavailable', 'booked'] })
  status!: 'available' | 'unavailable' | 'booked';

  @Prop({ required: true, enum: ['template', 'manual'], default: 'manual' })
  source!: 'template' | 'manual';

  @Prop({ trim: true })
  note?: string;
}

export const ScheduleSlotSchema = SchemaFactory.createForClass(ScheduleSlot);
ScheduleSlotSchema.index({ doctorApplicationId: 1, startAt: 1 });

@Schema({ timestamps: true, collection: 'doctor_schedule_notifications' })
export class ScheduleNotification {
  @Prop({ required: true, index: true })
  doctorApplicationId!: string;

  @Prop({
    required: true,
    enum: ['slot_created', 'slot_updated', 'slot_removed'],
  })
  type!: 'slot_created' | 'slot_updated' | 'slot_removed';

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  message!: string;

  @Prop({ required: true, default: false })
  read!: boolean;
}

export const ScheduleNotificationSchema =
  SchemaFactory.createForClass(ScheduleNotification);
