const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 1212;
// console.log(process.env);

// middleware
app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.8l6zy8s.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get('/', (req, res) => {
    res.send('KrishiLink server is running')
});

async function run() {
    try {
        await client.connect();

        const db = client.db('krishilink_db');
        const allCropsCollection = db.collection('allCrops');
        const newsCollection = db.collection('news&blog');

        //add crops
        app.post('/crop', async (req, res) => {
            const newCrops = req.body;
            const result = await allCropsCollection.insertOne(newCrops);
            console.log('New crops add', newCrops);
            res.send(result);
        });

        app.get('/crop', async (req, res) => {
            const cursor = allCropsCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        });


        //Single crops
        app.get('/crop/:id', async (req, res) => {
            const id = req.params.id;
            // console.log("Id is: ", id)
            let result;
            result = await allCropsCollection.findOne({ _id: new ObjectId(id) });

            if (!result) {
                result = await allCropsCollection.findOne({ _id: id });
            }
            // console.log(result);
            res.send(result);
        })

        //my post api
        app.get('/myPost', async (req, res) => {
            const email = req.query.email;
            console.log('email is: ', email);
            if (!email) {
                return res.status(400).send({ error: 'Email query parameter required' });
            }
            const query = { "owner.ownerEmail": email };
            const result = await allCropsCollection.find(query).toArray();
            console.log(result);
            res.send(result);
        });

        //latest
        app.get('/latest', async (req, res) => {
            const cursor = allCropsCollection.find().sort({ cropsAddedTime: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result)
        });

        //news
        app.post('/news', async (req, res) => {
            const news = req.body;
            const result = await newsCollection.insertOne(news);
            console.log('New crops add', news);
            res.send(result);
        });
        app.get('/news', async (req, res) => {
            const cursor = newsCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        });


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally {
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`KrishiLink server is running on port: ${port}`)
});
