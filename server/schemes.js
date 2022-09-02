import joi from 'joi'

const participantSchema = joi.object({
    name: joi.string().required()
})

const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().allow('message', 'private_message').required()
})


export { participantSchema, messageSchema }
