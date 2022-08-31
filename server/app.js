import express from 'express'
import cors from 'cors'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'


const PORT = 5000
const app = express()
app.use(express.json())
app.use(cors())
dayjs.extend(customParseFormat)

app.post('/participants', (req, res) => {
    const { name } = req.body

    if (!name){
        res.sendStatus(422)
        return
    }

    const isAvailable = !true
    if (!isAvailable){
        res.sendStatus(409)
        return
    }

    res.status(201).send({name, lastStatus: Date.now()})
})


app.get('/participants', (req, res) => {
    const participants = []
    res.send(participants)
})


app.post('/messages', (req, res) => {
    const { to, text, type } = req.body
    const { User: from } = req.headers
    // const time = dayjs('HH:MM:SS')

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


app.get('/messages', (req, res) => {
    const { limit } = req.query
    const { User: from } = req.headers

    if (limit){

    }

    res.send([])
})


app.post('/status', (req, res) => {
    const { User } = req.headers

    if (!isActive(User)){
        res.sendStatus(404)
        return
    }

    res.status(200).send({name: User, lastStatus: Date.now()})
})


function isActive(user){
    return true
}

app.listen(PORT, () => console.log(`Running on port ${PORT}`))