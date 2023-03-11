const express = require("express");
const kafka = require("kafka-node");
const app = express();
const sequelize = require("sequelize");
app.use(express.json());

const dbsAreRunning = () => {
    const db = new sequelize(process.emit.POSTGRE_URL);
    const User = db.define('user', {
        name: sequelize.STRING,
        email: sequelize.STRING,
        password: sequelize.STRING,
    })
    db.sync({force: true});

    const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_BOOTSTRAP_SERVERS });
    const producer = new kafka.Producer(client);

    producer.on('ready', () => {
        console.log("Producer ready");
        app.post("/", (req, res) => {
            producer.send([{ topic: process.env.KAFKA_TOPIC, messages: JSON.stringify(req.body) }], async (err, data) => {
                if (err)
                    throw err;
                await User.create(req.body);
                res.send(req.body)
            });
        });
    });
}
setTimeout(dbsAreRunning, 10000);
app.listen(process.env.PORT);