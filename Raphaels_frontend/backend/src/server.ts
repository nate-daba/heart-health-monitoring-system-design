import mongoose from 'mongoose';
import express from 'express';
import cors from "cors";
import userRouter from './routes/user.router';
import heartRateRouter from './routes/heart-rate.router';

const app = express();

mongoose.connect('mongodb://127.0.0.1/heart2')
    .then(() => console.log('Connected to MongoDB...'))
    .catch((err: any) => console.error('Could not connect to MongoDB...', err));

app.use(express.json());
app.use(cors({ // why to use cors: https://youtu.be/Y28hObRey9g?t=413
    credentials:true,
    origin:["http://localhost:4200"]
}));
app.use("/api/users", userRouter);
app.use("/api/heart-rate", heartRateRouter);

const port = 5000
app.listen(port, () => {
    console.log("Website served on http://localhost:" + port);
})