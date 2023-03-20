require("dotenv").config();
const express = require("express");
const { Kafka } = require("kafkajs");
const app = express();
const sequelize = require("sequelize");
app.use(express.json());

const db = new sequelize(process.env.POSTGRES_URL);
const User = db.define('user', {
    name: sequelize.STRING,
    email: sequelize.STRING,
    password: sequelize.STRING,
});

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS],
    sasl: {
        mechanism: 'plain',
        username: process.env.CLIENT_USER,
        password: process.env.CLIENT_PASSWORD
    },
});

const producer = kafka.producer()
async function KafkaConnect() {
  await producer.connect()
};
KafkaConnect();

// db.sync({ force: true });

// Send a message to Kafka
async function sendMessage(message) {
    await producer.send({ topic: process.env.KAFKA_TOPIC, messages: [{ value: JSON.stringify(message) }] }, async (err, data) => {
        if (err) {
            console.log(err);
            throw err;
        }
    })
    await producer.disconnect();
    console.log(`Sent message: ${JSON.stringify(message)}`);
}

app.post("/api/send-message", async (req, res) => {
    try {
        await sendMessage(req.body);

        const newUser = await User.create(req.body);
        res.status(200).json({ msg: "Created data successfully", user: {...newUser._doc} });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: error.message });
    }
})

app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
    KafkaConnect();
});