// TODO: user interface
import {Document} from 'mongoose';

interface User extends Document {
  user_name: string;
  email: string;
  role: 'user' | 'admin';
  password: string;
}

export type UserOutput = Partial<User>;

export type LoginUser = Omit<User, 'user_name' | 'role'>;

export type UserTest = Partial<User>;

export {User};
