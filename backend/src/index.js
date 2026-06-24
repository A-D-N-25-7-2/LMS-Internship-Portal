import dotenv from 'dotenv';

dotenv.config({
    path: './.env',
})

import { app } from './app.js';
import { connectDB } from './config/db.js';

connectDB()
.then(() => {
    app.listen(process.env.PORT, ()=> {
        console.log(`Server is listening to port: ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("Database connect failed: ", err);
    process.exit(1);
});