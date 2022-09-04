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
    db = client.db('chat_api')
    
    setInterval(async () => {
        const collection = db.collection('participants')
        const participants = await collection.find().toArray()

        participants.forEach(({ _id, name, lastStatus }) => {
            if((Date.now() - lastStatus) > 10000){
                // Mensagem de saiu da sala
                db.collection('messages').insertOne({ from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs().format('HH:mm:ss') })

                // Remove do banco
                collection.deleteOne({_id: ObjectId(_id)})
            }
        })
    }, 15000)
})


async function isUnavailable(name){
    try{
        const match = await db.collection('participants').findOne({ name })
        return !!match

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

    const nameValidation = participantSchema.validate({ name }, { abortEarly: false })
    if (nameValidation.error){
        res.status(422).send(nameValidation.error.details)
        return
    
    } if (await isUnavailable(name)){
        res.sendStatus(409)
        return
    }

    try {
        await db.collection('participants').insertOne({ name, lastStatus })
        await db.collection('messages').insertOne({ from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time })
        
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
    const { user } = req.headers
    let { limit } = req.query

    if (!limit) limit = Number.POSITIVE_INFINITY

    try {
        let messages = await db.collection('messages').find().toArray()

        res.status(200).send(messages.slice(-limit).filter(({ to, from, type }) => (type !== 'private_message' || (to || from) === user)))

    } catch (err) {
        res.status(500).send(err)
    }
})


app.post('/messages', async (req, res) => {
    const { to, text, type } = req.body
    const { user: from } = req.headers
    const time = dayjs().format('HH:mm:ss')
    const messageValidation = messageSchema.validate({ to, text, type })

    if (!await isUnavailable(from)){
        res.sendStatus(422)
        return
    
    } if (messageValidation.error) {
        res.status(422).send(messageValidation.error.details)
        return
    }

    try {
        await db.collection('messages').insertOne({ from, to, text, type, time })
        res.sendStatus(201)

    } catch (err) {
        res.status(500).send(err)
    }
})

app.delete('/messages/:id', async (req, res) => {
    const { user } = req.headers
    const { id } = req.params

    try {
        const collection = await db.collection('messages')
        const message = await collection.findOne({_id: ObjectId(id)})

        if (!message){
            res.sendStatus(404)
            return
        
        } else if (message.from !== user){
            res.sendStatus(401)
            return
        }

        await collection.deleteOne({_id: ObjectId(id)})
        res.sendStatus(200)

    } catch (err) {
        res.status(500).send(err)
    }
})


app.post('/status', async (req, res) => {
    const { user } = req.headers

    if (!await isUnavailable(user)){
        res.sendStatus(404)
        return
    }

    try {
        await db.collection('participants').updateOne({ name: user }, { $set: { lastStatus: Date.now() }})
        res.sendStatus(200)
        
    } catch (err) {
        res.sendStatus(500)
    }

})


app.listen(PORT, () => console.log(`Running on port ${PORT}`))
