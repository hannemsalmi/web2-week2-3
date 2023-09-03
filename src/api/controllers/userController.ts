// TODO: create the following functions:
// - userGet - get user by id
// - userListGet - get all users
// - userPost - create new user. Remember to hash password
// - userPutCurrent - update current user
// - userDeleteCurrent - delete current user
// - checkToken - check if current user token is valid: return data from req.user. No need for database query

import {Request, Response, NextFunction} from 'express';
import CustomError from '../../classes/CustomError';
import {User, UserOutput} from '../../interfaces/User';
import UserModel from '../models/userModel';
import DBMessageResponse from '../../interfaces/DBMessageResponse';
import MessageResponse from '../../interfaces/MessageResponse';
import bcrypt from 'bcryptjs';

const saltRounds = 10;

const userGet = async (
  req: Request<{id: string}, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }

    const userData = {
      _id: user._id,
      user_name: user.user_name,
      email: user.email,
    };

    res.json(userData);
  } catch (error) {
    next(error);
  }
};

const userListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await UserModel.find();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const userPost = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    const {user_name, email} = req.body;

    const user = await UserModel.create({
      user_name: user_name,
      email: email,
      password: hashedPassword,
      role: 'user',
    });

    const message: MessageResponse = {
      message: 'User added',
    };
    res.json({message, data: user._id}); // Updated response structure
  } catch (error) {
    next(error);
  }
};

const userPutCurrent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await UserModel.findById((req.user as User)._id);
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    if (req.body.email) {
      user.email = req.body.email;
    }
    if (req.body.user_name) {
      user.user_name = req.body.user_name;
    }
    await user.save();

    const userData = {
      _id: user._id,
      user_name: user.user_name,
      email: user.email,
    };

    const message: MessageResponse = {
      message: 'User updated',
    };
    res.json({message, data: userData});
  } catch (error) {
    next(new CustomError('Database error', 500));
  }
};

const userDeleteCurrent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.user as User)._id;
    const deletedUser = await UserModel.findByIdAndDelete(userId)
      .select('user_name email') // Projection to select only 'user_name' and 'email'
      .exec();

    if (!deletedUser) {
      next(new CustomError('User not found', 404));
      return;
    }

    res.json({message: 'User deleted', data: deletedUser});
  } catch (error) {
    next(new CustomError('Database error', 500));
  }
};

const checkToken = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    next(new CustomError('Token not valid', 403));
  } else {
    const userData: UserOutput = req.user;
    const {password, role, ...userWithoutPasswordAndRole} = userData;

    res.json(userWithoutPasswordAndRole);
  }
};

export {
  userGet,
  userListGet,
  userPost,
  userPutCurrent,
  userDeleteCurrent,
  checkToken,
};
