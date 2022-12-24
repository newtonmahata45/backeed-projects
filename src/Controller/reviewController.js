const reviewModel = require("../Models/reviewModel")
const bookModel = require("../Models/bookModel")
const { isValidObjectId, isValidName, forName } = require("../validator/validator")
const moment = require("moment")

//=========================================<== CREATER RREVIEW API==>==============================================================//
const Reviewcreate = async function (req, res) {
    try {
        let data = req.body;
        let id = req.params.bookId;
        const { rating, reviewedBy, review } = data

        if (!isValidObjectId(id)) { return res.status(400).send({ status: false, message: 'Plz provide a valid bookId' }) }
        if (Object.keys(data).length == 0) { return res.status(400).send({ status: false, message: 'Plz provied data' }) }

        if (!rating) { return res.status(400).send({ status: false, message: "rating is mandatory" }) }
        if (reviewedBy) {
            if (!isValidName(reviewedBy) || !forName(reviewedBy)) return res.status(400).send({ status: false, message: "Plz provied a valid name which starts with capital in reviewedBy" })
        }
        if (typeof rating != "number" || rating > 5 || rating < 1) { return res.status(400).send({ status: false, message: "Rating takes only numberic value in between 1-5" }) }
      
        if (review==='') { return res.status(400).send({ status: false, message: "Review should not be empty or invalid" }) }
        if (review) {
            if (!isValidName(review)) { return res.status(400).send({ status: false, message: "Review should not be empty or invalid" }) }
        }
        const book = await bookModel.findOne({ _id: id, isDeleted: false })
        if (!book) {
            return res.status(404).send({ status: false, message: "No book exists in Database with this Id" })
        }

        let date = moment().format("YYYY-MM-DD")               //date by using Moment
        data.reviewedAt = date;
        data.bookId = id

        const reviews = await reviewModel.create(data);
        const updatedBook = await bookModel.findOneAndUpdate({ _id: id }, { $inc: { reviews: +1 } })  // update reviews 

       
        return res.status(201).send({ status: true, data: reviews })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

//======================================<== updateReview RREVIEW API==>============================================================//

const updateReview = async function (req, res) {
    try {
        let bookId = req.params.bookId
        let reviewId = req.params.reviewId
        let data = req.body
       
        if (!isValidObjectId(bookId)) {
            res.status(400).send({ status: false, message: 'plz prrovied valid bookId' });
            return;
        }

        if (!isValidObjectId(reviewId)) {
            res.status(400).send({ status: false, message: 'plz prrovied valid reviewId' });
            return;
        }
        
        let findReview = await reviewModel.findOne({ _id: reviewId, isDeleted: false })
        if (!findReview) {
            return res.status(404).send({ status: false, message: "No Review Available in this Id" })
        }
        
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ message: " plz provied data" })
        }

        const { reviewedBy, review, rating } = data
        if (reviewedBy) {
            if (!isValidName(reviewedBy) || !forName(reviewedBy)) { return res.status(400).send({ status: false, message: "Plz provied a valid name which starts with capital in reviewedBy" }) }
        }
        if (review==='') { return res.status(400).send({ status: false, message: "Review should not be empty" }) }
        if (review) {
            if (!isValidName(review)) { return res.status(400).send({ status: false, message: "Review should not be empty or invalid" }) }
        }
        if (rating) {

            if (typeof rating != "number" || rating > 5 || rating < 1) { return res.status(400).send({ status: false, message: "Rating takes only numberic value in between 1-5" }) }
        }
        if (findReview.bookId != bookId) { return res.status(404).send({ status: false, message: "ReviewId and bookId does not match" }) }
        
        const updatedReview = await reviewModel.findOneAndUpdate({ _id: reviewId }, { ...data }, { new: true }).select({ __v: 0 })

        return res.status(200).send({ status: true, message: 'Review updated', data: updatedReview });

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}



///=========================================<== DELETE RREVIEW API==>==============================================================//
const deleteReview = async function (req, res) {
    try {
        let bookId = req.params.bookId
        let reviewId = req.params.reviewId

        

        if (!isValidObjectId(bookId)) { return res.status(400).send({ status: false, mes: ' provide a valid Book id' }) }

        if (!isValidObjectId(reviewId)) { return res.status(400).send({ status: false, mes: ' provide a valid Review id' }) }

        const findReview = await reviewModel.findOne({ _id: reviewId, isDeleted: false })
        if (!findReview) { return res.status(404).send({ status: false, message: "No review exists in Database with this Id" }) }

        if (findReview.bookId != bookId) { return res.status(404).send({ status: false, message: "ReviewId and bookId does not match" }) }

        let date = moment().format("YYYY-MM-DD")         //date by using Moment

        const deleteReviewDetails = await reviewModel.findOneAndUpdate({ _id: reviewId }, { isDeleted: true, deletedAt: date }, { new: true })

        const updatedBook = await bookModel.findOneAndUpdate({ _id: bookId }, { $inc: { reviews: -1 } })

        return res.status(200).send({ status: true, message: "Review deleted successfully." })

    }
    catch (error) {

        return res.status(500).send({ status: false, message: error.message })
    }
}

//========================================================================================================//


module.exports.Reviewcreate = Reviewcreate;
module.exports.deleteReview = deleteReview;
module.exports.updateReview = updateReview;
