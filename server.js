const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
// const connectDB = require('./db')
const User = require('./model/user');
const bcyrpt = require('bcryptjs');
const db = 'mongodb+srv://1234:1234@cluster0.yrec2.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
const jwt = require('jsonwebtoken');
const JWT_SECTRET = 'qdnkqjndkj123nkj12312@#@!nkjwndq'


mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,

}).then( () => {
    console.log("Connected To Mongo Db DataBase");
}).catch((err) => {
    console.log("DataBase Connection Error " + err);
})

const app = express()

app.use('/', express.static(path.join(__dirname, 'static')))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const  middleware = (req, res, next) => {

    const token = req.headers.authorization;
    console.log(token, 'tekenl');

    jwt.verify(token, JWT_SECTRET, (err, user) => {
        if (err){
            console.log(err, 'errorr');
            return res.status(400).json({message: "Token expired"})
        } else {
            console.log(user, 'istifadeci');
            req.user = user;
            next()
        }
    })
}


app.get("/api/create", middleware, (req, res) => {
    res.send(req.user)
})

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body
    
    // console.log("myUser",user);
    // if (!user) {
        
    // }
    try {
        // console.log(username);
        console.log(password);
        const user =  await User.findOne({ username: username }).lean()
        if (!user) return res.json({ status: 'error', error: 'Invalid username/password' })
        const hashedPassword = await bcyrpt.compare(password, user.password)
        if (!hashedPassword) return res.json({ status: 'error', error: 'Invalid username/password' })
        const token = jwt.sign(
            { 
                id: user._id, 
                username: user.username 
            }
            , JWT_SECTRET , {expiresIn: "1d"}
        )
        res.status(200).json({ status: 'ok', data: token })

    } catch(error) {
        return res.json({ status: 'error', error: 'Invalid username/password' })
    }



})



app.post('/api/register', async (req, res) => {

    const { username, password: plainTextPassword } = await req.body

    if (!username || typeof username !== 'string') {
        return res.json(
            {
                status: 'error',
                error: 'Invalid username'
            }
        )
    }
    if (!plainTextPassword || typeof plainTextPassword !== 'string') {
        return res.json(
            {
                status: 'error', 
                error: 'Invalid password'
            }
        )
    }
    if (plainTextPassword.length < 5) {
        return res.json( 
            {
                status: "error", 
                error: "Password to small. Should be atleast 6 characters"
            }
        )
    }

    const salt = await bcyrpt.genSalt(10);
    const password = await bcyrpt.hash(plainTextPassword, salt);

    try {
        const response = await User.create({
            username,
            password
        })


        console.log('User create successfully: ', response);
    } catch (error) {
        // console.log(JSON.stringify(error));
        if (error.code === 11000) {
            return res.json({ status: 'error', error: 'User already exists!' })
        }
        throw error
    }

    res.json({ status: "ok" })
})

app.listen(9999, () => {
    console.log("Server up at 9999");
})

