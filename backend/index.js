const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
// mongodb connection

// virfy token
const virifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: 'Invalid authorization' });
  }
  const token = authorization?.split(' ')[1];
  jwt.verify(token, process.env.ASSESS_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' });
    }
    req.decoded = decoded;
    next();
  });
};

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@immigration-service.g4jporh.mongodb.net/?appName=immigration-service`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // create a database and collections
    const database = client.db('immigration-service');
    const usersCollection = database.collection('users');
    const classesCollection = database.collection('classes');
    const cartCollection = database.collection('cart');
    const paymentCollection = database.collection('payments');
    const enrolledCollection = database.collection('enrolled');
    const appliedCollection = database.collection('applied');

    //routes for users

    app.post('/api/set-token', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ASSESS_SECRET, {
        expiresIn: '24h',
      });
      res.send({ token });
    });

    //middleware for admin and instructor
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user.role === 'admin') {
        next();
      } else {
        return res.status(401).send({ message: 'Unauthorized access' });
      }
    };

    const verifyInstructor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user.role === 'instructor') {
        next();
      } else {
        return res.status(401).send({ message: 'Unauthorized access' });
      }
    };

    app.post('/new-user', async (req, res) => {
      const newUser = req.body;
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    app.get('/user/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    app.delete('/delete-user/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    app.put('/update-user/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const updatedUser = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.option,
          address: updatedUser.address,
          about: updatedUser.about,
          photoUrl: updatedUser.photoUrl,
          skills: updatedUser.skills ? updatedUser.skills : null,
        },
      };

      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // classes routes here
    app.post('/new-class', verifyJWT, verifyInstructor, async (req, res) => {
      const newClass = req.body;
      // newClass.availableSeats = parseInt(newClass.availableSeats);
      const result = await classesCollection.insertOne(newClass);
      res.send(result);
    });

    app.get('/classes', async (req, res) => {
      const query = { status: 'approved' };
      const result = await classesCollection.find().toArray();
      res.send(result);
    });

    // get classes by instructor email address
    app.get(
      '/classes/:email',
      verifyJWT,
      verifyInstructor,
      async (req, res) => {
        const email = req.params.email;
        const query = { instructorEmail: email };
        const result = await classesCollection.find(query).toArray();
        res.send(result);
      }
    );

    // manage classes
    app.get('/classes-manage', async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });

    //update classes statust and reason
    app.patch(
      '/change-status/:id',
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const status = req.body.status;
        const reason = req.body.reason;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            status: status,
            reason: reason,
          },
        };
        const result = await classesCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.send(result);
      }
    );

    //get approved classes
    app.get('/approved-classes', async (req, res) => {
      const query = { status: 'approved' };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    });

    // get single class details
    app.get('/class/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classesCollection.findOne(query);
      res.send(result);
    });

    // update class details (all data)
    app.put(
      '/update-class/:id',
      verifyJWT,
      verifyInstructor,
      async (req, res) => {
        const id = req.params.id;
        const updateClass = req.body;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            name: updateClass.name,
            description: updateClass.description,
            price: updateClass.price,
            availableSeats: parseInt(updateClass.availableSeats),
            videoLink: updateClass.videoLink,
            status: 'pending',
          },
        };
        const result = await classesCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.send(result);
      }
    );

    // Cart Routes
    app.post('/add-to-cart', verifyJWT, async (req, res) => {
      const newCartItem = req.body;
      const result = await cartCollection.insertOne(newCartItem);
      res.send(result);
    });

    //get Cart item by id
    app.get('/cart-item/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const email = req.body.email;
      const query = {
        classId: id,
        userMail: email,
      };
      const projection = { classId: 1 };
      const result = await cartCollection.findOne(query, {
        projection: projection,
      });
      res.send(result);
    });

    // cart info by user email
    app.get('/cart/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { userMail: email };
      const projection = { classId: 1 };
      const carts = await cartCollection.find(query, {
        projection: projection,
      });
      const classIds = carts.map((cart) => new ObjectId(cart.classId));
      const query2 = { _id: { $in: classIds } };
      const result = await classesCollection.find(query2).toArray();
      res.send(result);
    });

    // delete cart item
    app.delete('/delete-cart-item/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { classId: id };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    //Payment Routes

    //Enrollment Routes
    app.get('/popular_classes', async (req, req) => {
      const result = await classesCollection
        .find()
        .sort({ totalEnrolled: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.get('/popular-instructors', async (req, res) => {
      const pipeline = [
        {
          $group: {
            _id: '$instructorEmail',
            totalEnrolled: { $sum: '$totalEnrolled' },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'email',
            as: 'instructor',
          },
        },
        {
          $match: {
            'instructor.role': 'instructor',
          },
        },

        {
          $project: {
            _id: 0,
            instructor: {
              $arrayElemAt: ['$insructor', 0],
            },
            totalEntrolled: 1,
          },
        },
        {
          $sort: {
            totalEnrolled: -1,
          },
        },
        {
          $limit: 6,
        },
      ];
      const result = await classesCollection.aggregate(pipeline).toArray();
      res.send(result);
    });

    //admin status
    app.get('/admin-stats', virifyJWT, verifyAdmin, async (req, res) => {
      const approvedClases = (
        await classesCollection
          .find({
            status: 'approved',
          })
          .toArray()
      ).length;

      const pendingClases = (
        await classesCollection.find({ status: 'pending' })
      ).toArray().length;

      const instructors = (
        await usersCollection.find({ role: 'instructor' })
      ).toArray().length;

      const totalClases = (await classesCollection.find().toArray()).length;
      const totalEnrolled = (await enrolledCollection.find().toArray()).length;

      const result = {
        approvedClases,
        pendingClases,
        instructors,
        totalClases,
        totalEnrolled,
      };

      res.send(result);
    });

    // Get all Instructor
    app.get('/instructors', async (req, res) => {
      const result = await usersCollection
        .find({ role: 'instructor' })
        .toArray();
      res.send(result);
    });

    app.get('/enrolled-classes/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { userEail: email };
      const pipeline = [
        {
          $match: query,
        },
        {
          $lookup: {
            from: 'classes',
            localField: 'classesId',
            foreignField: '_id',
            as: 'classes',
          },
        },
        {
          $unwind: '$classes',
        },
        {
          $lookup: {
            from: 'users',
            localField: 'classes.instructorEmail',
            foreignField: 'email',
            as: 'instructor',
          },
        },
        {
          $project: {
            _id: 0,
            instructor: {
              $arrayElemAt: ['$instructor', 0],
            },
            classes: 1,
          },
        },
      ];

      const result = await enrolledCollection.aggregate(pipeline).toArray();
      res.send(result);
    });

    // appliend for instructors
    app.post('/ass-instructor', async (req, res) => {
      const data = req.body;
      const result = await appliedCollection.insertOne(data);
      res.send(result);
    });

    app.get('/applied-instructors/:email', async (req, res) => {
      const email = req.params.email;
      const result = await appliedCollection.findOne({ email });
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connect to MongoDB!');
  } finally {
    //Ensures that the client will close when finish/error
    //await client.close()
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}1`);
});
