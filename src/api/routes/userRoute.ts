import express from 'express';
import {
  checkToken,
  userDeleteCurrent,
  userGet,
  userListGet,
  userPost,
  userPutCurrent,
} from '../controllers/userController';
import passport from '../../passport';
import {body, param} from 'express-validator';

const router = express.Router();

// Validation middleware functions
const validateUserId = param('id').isMongoId();
const validateUserPost = [
  body('user_name').isString(),
  body('email').isEmail(),
];

router
  .route('/')
  .get(userListGet)
  .post(validateUserPost, userPost)
  .put(passport.authenticate('jwt', {session: false}), userPutCurrent)
  .delete(passport.authenticate('jwt', {session: false}), userDeleteCurrent);

router.get(
  '/token',
  passport.authenticate('jwt', {session: false}),
  checkToken
);

router.route('/:id').get(validateUserId, userGet);

export default router;
