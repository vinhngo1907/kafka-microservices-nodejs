const express = require("express");
// const kafka = require("kafka-node");
const { Kafka } = require("kafkajs");
const app = express();
const sequelize = require("sequelize");
app.use(express.json());

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS]
});

const db = new sequelize(`${process.env.POSTGRES_URL}`);
const User = db.define('user', {
    name: sequelize.STRING,
    email: sequelize.STRING,
    password: sequelize.STRING,
});
db.sync({ force: true });


// Connect to the Kafka broker
async function connect() {
    await kafka.connect();
    console.log('Connected to Kafka');
}

// Send a message to Kafka
async function sendMessage(message) {
    const producer = kafka.producer();
    await producer.connect();
    await producer.send({ topic: process.env.KAFKA_TOPIC, messages: [{ value: JSON.stringify(message) }] }, async (err, data) => {
        if (err) {
            console.log(err);
            throw err;
        }
    })
    await producer.disconnect();
    console.log(`Sent message: ${message}`);
}

app.post("/api/send-message", async (req, res) => {
    try {
        await sendMessage(req.body);

        const newUser = await User.create();
        res.status(200).json({ msg: "Created data successfully", user: newUser });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: error.message });
    }
})

app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
    // connect().catch(console.error);
});