const mongoose= require("mongoose");
const moment=require("moment")
const {ObjectId}=mongoose.Schema.Types

const driverLocationSchema=new mongoose.Schema(
    {
       driverId:{
        type: ObjectId,
        ref:"rido_driver"
       },
       location:{
           type:{
               type:String,
           },
           coordinates: [],
       },
       socketId:{
           type:String
       }
    },
    {
        timestamps:true,
    }
);

driverLocationSchema.index({location:"2dsphere"});

module.exports=mongoose.model("driver_locations",driverLocationSchema)