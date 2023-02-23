const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const amqp = require('amqplib');
const multer = require('multer');
const upload = multer();
const router = express.Router();
const AppService = require('./service');
const { Pool } = require('pg');
app.use(cors());

const appService = new AppService();
require('dotenv').config();
const config = [{
    queue: 'jobsstatus',
    exchange: 'amq.direct',
    routingKey: 'orchestration.jobs.status'
},
{
    queue: 'jobsfinished',
    exchange: 'amq.direct',
    routingKey: 'orchestration.jobs.finished'
},
{
    queue: 'allocatednodes',
    exchange: 'amq.topic',
    routingKey: 'orchestration.currentallocatednodes'
}]
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

let conn=null;
async function connectToRabbitMQ() {
    conn = await amqp.connect(process.env.BUS)
    for (let i = 0; i < config.length; i++) {
        const channel = await conn.createChannel();
        await channel.assertQueue(config[i].queue, { durable: true });
        await channel.bindQueue(config[i].queue, config[i].exchange, config[i].routingKey);
        //consume
        await channel.consume(config[i].queue, (msg) => {
            io.emit(config[i].queue, msg.content.toString());
        });
    }
}

io.on('connection', (socket) => {
    console.log('a user connected');
});

router.post('/upload/:id', upload.any(), async (req, res, next) => {
    const id = req.params.id;
    const body = req.body;
    const files = req.files;

    if (!files || files.length < 1) {
        console.error('no files provided');
        return res.status(400).send('no files provided');
    }

    const bucketName = await appService.uploadTaskFiles(id, files);

    const jobRequestPayload = {
        job_id: id,
        pictures_obj_key: bucketName,
        politic: {
            quality: body.quality,
            energy: body.energy,
        },
    };

    console.log(`Start job ${id} with ${files.length} files`);

    const channel = await conn.createChannel();
    await channel.assertExchange('amq.direct', 'direct', { durable: true });
    await channel.assertQueue('jobsrequests', {
      durable: true,
      arguments: {
        'x-expires': 86400000, // expire the queue after 24 hours
      },
    });
    await channel.bindQueue('jobsrequests', 'amq.direct', 'routingKey');
    await channel.publish('amq.direct', 'routingKey', Buffer.from(JSON.stringify(jobRequestPayload)));

    
    res.status(200).send();
});
router.get('/results', async (req, res, next) => {
    const results = [];

    try {
        const response = await pool.query('SELECT * FROM results');
        for (const row of response.rows) {
            results.push(row);
        }
    } catch (e) {
        console.error(`the request failed with the following exception:\n ${e}`);
        return res.status(500).send('Internal Server Error');
    }

    res.json(results);
});

router.get('/results/:id', async (req, res, next) => {
    const id = req.params.id;

    try {
        const datas = await appService.getTaskFiles(id);
        res.json(datas);
    } catch (e) {
        console.error(`the request failed with the following exception:\n ${e}`);
        return res.status(500).send('Internal Server Error');
    }
});

app.use('/api', router);

server.listen(4000, async () => {
    await connectToRabbitMQ();
    console.log('listening on *:4000');
});