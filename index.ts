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

app.get('/orders', async (req, res) => {
    const orders = await prisma.orders.findMany({
        include: {
            user: {
                select: {
                    email: true
                }
            },
            item: {
                select: {
                    title: true
                }
            }
        }
    })
    res.send(orders)
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


app.post('/signup', async (req, res) => {
    const { email, name, password } = req.body
    try {
        const alreadyExists = await prisma.users.findUnique({ where: { email } })
        if (alreadyExists) {
            res.status(400).send({ message: 'This account already exists!' })
        } else {
            const newUser = await prisma.users.create({
                data: {
                    email: email,
                    name: name,
                    password: password
                }
            })
            res.status(200).send(newUser)
        }
    }
    catch (err) {
        //@ts-ignore
        res.status(400).send(`<pre>${err.message}</pre>`)
    }
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body
    try {
        const match = await prisma.users.findFirst({ where: { email: email, password: password } })
        if (match) {
            res.status(200).send(match)
        } else {
            res.status(400).send({ message: 'Email or password incorrect!' })
        }
    }
    catch (err) {
        //@ts-ignore
        res.status(400).send(`<pre>${err.message}</pre>`)
    }
})

app.patch('/users/:email', async (req, res) => {
    const email = req.params.email
    const { name, password } = req.body
    try {
        const match = await prisma.users.findUnique({ where: { email } })
        if (match) {
            const updated = await prisma.users.update(
                {
                    where: { email },
                    data: {
                        name: name !== null ? name : undefined,
                        password: password !== null ? password : undefined
                    }
                }
            )
            res.status(200).send(updated)
        } else {
            res.status(404).send({ error: 'User not found' })
        }
    }
    catch (err) {
        //@ts-ignore
        res.status(400).send(err.message)
    }
})

app.delete('/orders/:id', async (req, res) => {
    const id = Number(req.params.id)
    const { email } = req.body
    try {
        const order = await prisma.orders.findUnique({ where: { id } })
        const user = await prisma.users.findUnique({ where: { email } })
        if (order && user && order.usersId === user.id) {
            await prisma.orders.delete({ where: { id } })
            res.status(200).send({ message: 'Order deleted sucessfully' })
        } else {
            res.status(404).send({ message: 'Order or user not found!' })
        }
    }
    catch (err) {
        //@ts-ignore
        res.status(400).send(`<pre>${err.message}</pre>`)
    }
})

app.listen(PORT, () => {
    console.log(`Server running on  http://localhost:${PORT}`)
})