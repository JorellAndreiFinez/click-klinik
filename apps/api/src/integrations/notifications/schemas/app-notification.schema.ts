import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type AppNotificationRecipientRole = 'doctor' | 'patient';
export type AppNotificationType =
  | 'appointment_booked'
  | 'appointment_status'
  | 'payment'
  | 'payout'
  | 'refund'
  | 'medical_record';

@Schema({ timestamps: true, collection: 'app_notifications' })
export class AppNotification {
  @Prop({ required: true, enum: ['doctor', 'patient'], index: true })
  recipientRole!: AppNotificationRecipientRole;

  @Prop({ required: true, index: true })
  recipientId!: string;

  @Prop({ required: true, enum: ['appointment_booked', 'appointment_status', 'payment', 'payout', 'refund', 'medical_record'] })
  type!: AppNotificationType;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  message!: string;

  @Prop({ trim: true })
  href?: string;

  @Prop({ required: true, default: false, index: true })
  read!: boolean;
}

export const AppNotificationSchema =
  SchemaFactory.createForClass(AppNotification);

AppNotificationSchema.index(
  { recipientRole: 1, recipientId: 1, createdAt: -1 },
  { name: 'recipient_notification_timeline' },
);
