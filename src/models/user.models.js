import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto"

const UserSchema= new Schema({
    avatar:{
        type:{
            url: String,
            localpath: String,
        },
        default:{
            url: `https://placehold.co/600x400`,
            localpath: "",
        }

    },

    username:{
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        required: true
    },

    email:{
        type: String,
        unique: true,
        trim: true,
        required: true,
        lowercase: true,
    },

    fullname:{
        type: String,
        required: true,
    },

    password:{
        type: String,
        required: true,
    },

    isEmailVerified:{
        type: Boolean,
        default: false,
    },

    refreshToken:{
        type: String,
    },

    forgotPasswordToken:{
        type: String,
    },

    forgotPasswordExpiry:{
        type: Date,
    },

    emailVerificationToken:{
        type: String,
    },

    emailVerificationExpiry:{
        type: Date,
    }
},{timestamps: true})


// hook
UserSchema.pre("save", async function (next){
    if(!this.isModified("password")) return next();
    this.password= await bcrypt.hash(this.password, 10)
    next();
})


// methods

UserSchema.methods.isPassCorrect= async function(password){
    return await bcrypt.compare(password, this.password)
}

UserSchema.methods.generateAccessToken= function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username
        },

        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}

    )
}

UserSchema.methods.generateRefreshToken= function(){
    return jwt.sign(
        {
            _id: this.id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}
    )
}

UserSchema.methods.generateTemporaryToken = function () {
  // This token should be client facing
  // for example: for email verification unHashedToken should go into the user's mail
  const unHashedToken = crypto.randomBytes(20).toString("hex");

  // This should stay in the DB to compare at the time of verification
  const hashedToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");
  // This is the expiry time for the token (20 minutes)
  const tokenExpiry = Date.now() + 20 * 60 * 1000; // 20 minutes;

  return { unHashedToken, hashedToken, tokenExpiry };
};


export const User= mongoose.model("User", UserSchema)