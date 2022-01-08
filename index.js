const express = require('express');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const ObjectId = require('mongodb').ObjectId;
var cors = require('cors');
const res = require('express/lib/response');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');
const fs = require('fs-extra');

const app = express();

DB_USER = process.env.DB_USER;
DB_PASS = process.env.DB_PASS;
DB_NAME = process.env.DB_NAME;

const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@cluster0.vlgfh.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.static('doctors'));
app.use(fileUpload());

// Morgan Token
morgan.token("person", (request, response) => {
    if (request.method === "POST") {
        return JSON.stringify(request.body)
    } else {
        return null
    }
})

app.use(
    morgan(
        ":method :url :status :res[content-length] - :response-time ms :person"
    )
)


client.connect(err => {
    const appointmentCollection = client.db(DB_NAME).collection("appointments");
    const doctorsCollection = client.db(DB_NAME).collection("doctors");

    // perform actions on the collection object
    console.log("DB Connected");

    app.get('/', (req, res) => {
        res.send("<h1>Welcome!!</h1>");
    })

    app.post('/addAppointment', (req, res) => {
        const appointment = req.body;
        appointmentCollection.insertOne(appointment)
            .then(result => {
                res.send(result.acknowledged);
            })
    })

    app.get('/appointments', (req, res) => {
        appointmentCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })



    app.post('/appointmentsByDate', (req, res) => {
        const date = req.body;
        const email = req.body.email
        doctorsCollection.find({ email: email })
            .toArray((err, doctors) => {
                const filter = { date: date.date };
                if (doctors.length === 0) {
                    filter.email = email;
                }
                appointmentCollection.find(filter)
                    .toArray((err, documents) => {
                        res.send(documents)
                    })
            })
    })

    app.post('/addDoctor', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const email = req.body.email;
        const phone = req.body.phone

        const newImg = file.data;
        const encImg = newImg.toString('base64');

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        const doctor = {
            name: name,
            email: email,
            phone: phone,
            image: image
        }

        doctorsCollection.insertOne(doctor)
            .then(result => {
                res.send(result.acknowledged);

            })
    })

    app.get('/doctors', (req, res) => {
        doctorsCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })


    app.post('/isDoctor', (req, res) => {
        const email = req.body.email
        doctorsCollection.find({ email: email })
            .toArray((err, doctors) => {
                res.send(doctors.length > 0);

            })
    })
})


const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
