const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5002;

// middlewares

app.use(cors());

app.use(express.json());

// Mongo DB Connection

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@mongodbcloud.ja2jrii.mongodb.net/?retryWrites=true&w=majority`;

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
        await client.connect();

        const database = client.db("carDoctor");
        const serviceCollection = database.collection("services");
        const productCollection = database.collection("products");
        const bookingCollection = database.collection("bookings");
        const userCollection = database.collection("users");
        // const productCartCollection = database.collection("cartProducts");

        // Product related APIs

        // GET API for all services 
        app.get('/services', async (req, res) => {
            const cursor = serviceCollection.find()
            const result = await cursor.toArray()
            console.log(result);
            res.send(result);
        })

        // GET API for single service
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const options = {
                projection: { title: 1, price: 1, service_id: 1 },
            }
            const result = await serviceCollection.findOne(query, options);
            console.log(result);
            res.send(result);
        })

        // // GET API for selected brand products
        // app.get('/products-by-brand/:bname', async (req, res) => {
        //     const bname = req.params.bname;
        //     console.log('Brand Name:', bname);
        //     const query = { bname: bname };
        //     const selectedBrandProducts = productCollection.find(query);
        //     const result = await selectedBrandProducts.toArray()
        //     res.send(result);
        // });


        // POST API for add product
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            try {
                const result = await bookingCollection.insertOne(booking);
                res.json({ message: "Booking added successfully", result });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "An error occurred while adding the booking." });
            }
        });

        // POST API for add user
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            try {
                const result = await userCollection.insertOne(user);
                res.json({ message: "User added successfully", result });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "An error occurred while adding the user." });
            }
        });

        // PUT API for update product
        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            console.log('Client requested to update product with ID:', id);
            const product = req.body;
            console.log(id, product);
            const filter = { _id: new ObjectId(id) };
            const updatedProduct = {
                $set: {
                    pname: product.pname,
                    bname: product.bname,
                    selectedType: product.selectedType,
                    price: product.price,
                    image: product.image,
                    des: product.des,
                    rating: product.rating,
                }
            }
            const options = { upsert: true };
            const result = await productCollection.updateOne(filter, updatedProduct, options);
            res.json({ message: 'User updated successfully' });
        })

        // Product Cart Related APIs

        // API to add a product to the cart
        app.post('/add-to-cart', async (req, res) => {
            const { product, userEmail } = req.body;
            const existingProduct = await productCartCollection.findOne({
                product: product,
                userEmail: userEmail,
            });

            if (existingProduct) {
                return res.json({ message: "Product already in the cart" });
            } else {
                const result = await productCartCollection.insertOne({ product, userEmail });
                return res.json({ message: "Product added to cart successfully", result });
            }
        });


        // API to get the user's cart
        app.get('/get-cart/:userEmail', async (req, res) => {
            const userEmail = req.params.userEmail;
            const cursor = productCartCollection.find({ userEmail: userEmail });
            const result = await cursor.toArray()
            res.send(result);
        });

        // API to remove a product from the cart
        app.delete('/delete-cart-item/:itemId', async (req, res) => {
            const itemId = req.params.itemId;
            console.log(itemId)

            // Use ObjectId to create a filter based on the provided itemId
            const filter = { _id: new ObjectId(itemId) };

            // Remove the item from the cart based on the filter
            const result = await productCartCollection.deleteOne(filter);

            if (result.deletedCount === 1) {
                res.json({ message: "Item deleted successfully" });
            } else {
                res.status(404).json({ message: "Item not found or unable to delete" });
            }
        });

        // User Management related apis

        // GET API for all users
        app.get('/users', async (req, res) => {
            const cursor = userCollection.find()
            const result = await cursor.toArray()
            console.log(result);
            res.send(result);
        });

        // GET API for single User
        app.get('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const user = await userCollection.findOne(query);
            res.send(user);
        })

        // POST API
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            try {
                const result = await userCollection.insertOne(user);
                res.json({ message: "User added successfully", result });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "An error occurred while adding the user." });
            }
        });


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged!!! You are successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.log);



app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
})

app.listen(port, () => console.log(`Car Doctor CRUD Backend server running on port ${port}!`));