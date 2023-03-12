const express = require("express");
const kafka = require("kafka-node");
const app = express();
const mongoose = require("mongoose");
app.use(express.json());
const connectDB = require("./configs/db.config");

const dbsAreRunning = () => {
    connectDB();
    const User = new mongoose.model('user', {
        name: String,
        email: String,
        password: String
    },)

    const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_BOOTSTRAP_SERVERS });
    const consumer = new kafka.Consumer(client, [{ topic: process.env.KAFKA_TOPIC }], {
        autoCommit: false
    });
    consumer.on("message", async (data) => {
        const newUser = await new User(JSON.parse(data.value));
        await newUser.save();
    })

    consumer.on('error', (err) => {
        console.log(err);
    });
}
setTimeout(dbsAreRunning, 10000);
app.listen(process.env.PORT);