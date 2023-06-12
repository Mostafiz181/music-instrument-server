const express = require('express');
const app = express();
const cors= require('cors');
const jwt = require("jsonwebtoken");
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;



// middleware

app.use(cors());
app.use(express.json());

const verifyJwt = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "Unauthorized Access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "Unauthorized Access" });
    }
    req.decoded = decoded;
    next();
  });
};




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8w6slpa.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const classCollection=client.db('musicDB').collection('classes')
    const userCollection = client.db("musicDB").collection("users");

    // instructors related api

    // app.get("/instructors", async(req,res)=>{
    //     const result=await instructorsCollection.find().toArray();
    //     res.send(result)

    // })



    app.get("/users", verifyJwt, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role === "admin") {
        res.send({ admin: true });
      } else {
        res.send({ admin: false });
      }
    });
    app.get("/users/instructor/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role === "instructor") {
        res.send({ instructor: true });
      } else {
        res.send({ instructor: false });
      }
    });

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const query = { email: user.email };
      const existUser = await userCollection.findOne(query);
      console.log(existUser);
      if (existUser) {
        return res.send({ massage: "user is exist" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });




    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "instructor",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });


    // add a class related api

    app.get("/classes", async(req,res)=>{
      const result = await classCollection.find().toArray();
      res.send(result)
    })

    app.post('/classes', verifyJwt, async (req, res) => {
      const classes = req.body;
      const result = await classCollection.insertOne(classes);
      res.send(result);




      // my class related api
      app.get('/myClass', verifyJwt, async (req, res) => {
        try {
            const email = req.query.email;
            const query = { instructorEmail: email };
            const user = await classCollection.find(query).toArray();
            res.send(user);
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }


      //   app.patch('/classes', async (req, res) => {
      //     const id = req.query.id;
      //     const filter = { _id: new ObjectId(id) };
      //     const status = req.query.status;
      //     let updatedDoc = {};
      //     if (status === 'approved') {
      //         updatedDoc = {
      //             $set: {
      //                 status: 'approved'
      //             }
      //         }
      //     }

      //     const result = await classCollection.updateOne(filter, updatedDoc);
      //     res.send(result);
      // })

      app.patch("/classes/:id", async(req,res)=>{
        const id=req.query.id;
        const filter= {_id: new ObjectId(id)}
        
        const updatedDoc={
          $set:{
            status:"approved"
          }
        }

        const result = await classCollection.updateOne(filter, updatedDoc);
           res.send(result);

        
      })

    });



  })
    

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req,res)=>{
    res.send('music is singing')
});

app.listen(port, ()=>{
    console.log(`music hunt is running on port ${port}`);
})