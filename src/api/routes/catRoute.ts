import express, {Request} from 'express';
import multer, {FileFilterCallback} from 'multer';
import {body, param, query} from 'express-validator';
import passport from '../../passport';
import {
  catDelete,
  catGet,
  catListGet,
  catPost,
  catPut,
  catGetByUser,
  catGetByBoundingBox,
  catPutAdmin,
  catDeleteAdmin,
} from '../controllers/catController';
import {getCoordinates, makeThumbnail} from '../../middlewares';

const fileFilter = (
  request: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.includes('image')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const upload = multer({dest: './uploads/', fileFilter});
const router = express.Router();

// Validation middleware functions
const validateCatId = param('id').isMongoId();

const validateCatPost = [
  passport.authenticate('jwt', {session: false}),
  upload.single('cat'),
  makeThumbnail,
  getCoordinates,
  body('propertyName').isString(),
];

router.route('/').get(catListGet).post(validateCatPost, catPost);

router.route('/area').get(catGetByBoundingBox);

router
  .route('/user')
  .get(passport.authenticate('jwt', {session: false}), catGetByUser);

router
  .route('/admin/:id')
  .put(
    passport.authenticate('jwt', {session: false}),
    validateCatId,
    catPutAdmin
  )
  .delete(
    passport.authenticate('jwt', {session: false}),
    validateCatId,
    catDeleteAdmin
  );

router
  .route('/:id')
  .get(validateCatId, catGet)
  .put(passport.authenticate('jwt', {session: false}), validateCatId, catPut)
  .delete(
    passport.authenticate('jwt', {session: false}),
    validateCatId,
    catDelete
  );

export default router;
