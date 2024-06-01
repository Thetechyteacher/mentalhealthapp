require('dotenv').config() // you will need the dotenv
const express = require('express')// we will need express
const app = express()// wherever I say app means express
const serverless = require('serverless-http');
const MongoClient = require('mongodb').MongoClient // we will need mongo too
const ACCESS_ROLE_ARN = process.env.MONGODB_ACCESS_ROLE_ARN
// const CLUSTER_NAME = process.env.MONGODB_CLUSTER_NAME 
const PORT = process.env.PORT || 2121;

let db,
    dbConnectionStr = process.env.DB_STRING, // get the dbconnectionStr from the .env folder
    dbName = 'Cluster0'// name of the collection we will be using

MongoClient.connect(dbConnectionStr, { useUnifiedTopology: true }) // using the parameters in .env, connect to my mongo DB
    .then(client => {
        console.log(`Connected to ${dbName} Database`)// let me know you are connected
        db = client.db(dbName)
        
        // Define routes after db is initialized
        app.get('/', async (req, res) => {
            try {
                const todoItems = await db.collection('psicohelp').find().toArray();
                const itemsLeft = await db.collection('psicohelp').countDocuments({ completed: false });
                res.render('index.ejs', { items: todoItems, left: itemsLeft });
            } catch (error) {
                console.error(error);
                res.status(500).send("Internal Server Error");
            }
        });

        app.post('/addTodo', async (req, res) => {
            try {
                await db.collection('psicohelp').insertOne({ thing: req.body.todoItem, completed: false });
                console.log('Todo Added');
                res.redirect('/');
            } catch (error) {
                console.error(error);
                res.status(500).send("Internal Server Error");
            }
        });

        app.put('/markComplete', async (req, res) => {
            try {
                await db.collection('psicohelp').updateOne({ thing: req.body.itemFromJS }, {
                    $set: { completed: true }
                });
                console.log('Marked Complete');
                res.json('Marked Complete');
            } catch (error) {
                console.error(error);
                res.status(500).send("Internal Server Error");
            }
        });

        app.put('/markUnComplete', async (req, res) => {
            try {
                await db.collection('psicohelp').updateOne({ thing: req.body.itemFromJS }, {
                    $set: { completed: false }
                });
                console.log('Marked Uncomplete');
                res.json('Marked Uncomplete');
            } catch (error) {
                console.error(error);
                res.status(500).send("Internal Server Error");
            }
        });

        app.delete('/deleteItem', async (req, res) => {
            try {
                await db.collection('psicohelp').deleteOne({ thing: req.body.itemFromJS });
                console.log('Todo Deleted');
                res.json('Todo Deleted');
            } catch (error) {
                console.error(error);
                res.status(500).send("Internal Server Error");
            }
        });
    })
    .catch(error => console.error(error));

app.set('view engine', 'ejs'); // we will be using an ejs template
app.use(express.static('public')); // we will leave static files here so we dont need to hardcode a route for them
app.use(express.urlencoded({ extended: true })); // this replaces bodyparser
app.use(express.json()); // replaces bodyparser

if (process.env.NODE_ENV !== 'lambda') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports.handler = serverless(app);

