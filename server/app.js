import express from 'express'
import cors from 'cors'
import dayjs from 'dayjs'
import dotenv from 'dotenv'
import { MongoClient, ObjectId } from 'mongodb'
import { participantSchema, messageSchema } from './schemes.js'


const PORT = 5000
const app = express()
app.use(express.json())
app.use(cors())
dotenv.config()


let db
const client = new MongoClient(process.env.MONGO_URI)
client.connect().then(() => {
    db = client.db('chat-api')
    console.log('Connected successfully to database "chat-api"');
})


async function isInactive(name){
    return true
}

async function isUnavailable(name){
    try{
        const match = await db.collection('participants').findOne({ name })
        return match

    } catch (err){
        console.error(err)
        return err
    }
}


app.get('/participants', async (req, res) => {
    try{
        const participants = await db.collection('participants').find().toArray()
        res.send(participants)

    } catch (err){
        res.sendStatus(500)
    }
})


app.post('/participants', async (req, res) => {
    const { name } = req.body
    const nameValidation = participantSchema.validate({ name })
    
    if (nameValidation.error){
        res.sendStatus(422)
        return
    }

    if (await isUnavailable(name)){
        res.sendStatus(409)
        return
    }

    try {
        await db.collection('participants').insertOne({
            name,
            lastStatus: Date.now()
        })
        res.sendStatus(201)
    
    } catch (err){
        res.status(500).send(err)
    }

})


app.delete('/participants/:id', async (req, res) => {
    const { id } = req.params

    try {
        await db.collection('participants').deleteOne({_id: new ObjectId(id)})
        res.sendStatus(200)

    } catch (err){
        res.status(500).send(err)
    }
})


app.get('/messages', async (req, res) => {
    const { limit } = req.query
    const { User: from } = req.headers

    if (limit){

    }

    res.send([])
})


app.post('/messages', (req, res) => {
    const { to, text, type } = req.body
    const { User: from } = req.headers
    const time = dayjs().format('HH:mm:ss')

    if (!to || !text) {
        res.sendStatus(422)
        return
    
    } else if (type !== ('message' || 'private_message')){
        res.sendStatus(422)
        return
    
    } else if (!isActive(from)){
        res.sendStatus(422)
        return
    }

    res.status(201).send({from, to, text, type, time})
})


app.post('/status', (req, res) => {
    const { User } = req.headers

    if (!isActive(User)){
        res.sendStatus(404)
        return
    }

    res.status(200).send({name: User, lastStatus: Date.now()})
})


app.listen(PORT, () => console.log(`Running on port ${PORT}`))
