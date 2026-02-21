import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Sub-document for the user profile embedded in the User document.
 */
@Schema({ _id: false })
export class UserProfile {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ type: Number })
  grade?: number;

  @Prop({ type: Date })
  dateOfBirth?: Date;
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);

export type UserDocument = HydratedDocument<User>;

/**
 * Mongoose schema for the `users` collection.
 *
 * Matches the MongoDB JSON‑Schema validation defined in
 * docker/mongodb-init/init.js while adding the fields required
 * by the student registration flow (password, learningGoals,
 * selectedAvatar).
 */
@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    required: true,
    enum: ['student', 'parent', 'teacher', 'admin'],
    default: 'student',
  })
  role: string;

  @Prop({ type: UserProfileSchema, required: true })
  profile: UserProfile;

  @Prop({ type: [String], default: [] })
  learningGoals: string[];

  @Prop({ type: String, default: null })
  selectedAvatar: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
