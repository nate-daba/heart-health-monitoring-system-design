import {Schema, model} from 'mongoose';

// export interface HeartRate {
//     sensorValue: number;
//     timeStamp: Date;
// }

export const MeasurementSchema = new Schema({
    eventName: String,
    data: {heartrate: Number, spo2: Number},
    deviceId: String
    //published_at: Date // this should later be changed to measurementTime
    //measurementTime: Date
}, {
    timestamps: true,
    toJSON:{
        virtuals: true
    },
    toObject:{
        virtuals: true
    }
});

export const MeasurementModel = model('measurements', MeasurementSchema, 'data');