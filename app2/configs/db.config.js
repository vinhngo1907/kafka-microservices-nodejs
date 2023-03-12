const mongoose = require('mongoose');

async function ConnectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/example', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB connect to ${process.env.MONGO_URL}`);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

module.exports = ConnectDB;