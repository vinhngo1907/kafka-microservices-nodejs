require("dotenv").config();
const express = require("express");
const connectDB = require("./configs/db.config");
const User = require("./models/User");
const { Kafka } = require("kafkajs");

// Connect DB
connectDB();

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS],
    sasl: {
        mechanism: 'plain',
        username: process.env.CLIENT_USER,
        password: process.env.CLIENT_PASSWORD
    },
});
const consumer = kafka.consumer({ groupId: 'test-group' });
async function KafkaConnect() {
    await consumer.connect();
};


const dbsAreRunning = async () => {

    // Consuming
    await consumer.subscribe({ topic: process.env.KAFKA_TOPIC, fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log({
                partition,
                offset: message.offset,
                value: message.value.toString(),
            });
            const newUser = await new User(JSON.parse(message.value));
            await newUser.save();
        },
    })

    // consumer.on('error', (err) => {
    //     console.log(">>>>>>>>>>>>>>>", err);
    // });
}

const app = express();
app.use(express.json());

app.get("/", async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json({ msg: "Get data successfully", users })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: error.message });
    }
})

dbsAreRunning();

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on port ${process.env.PORT}`);
    KafkaConnect();
});