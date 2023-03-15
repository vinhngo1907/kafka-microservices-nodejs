const express = require("express");
// const kafka = require("kafka-node");
const { Kafka } = require("kafkajs");

const connectDB = require("./configs/db.config");
const User = require("./models/User");

const dbsAreRunning = async () => {
    connectDB();

    const kafka = new Kafka({
        clientId: 'my-app',
        brokers: [`${process.env.KAFKA_BOOTSTRAP_SERVERS}`, 'localhost:9093', 'localhost:9094']
    });

    const consumer = kafka.consumer({ groupId: 'test-group' });

    // Consuming
    await consumer.connect();
    await consumer.subscribe({ topic: `${process.env.KAFKA_TOPIC}`, fromBeginning: true });

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
// setTimeout(dbsAreRunning, 10000);

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
app.listen(process.env.PORT, () => {
    console.log(`Server 2 started on por ${process.env.PORT}`);
    dbsAreRunning();
});