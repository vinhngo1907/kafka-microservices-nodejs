const express = require("express");
// const kafka = require("kafka-node");
const { Kafka } = require("kafkajs");
const app = express();
const mongoose = require("mongoose");
app.use(express.json());
const connectDB = require("./configs/db.config");

const dbsAreRunning = async () => {
    connectDB();
    const User = new mongoose.model('user', {
        name: String,
        email: String,
        password: String
    });

    const kafka = new Kafka({
        clientId: 'my-app',
        brokers: [`${process.env.KAFKA_BOOTSTRAP_SERVERS}`, 'localhost:9093', 'localhost:9094']
    });

    const consumer = kafka.consumer({ groupId: 'test-group' });

    // Consuming
    await consumer.connect();
    await consumer.subscribe({ topic: `${process.env.KAFKA_TOPIC}`, fromBeginning: true });

    // const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_BOOTSTRAP_SERVERS });
    // const consumer = new kafka.Consumer(client, [{ topic: process.env.KAFKA_TOPIC }], {
    //     autoCommit: false
    // });
    // consumer.on("message", async (data) => {
    //     const newUser = await new User(JSON.parse(data.value));
    //     await newUser.save();
    // })

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

    consumer.on('error', (err) => {
        console.log(">>>>>>>>>>>>>>>", err);
    });
}
setTimeout(dbsAreRunning, 10000);
app.listen(process.env.PORT);