const express = require("express");
const kafka = require("kafka-node");
const app = express();
const mongoose = require("mongoose");

const dbsAreRunning = () => {
    mongoose.connect(process.env.MONGO_URL);
    const User = mongoose.model('user', {
        name: String,
        email: String,
        password: String
    },)
    app.use(express.json());

    const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_BOOTSTRAP_SERVERS });
    const consumer = new kafka.Consumer(client,[{topic:process.env.KAFKA_TOPIC}],{
        autoCommit: false
    });
    consumer.on("message", async(data)=>{
       const newUser =  await new User.create(JSON.parse(data.value));
       await newUser.save();
    })

    consumer.on('error', (err) => {
        console.log(err);
    });
}
setTimeout(dbsAreRunning, 10000);
app.listen(process.env.PORT);