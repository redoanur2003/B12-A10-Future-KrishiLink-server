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
            // console.log('New crops add', newCrops);
            res.send(result);
        });

        app.get('/crop', async (req, res) => {
            const cursor = allCropsCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        });

        //update
        app.patch('/crop/:id', async (req, res) => {
            const id = req.params.id;
            const updatedCrop = req.body;

            // console.log("Incoming ID:", id);
            // console.log("ObjectId.isValid:", ObjectId.isValid(id));
            // console.log("UpdatedCrop:", updatedCrop);

            const update = {
                $set: {
                    name: updatedCrop.cropName,
                    type: updatedCrop.cropType,
                    pricePerUnit: updatedCrop.price,
                    unit: updatedCrop.unit,
                    quantity: updatedCrop.quantitys,
                    location: updatedCrop.locations,
                    description: updatedCrop.descriptions,
                    image: updatedCrop.images
                }
            }

            let result;
            if (ObjectId.isValid(id)) {
                result = await allCropsCollection.updateOne({ _id: new ObjectId(id) }, update);
                if (result.matchedCount === 0) {
                    result = await allCropsCollection.updateOne({ _id: id }, update);
                }
            } else {
                result = await allCropsCollection.updateOne({ _id: id }, update);

            }

            // console.log("result is: ", result)
            res.send(result)
        })


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

        //add interest

        app.patch('/crop/interest/:id', async (req, res) => {
            const id = req.params.id;
            const interestData = req.body;
            const interestId = new ObjectId();

            // console.log("Id is: ", id)
            // console.log("interstid is: ", interestId)
            // console.log("intertst is: ", interestData)

            const newInterest = { _id: interestId, interestData };

            const update = {
                $push: {
                    interests: newInterest
                }
            };

            let result;
            if (ObjectId.isValid(id)) {
                result = await allCropsCollection.updateOne({ _id: new ObjectId(id) }, update);
                if (result.matchedCount === 0) {
                    result = await allCropsCollection.updateOne({ _id: id }, update);
                }
            } else {
                result = await allCropsCollection.updateOne({ _id: id }, update);

            }
            res.send(result);
        });

        //crop delete 
        app.delete('/crop/:id', async (req, res) => {
            const id = req.params.id;
            let result;
            if (ObjectId.isValid(id)) {
                result = await allCropsCollection.deleteOne({ _id: new ObjectId(id) });
                if (result.deletedCount === 0) {
                    result = await allCropsCollection.deleteOne({ _id: id });
                }
            } else {
                result = await allCropsCollection.deleteOne({ _id: id });

            }

            // console.log("result is: ", result)
            res.send(result)
        })

        //my post api
        app.get('/myPost', async (req, res) => {
            const email = req.query.email;
            // console.log('email is: ', email);
            if (!email) {
                return res.status(400).send({ error: 'Email query parameter required' });
            }
            const query = { "owner.ownerEmail": email };
            const result = await allCropsCollection.find(query).toArray();
            // console.log(result);
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
            // console.log('New crops add', news);
            res.send(result);
        });
        app.get('/news', async (req, res) => {
            const cursor = newsCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        });

        //status update 
        app.patch('/updateInterest', async (req, res) => {

            const { interestId, cropsId, status } = req.body;

            console.log(`interestId: ${interestId} crop: ${cropsId} state: ${status}`);

            if (!interestId || !cropsId || !status) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            let crop = null;
            if (ObjectId.isValid(cropsId)) {
                crop = await allCropsCollection.findOne({ _id: new ObjectId(cropsId) });
                if (!crop) {
                    crop = await allCropsCollection.findOne({ _id: cropsId });
                }
            } else {
                crop = await allCropsCollection.findOne({ _id: cropsId });
            }

            if (!crop) return res.status(404).json({ message: "Crop not found" });

            const interestIndex = crop.interests.findIndex(i => i._id.toString() === interestId);
            if (interestIndex === -1) return res.status(404).json({ message: "Interest not found" });

            crop.interests[interestIndex].interestData.status = status;

            if (status === 'accept') {
                const requestedQty = Number(crop.interests[interestIndex].interestData.quantity);
                crop.quantity = Number(crop.quantity) - requestedQty;
            }

            const update = { $set: { interests: crop.interests, quantity: crop.quantity } };
            console.log("Update data is: ", update);

            let result;
            if (ObjectId.isValid(cropsId)) {
                result = await allCropsCollection.updateOne({ _id: new ObjectId(cropsId) }, update);
                if (result.matchedCount === 0) {
                    result = await allCropsCollection.updateOne({ _id: cropsId }, update);
                }
            } else {
                result = await allCropsCollection.updateOne({ _id: cropsId }, update);
            }

            console.log("result is: ", result);

            res.send(result);
        });


        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally {
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`KrishiLink server is running on port: ${port}`)
});
