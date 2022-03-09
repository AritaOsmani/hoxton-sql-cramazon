import { Prisma, PrismaClient } from '@prisma/client'
import express from 'express'
import cors from 'cors'

const prisma = new PrismaClient({ log: ['query', 'error'] })

const app = express();
app.use(cors())
app.use(express.json())

const PORT = 4000;

app.get('/items', async (req, res) => {
    const items = await prisma.items.findMany(
        {
            include:
            {
                Orders: {
                    include: {
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        })
    res.send(items)
})

app.get('/items/:title', async (req, res) => {
    const title = req.params.title;
    try {
        const match = await prisma.items.findUnique({
            where: { title }, include: {
                Orders: {
                    include: { user: { select: { name: true } } }
                }
            }
        })
        if (match) {
            res.status(200).send(match)
        } else {
            res.status(404).send({ error: 'Item not found!' })
        }
    } catch (err) {
        //@ts-ignore
        res.status(400).send(`<pre>${err.message}</pre>`)
    }
})

app.get('/users', async (req, res) => {
    try {
        const users = await prisma.users.findMany({ include: { Orders: { include: { item: { select: { title: true } } } } } })
        res.send(users)
    } catch (err) {
        //@ts-ignore
        res.status(400).send(`<pre>${err.message}</pre>`)
    }
})

app.post('/addOrder', async (req, res) => {
    const { email, title, quantity } = req.body
    try {
        const user = await prisma.users.findUnique({ where: { email } })
        const item = await prisma.items.findUnique({ where: { title } })
        if (user && item) {
            const alreadyExists = await prisma.orders.findFirst(
                {
                    where: { usersId: user.id, itemsId: item.id }
                })

            if (!alreadyExists) {
                const updatedOrder = await prisma.users.update({
                    where: { email },
                    data: {
                        Orders: {
                            create: {
                                quantity: quantity,
                                item: {
                                    connect: { title: title }
                                }
                            }
                        }
                    }
                })
                res.send(updatedOrder)
            } else {
                res.status(400).send({ error: 'Order already made' })
            }
        } else {
            res.status(404).send({ error: 'User or item does not exist!!' })
        }

    } catch (err) {
        //@ts-ignore
        res.status(400).send(`<pre>${err.message}</pre>`)
    }
})

app.listen(PORT, () => {
    console.log(`Server running on  http://localhost:${PORT}`)
})