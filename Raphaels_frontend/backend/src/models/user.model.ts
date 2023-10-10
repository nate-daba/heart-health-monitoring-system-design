import {Schema, model} from 'mongoose';
import { HeartRateSchema, HeartRateModel } from './heart-rate.model';

export interface User{
    first_name:string;
    last_name:string;
    email:string;
    password:string;
    address:string;
    isAdmin:boolean;
    heartRateData: [ ];
}

export const UserSchema = new Schema<User>({
    first_name: {type: String, required: true},
    last_name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    address: {type: String, required: true},
    isAdmin: {type: Boolean, required: true},
    heartRateData: {type: [ ], required:true}
}, {
    timestamps: true,
    toJSON:{
        virtuals: true
    },
    toObject:{
        virtuals: true
    }
});

export const UserModel = model<User>('user', UserSchema);