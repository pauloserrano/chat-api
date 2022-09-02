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
    return false
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
        res.status(200).send(participants)

    } catch (err){
        res.sendStatus(500)
    }
})


app.post('/participants', async (req, res) => {
    const { name } = req.body
    const lastStatus = Date.now()
    const time = dayjs().format('HH:mm:ss')

    const nameValidation = participantSchema.validate({ name })
    if (nameValidation.error){
        res.status(422).send(nameValidation.error.details)
        return
    
    } if (await isUnavailable(name)){
        res.sendStatus(409)
        return
    }

    try {
        const participant = await db.collection('participants').insertOne({ name, lastStatus })
        await db.collection('messages').insertOne({ from: 'xxx', to: 'Todos', text: 'entra na sala...', type: 'status', time })
        res.status(201).send(participant)
    
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
    const { user } = req.headers

    try {
        let messages = await db.collection('messages').find().toArray()
        
        if (limit){
            messages = messages.slice(0, limit)
        }

        res.status(200).send(messages.filter(({ to, type }) => (type !== 'private_message' || to === user)))

    } catch (err) {
        res.status(500).send(err)
    }
})


app.post('/messages', async (req, res) => {
    const { to, text, type } = req.body
    const { user: from } = req.headers
    const time = dayjs().format('HH:mm:ss')

    const messageValidation = messageSchema.validate({ to, text, type })
    if (messageValidation.error) {
        res.status(422).send(messageValidation.error.details)
        return
    
    } if (await isInactive(from)){
        res.status(422).send('User is not active')
        return
    }
    try {
        const message = await db.collection('messages').insertOne({ from, to, text, type, time })
        res.status(201).send(message)

    } catch (err) {
        res.status(500).send(err)
    }
})


app.post('/status', (req, res) => {
    const { user } = req.headers

    if (isInactive(user)){
        res.sendStatus(404)
        return
    }

    res.status(200).send({ name: User, lastStatus: Date.now() })
})


app.listen(PORT, () => console.log(`Running on port ${PORT}`))
