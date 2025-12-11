import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import cors from 'cors'
import authroutes from './src/routes/authroutes.js'
import jobroutes from "./src/routes/jobroutes.js";
import applicationroutes from "./src/routes/applicationroutes.js";
import statsroutes from "./src/routes/statsroutes.js";
import adminroutes from "./src/routes/adminroutes.js";

dotenv.config()
const app=express()
app.use(cors())
app.use(express.json())
app.use('/api/auth',authroutes)
app.use("/api/jobs", jobroutes);
app.use("/api/applications", applicationroutes);
app.use("/api/stats", statsroutes);
app.use("/api/admin", adminroutes);

app.get('/',(req,res)=>{
    res.send("Server is runnning");
})
mongoose.connect(process.env.MONGO_URI).then(()=>console.log("mongo connected")).catch((err)=>console.log(err))
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message });
  });
  
