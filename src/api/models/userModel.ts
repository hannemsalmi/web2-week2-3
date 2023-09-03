// TODO: mongoose schema for user
import {Schema, model} from 'mongoose';
import {User} from '../../interfaces/User';

const userSchema = new Schema<User>({
  user_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    required: true,
    select: false,
  },
  password: {
    type: String,
    required: true,
  },
});

export default model<User>('User', userSchema);
