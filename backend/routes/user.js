const express = require('express');
const zod = require('zod');
const { User } = require('../db');
const jwt = require("express-jwt");
const JWT_SECRET = require('../config');
const { authMiddleware } = require('../middlewares/middleware');

const userRouter = express.Router();

const signupSchema = zod.object({
    username: zod.string(),
	firstName: zod.string(),
	lastName: zod.string(),
	password: zod.string()
  });

  const signinSchema = zod.object({
    username: zod.string(),
	password: zod.string()
  });

  const updateSchema = zod.object({
	firstName: zod.string().optional(),
	lastName: zod.string().optional(),
	password: zod.string().min(6).optional()
  });

userRouter.post("/signup", async (req,res) => {
    const body = req.body;
    const {success} = signupSchema.safeParse(body)
    if(!success){
        return res.status(411).json({
            message: "Email already taken / Incorrect inputs"
        })
    }
    const user = await User.findOne({
        username: body.username
    })

    if(user._id){
        return res.status(411).json({
            message: "Email already taken / Incorrect inputs"
        })
    }

      var hashedPassword = await newUser.createHash(req.body.password);

      const newUser = new User({
        username: req.body.username,
        password: hashedPassword,
        firstName: req.body.firstName,
        lastName: req.body.lastName
      });
  
      const dbUser = await newUser.save();
      
      await Account.create({
        userId: dbUser._id,
        balance: 1 + Math.random() * 10000
    })
      const token = jwt.sign({ userId: dbUser._id},  Buffer.from(JWT_SECRET, 'base64'));
      return res.status(200).json({
        message: "User created successfully.",
        token: token
      });

})

userRouter.post("/signin", async (req, res) => {
    const body = req.body;
    const {success} = signinSchema.safeParse(body)
    if(!success){
        return res.status(411).json({
            message: "Error while logging in"
        })
    }
    const user = await User.findOne({
        username: body.username
    })
    
    if (user === null) {
      return res.status(400).json({
        message: "User not found.",
      });
    } else {
      if (await user.validatePassword(req.body.password)) {
        const token = jwt.sign({ userId: user._id},  Buffer.from(JWT_SECRET, 'base64'));
        return res.status(200).json({
            token: token,
        });
      } else {
        return res.status(400).json({
          message: "Incorrect Password",
        });
      }
    }
})

userRouter.put("/user", authMiddleware, async (req, res) => {
    const body = req.body;
    const {success} = updateSchema.safeParse(body)
    if(!success){
        return res.status(411).json({
            message: "Incorrect inputs"
        })
    }

    await User.updateOne(body,{
        _id: req.userId
    })

    res.status(200).json({
        message: "Updated successfully"
    })

})

userRouter.get("/user/bulk", authMiddleware, async (req, res) => {
    try {
        let filter = {};
        if (req.query.filter) {
            const regex = new RegExp(req.query.filter, 'i'); // Case-insensitive regex search
            filter = {
                $or: [
                    { firstName: regex },
                    { lastName: regex }
                ]
            };
        }
        const users = await User.find(filter, '_id firstName lastName');
        res.status(200).json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

})


module.exports = userRouter;