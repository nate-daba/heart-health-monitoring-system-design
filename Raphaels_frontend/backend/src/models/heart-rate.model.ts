import {Schema, model} from 'mongoose';

// export interface HeartRate {
//     sensorValue: number;
//     timeStamp: Date;
// }

export const HeartRateSchema = new Schema({
    sensorValue: {type: Number, required: true},
    timeStamp: {type: Date, required: true}
}, {
    timestamps: true,
    toJSON:{
        virtuals: true
    },
    toObject:{
        virtuals: true
    }
});

export const HeartRateModel = model('heart-rate', HeartRateSchema);