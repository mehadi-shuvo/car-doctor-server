const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ih5yxul.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const serviceCollections = client.db('carDoctor').collection('services');
const bookingCollections = client.db('carDoctor').collection('bookings');


const verifyJWT =(req, res, next)=>{
  console.log('verify jwt');
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error: true, message: 'unauthorized access'});
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded)=>{
    if(error){
      return res.status(403).send({error:true, message: 'unauthorized access'});
    }
    req.decoded = decoded;
    next();
  })
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    

    //JWT
    app.post('/jwt', (req,res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN , { expiresIn: '1h' })
      res.send({token})
    })


    app.get('/services', async (req, res) => {
      const cursor = serviceCollections.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await serviceCollections.findOne(query);
      res.send(result);
    })


    app.get('/booking', verifyJWT, async (req, res) => {
      const decoded = req.decoded
      if(decoded.email !== req.query.email){
        return res.status(403).send({error:1, message: 'forbidden access'})
      }
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await bookingCollections.find(query).toArray();
      res.send(result)
    })

    app.post('/booking', async (req, res) => {
      const newBooking = req.body;
      const result = await bookingCollections.insertOne(newBooking);
      res.send(result);

    })

    app.patch('/booking/:id', async (req, res) => {
      const id = req.params.id;
      const updateBooking = req.body.status;
      console.log(updateBooking);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: `confirm`
        },
      };
      const result = await bookingCollections.updateOne(filter, updateDoc);
      res.send(result)
    })

    app.delete('/booking/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await bookingCollections.deleteOne(query)
      res.send(result)
    })


    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('doctor is running..........');
})

app.listen(port, () => {
  console.log(`Car-Doctor is running on ${port}`);
})