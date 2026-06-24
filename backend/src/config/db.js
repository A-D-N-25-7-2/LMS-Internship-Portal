import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${process.env.DB_NAME}`);
        console.log(`\n Connected to DB succesfully, Host: ${mongoose.connection.host} `)
    }
    catch(err){
        console.log("Error occured while connecting to DB",err);
        process.exit(1);
    }
} 

export { connectDB };