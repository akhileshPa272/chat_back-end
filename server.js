//importing all the modules
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

//app config
const app = express();
const port = process.env.port || 9000;


const pusher = new Pusher({
    appId: "1207206",
    key: "27a8d3a3a084a4331510",
    secret: "652c248eb63fc42d9a04",
    cluster: "mt1",
    useTLS: true
  });
//middlewares
app.use(express.json())
app.use(cors());
//DB config
mongoose.connect('mongodb+srv://admin:hLO6ULQW9KcYpD0A@cluster0.jy0go.mongodb.net/whatsappdb?retryWrites=true&w=majority', {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})


const db = mongoose.connection
db.once('open', ()=>{
    console.log("DB connected");

    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();
    changeStream.on('change', (change) => {
        console.log(change);

        if(change.operationType == 'insert')
        {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', 
            {
                user: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            }
            );
        }
        else{
            console.log("Error triggering Pusher")
        }
    });
});

// ?? 


//api routes
app.get('/', (req,res) => {
    res.status(200).send("Hello world")
})

app.post('/messages/new', (req,res)=> {
    const dbMessage = req.body

    Messages.create(dbMessage, (err,data) => {
        if(err){
            res.status(500).send(err)
        }
        else
        {
            res.status(201).send(data);
        }
    })
})


app.get('/messages/sync', (req,res) => {
    Messages.find((err,data) => {
        if(err){
            res.status(500).send(err)
        }
        else
        {
            res.status(200).send(data);
        }
    })
})

//listener
app.listen(port, () => console.log(`Listen on localhost:${port}`));