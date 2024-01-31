const express = require('express');
const { authMiddleware } = require('../middlewares/middleware');
const { User, Account } = require('../db');
const zod = require("zod");
const { default: mongoose } = require('mongoose');
const { ObjectId } = mongoose.Types;
const accountRouter = express.Router();

const transferSchema = zod.object({
    to: zod.string(),
	amount: zod.number()
  });

accountRouter.get("/balance", authMiddleware, async (req, res) => {
    try{

        const userAccount = await Account.findOne({
            userId: req.userId
        })

        if(!userAccount){
            return res.status(500).json({
                message : "no account found" 
            })
        }
        return res.json({
            balance: userAccount.balance
        })

    }catch(err){
        return res.status(500).json({
            message : "something went wrong" 
        })
    }
})


accountRouter.post("/transfer", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const body = req.body;
        const { success, data } = transferSchema.safeParse(body);

        if (!success) {
            throw new Error("Error while parsing body");
        }

        // Convert userId values to ObjectId type
        // const payeeUserId = mongoose.Types.ObjectId(data.to);
        // const userUserId = mongoose.Types.ObjectId(req.userId);

        const payeeAccount = await Account.findOne({ userId: body.to }).session(session);

        if (!payeeAccount) {
            throw new Error("No payee account found");
        }

        const userAccount = await Account.findOne({ userId: req.userId }).session(session);

        if (!userAccount || userAccount.balance < data.amount) {
            return res.status(400).json({
                message:"insufficient balance"
            })
        }

         // Decrement the balance of the fromAccount
        await Account.findByIdAndUpdate(userAccount._id, { $inc: { balance: -body.amount } }, { session });

        // // Increment the balance of the toAccount
        await Account.findByIdAndUpdate(payeeAccount._id, { $inc: { balance: body.amount } }, { session });

        // Perform both updates in a single database call
        // await Account.updateMany(
        //     { _id: { $in: [userAccount._id, payeeAccount._id] } },
        //     { $inc: { balance: payeeUserId.equals(userUserId) ? -data.amount : data.amount } },
        //     { session }
        // );

        // If all operations succeed, commit the transaction
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: "Transfer successful" });
    } catch (error) {
        // If an error occurs, abort the transaction
        await session.abortTransaction();
        session.endSession();

        console.error("Error during transfer:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


module.exports = {
    accountRouter
}