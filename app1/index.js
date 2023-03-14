const express = require("express");
// const kafka = require("kafka-node");
const { Kafka } = require("kafkajs");
const app = express();
const sequelize = require("sequelize");
app.use(express.json());


const kafka = new Kafka({
    clientId: 'my-app',
    brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS, 'localhost:9093', 'localhost:9094']
});
const producer = kafka.producer();

const dbsAreRunning = () => {
    const db = new sequelize(`${process.env.POSTGRES_URL}`);
    const User = db.define('user', {
        name: sequelize.STRING,
        email: sequelize.STRING,
        password: sequelize.STRING,
    })
    db.sync({ force: true });

    producer.connect();
    // producer.on('ready', () => {
    //     console.log("Producer ready");

    // });
    app.post("/", (req, res) => {
        producer.send({ topic: process.env.KAFKA_TOPIC, messages: [{ value: JSON.stringify(req.body) }] }, async (err, data) => {
            if (err) {
                console.log(err);
                throw err;
            }
            await User.create(req.body);
            res.status(200).json({ data: req.body, message: "Created new user successfully!" })
        });
    });
}
setTimeout(dbsAreRunning, 10000);
app.listen(process.env.PORT);