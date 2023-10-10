export class User{
    id!:string;
    email!:string;
    first_name!:string;
    last_name!:string;
    address!:string;
    token!:string;
    isAdmin!:boolean;
    heartRateData!: [
        { sensorValue: number, timeStamp: Date}
    ]
}