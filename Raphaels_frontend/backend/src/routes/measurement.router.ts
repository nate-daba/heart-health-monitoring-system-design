import asyncHandler from 'express-async-handler';
import { Router } from 'express';
import { MeasurementModel } from '../models/measurement.model';
import { User, UserModel } from '../models/user.model';
import axios from 'axios';
import qs from 'qs';

const router = Router();

router.post('/', asyncHandler(
    async (req, res) => {
        const { eventName, data, deviceId } = req.body;
        console.log(eventName, ", ", deviceId)
        // Store the data in your MongoDB database
        const newData = new MeasurementModel({ 
            eventName,
            data,
            deviceId
        });
        const dbMeasurement = await MeasurementModel.create(newData);
        //newData.save(); // from Nate's server

        res.sendStatus(200);
        alert(`Measurement ${data} was added to the database.`)
    }
));

export default router;