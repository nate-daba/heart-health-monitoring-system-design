import {Schema, model} from 'mongoose';

export interface Device{
    name:string;
    deviceId:string;
    email:string;
}

export const DeviceSchema = new Schema<Device>({
    name: {type: String, required: true},
    deviceId: {type: String, required: true},
    email: {type: String, required: true}
}, {
    timestamps: true,
    toJSON:{
        virtuals: true
    },
    toObject:{
        virtuals: true
    }
});

export const DeviceModel = model<Device>('device', DeviceSchema);