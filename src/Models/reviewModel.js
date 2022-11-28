const mongoose =require("mongoose")
const reviewSchema=new mongoose.Schema({
    bookId: {type:ObjectId, required:true, refs:"Book"},
  reviewedBy: {type:String,required:true, default: 'Guest'},
  reviewedAt: {type:Date},
  rating: {type:Number, min:1, max:5,required:true},
  review: {type:String},
  isDeleted: {type:Boolean, default: false},
},{timestamps:true})

module.exports=mongoose.model("Review",reviewSchema)
