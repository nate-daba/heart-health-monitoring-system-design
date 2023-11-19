import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { Router } from 'express';
import { Physician, PhysicianModel } from '../models/physician.model';
import { User, UserModel } from '../models/user.model';
import { MeasurementModel } from '../models/measurement.model';
import bcrypt from 'bcryptjs';
import axios from 'axios';

const router = Router();

var physician:any;

router.post('/login', asyncHandler(
    async (req, res) => {
        // 1. const body = req.body;
        const {email, password} = req.body; // alternatively (Destructuring Assignment)
        // 1. const user = sample_users.find(user => user.email === body.email &&
        //     user.password === body.password);
        physician = await PhysicianModel.findOne({email});
        
        if(physician && (await bcrypt.compare(password,physician.password))){
            console.log('b4 genTknResp');
            console.log(physician);
            res.send(generateTokenResponse(physician));
        } else {
            res.status(400).send("Email or password are invalid.");
        }
}))

router.post('/register', asyncHandler(
    async (req, res) => {
        console.log('in register')
        const {first_name, last_name, email, password, address} = req.body;
        console.log(email, ", ", password)
        physician = await PhysicianModel.findOne({email});
        if (physician) {
            res.status(400).send("Physician already exists, please login.");
            return;
        }

        const encryptedPassword = await bcrypt.hash(password, 10);

        const newPhysician = new PhysicianModel ({
            first_name, // if 'name: name', you can just write 'name'
            last_name,
            email: email.toLowerCase(),
            password: encryptedPassword,
            address
        })

        const dbPhysician = await PhysicianModel.create(newPhysician);
        res.send(generateTokenResponse(dbPhysician));
        alert(generateTokenResponse(dbPhysician))
        // res.send(dbPhysician);
    }
))

const generateTokenResponse = (physician: Physician) => {
    const token = jwt.sign( //generate a token = sign a token
        { email:physician.email }, 
        "SecretKey",
        { expiresIn: "30d"}
    );

    return {
        email:physician.email,
        first_name: physician.first_name,
        last_name: physician.last_name,
        address: physician.address,
        token: token
    };
}

export default router;