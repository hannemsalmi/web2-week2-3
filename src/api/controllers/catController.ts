// TODO: create following functions:
// - catGetByUser - get all cats by current user id
// - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)
// - catPutAdmin - only admin can change cat owner
// - catDeleteAdmin - only admin can delete cat
// - catDelete - only owner can delete cat
// - catPut - only owner can update cat
// - catGet - get cat by id
// - catListGet - get all cats
// - catPost - create new cat

import {Request, Response, NextFunction} from 'express';
import CustomError from '../../classes/CustomError';
import {Cat} from '../../interfaces/Cat';
import CatModel from '../models/catModel';
import DBMessageResponse from '../../interfaces/DBMessageResponse';
import {User} from '../../interfaces/User';
import MessageResponse from '../../interfaces/MessageResponse';
import mongoose from 'mongoose';
import {Point} from 'geojson';
import rectangleBounds from '../../utils/rectangleBounds';

const catGetByUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cats = await CatModel.find({owner: (req.user as User)._id});
    res.json(cats);
  } catch (error) {
    next(new CustomError('Database error', 500));
  }
};

const catGetByBoundingBox = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const topRight = {
      lat: parseFloat((req.query.topRight as string).split(',')[0]),
      lng: parseFloat((req.query.topRight as string).split(',')[1]),
    };
    const bottomLeft = {
      lat: parseFloat((req.query.bottomLeft as string).split(',')[0]),
      lng: parseFloat((req.query.bottomLeft as string).split(',')[1]),
    };
    console.log(topRight, bottomLeft);

    const polygonCoordinates = rectangleBounds(topRight, bottomLeft);
    console.log(polygonCoordinates);
    const cats = await CatModel.find({
      location: {
        $geoWithin: {
          $geometry: polygonCoordinates,
        },
      },
    });
    console.log(cats);
    res.json(cats);
  } catch (error) {
    next(error);
  }
};

const catPutAdmin = async (
  req: Request<
    {id: string},
    {},
    {
      cat_name?: string;
      owner?: string;
      weight?: number;
      filename?: string;
      birthdate?: Date;
      location?: Point;
    }
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const updatedData: {
      owner?: string;
      cat_name?: string;
      weight?: number;
      filename?: string;
      birthdate?: Date;
      location?: Point;
    } = {};

    if (req.body.cat_name) {
      updatedData.cat_name = req.body.cat_name;
    }

    if (req.body.owner) {
      updatedData.owner = req.body.owner;
    }

    if (req.body.weight) {
      updatedData.weight = req.body.weight;
    }

    if (req.body.filename) {
      updatedData.filename = req.body.filename;
    }

    if (req.body.birthdate) {
      updatedData.birthdate = new Date(req.body.birthdate);
    }

    if (req.body.location) {
      // Assuming location is an object with x and y properties
      updatedData.location = req.body.location;
    }

    const cat = await CatModel.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    });

    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }

    res.json({message: 'Cat modified', data: cat});
  } catch (error) {
    next(new CustomError('Database error', 500));
  }
};

const catDeleteAdmin = async (
  req: Request<{id: string}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const cat = await CatModel.findByIdAndDelete(req.params.id);
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    res.json({message: 'Cat deleted', data: cat});
  } catch (error) {
    next(new CustomError('Database error', 500));
  }
};

const catDelete = async (
  req: Request<{id: string}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const catId = req.params.id;
    const cat = await CatModel.findByIdAndDelete(catId);
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    if (cat.owner.toString() !== (req.user as User)._id.toString()) {
      next(new CustomError('Not authorized', 401));
      return;
    }
    res.json({message: 'Cat deleted', data: cat});
  } catch (error) {
    next(new CustomError('Database error', 500));
  }
};

const catPut = async (
  req: Request<{id: string}, {}, Cat>,
  res: Response,
  next: NextFunction
) => {
  try {
    const catId = req.params.id;

    // Create an object to hold the updated fields
    const updatedCat: Partial<Cat> = {};

    if (req.body.cat_name) {
      updatedCat.cat_name = req.body.cat_name;
    }

    if (req.body.weight) {
      updatedCat.weight = req.body.weight;
    }

    if (req.body.birthdate) {
      updatedCat.birthdate = req.body.birthdate;
    }

    // Check if there are any fields to update
    if (Object.keys(updatedCat).length === 0) {
      // No fields to update, return a message or error as needed
      return res.status(400).json({error: 'No fields to update'});
    }

    const updatedCatDocument = await CatModel.findByIdAndUpdate(
      catId,
      updatedCat,
      {
        new: true, // Return the updated document
        runValidators: true, // Run mongoose validation checks
      }
    );

    if (!updatedCatDocument) {
      next(new CustomError('Cat not found', 404));
      return;
    }

    if (
      updatedCatDocument.owner.toString() !== (req.user as User)._id.toString()
    ) {
      next(new CustomError('Not authorized', 401));
      return;
    }

    res.json(res.json({message: 'Cat modified', data: updatedCatDocument}));
  } catch (error) {
    next(new CustomError('Database error', 500));
  }
};

const catGet = async (
  req: Request<{id: string}, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;

    const cat = await CatModel.findById(id).populate('owner');

    if (!cat) {
      return res.status(404).json({message: 'Cat not found'});
    }

    const catData = {
      _id: cat._id,
      cat_name: cat.cat_name,
      weight: cat.weight,
      filename: cat.filename,
      birthdate: cat.birthdate,
      location: cat.location,
      owner: cat.owner,
    };

    res.json(catData);
  } catch (error) {
    console.error('errorHandler', error);
    next(new CustomError('Internal Server Error', 500));
  }
};

const catListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cats = await CatModel.find().populate('owner');
    res.json(cats);
  } catch (error) {
    next(new CustomError('Database error', 500));
  }
};

const catPost = async (
  req: Request<{}, {}, Cat>,
  res: Response,
  next: NextFunction
) => {
  try {
    const {cat_name, birthdate, weight} = req.body;

    if (!req.file) {
      return res.status(400).json({error: 'No file uploaded'});
    }

    const filename = req.file.filename;

    const cat = await CatModel.create({
      cat_name: cat_name,
      weight: weight,
      filename: filename,
      birthdate: birthdate,
      location: res.locals.coords,
      owner: (req.user as User)._id,
    });

    const message: MessageResponse = {
      message: 'Cat added',
    };
    res.json({message, data: cat});
  } catch (error) {
    next(error);
  }
};
export {
  catGetByUser,
  catGetByBoundingBox,
  catPutAdmin,
  catDeleteAdmin,
  catDelete,
  catPut,
  catGet,
  catListGet,
  catPost,
};
