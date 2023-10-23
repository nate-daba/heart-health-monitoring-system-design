import {Schema, model} from 'mongoose';

export interface Physician{
    first_name:string;
    last_name:string;
    email:string;
    password:string;
    address:string;
    isAdmin:boolean;
    patients: [ ];
}

export const PhysicianSchema = new Schema<Physician>({
    first_name: {type: String, required: true},
    last_name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    address: {type: String, required: true},
    isAdmin: {type: Boolean, required: true},
    patients: {type: [ ], required:true}
}, {
    timestamps: true,
    toJSON:{
        virtuals: true
    },
    toObject:{
        virtuals: true
    }
});

export const PhysicianModel = model<Physician>('physician', PhysicianSchema);