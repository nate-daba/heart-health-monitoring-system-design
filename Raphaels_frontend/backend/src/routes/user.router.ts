import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { Router } from 'express';
import { User, UserModel } from '../models/user.model';
import { MeasurementModel } from '../models/measurement.model';
import bcrypt from 'bcryptjs';
import axios from 'axios';

const router = Router();

var user:any;

router.post('/login', asyncHandler(
    async (req, res) => {
        // 1. const body = req.body;
        const {email, password} = req.body; // alternatively (Destructuring Assignment)
        // 1. const user = sample_users.find(user => user.email === body.email &&
        //     user.password === body.password);
        const user = await UserModel.findOne({email});
        
        if(user && (await bcrypt.compare(password,user.password))){
            console.log('b4 genTknResp');
            console.log(user);
            res.send(generateTokenResponse(user));
        } else {
            res.status(404).send("Email or password are invalid.");
        }
}))

router.post('/register', asyncHandler(
    async (req, res) => {
        console.log('in register')
        const {first_name, last_name, email, password, address} = req.body;
        console.log(email, ", ", password)
        user = await UserModel.findOne({email});
        if (user) {
            res.status(400).send("User already exists, please login.");
            return;
        }

        const encryptedPassword = await bcrypt.hash(password, 10);

        const newUser = new UserModel ({
            //id:'',
            first_name, // if 'name: name', you can just write 'name'
            last_name,
            email: email.toLowerCase(),
            password: encryptedPassword,
            address
        })

        const dbUser = await UserModel.create(newUser);
        res.send(generateTokenResponse(dbUser));
        alert(generateTokenResponse(dbUser))
        // res.send(dbUser);
    }
))

const generateTokenResponse = (user: User) => {
    const token = jwt.sign( //generate a token = sign a token
        { //id: user.id, 
            email:user.email }, 
        "SecretKey",
        { expiresIn: "30d"}
    );

    return {
        //id: user.id,
        email:user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        address: user.address,
        token: token
    };
}

export default router;