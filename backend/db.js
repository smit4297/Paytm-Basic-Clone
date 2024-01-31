const mongoose = require('mongoose');

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://admin:admin%40123@atlascluster.jds3tf7.mongodb.net/paytm');
}

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minLength: 3,
        maxLength: 30
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    }
  });

  const accountSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    },
    balance: {
      type: Number,
      required: true
    }
  })

  userSchema.methods.createHash = async function (plainTextPassword) {

    // Hashing user's salt and password with 10 iterations,
    const saltRounds = 10;
  
    // First method to generate a salt and then create hash
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(plainTextPassword, salt);
  
    // Second mehtod - Or we can create salt and hash in a single method also
    // return await bcrypt.hash(plainTextPassword, saltRounds);
  };
  
  // Validating the candidate password with stored hash and hash function
  userSchema.methods.validatePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password_hash);
  };

  const User = mongoose.model('User', userSchema);
  const Account = mongoose.model('Account', accountSchema)

  module.exports = {
    User,
    Account
  }