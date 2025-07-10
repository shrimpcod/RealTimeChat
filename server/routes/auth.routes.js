const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {check, validationResult } = require('express-validator');
const db = require('../db/knex');
const authMiddleware = require('../middleware/auth.middleware');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET){
    console.error('FATAL ERROR: JWT_SECRET is not defined');
    process.exit(1);
}

router.post(
    '/register',
    [
        check('username', 'Поле обязательно для заполнения').not().isEmpty().trim().escape(),
        check('email', 'Пожалуйста, введите корректный email').isEmail().normalizeEmail(),
        check('password', 'Пароль должен содержать минимум 6 символов').isLength({ min: 6}),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        const {username, email, password} = req.body;
        try {
            let userByEmail = await db('users').where({email}).first();
            if (userByEmail){
                return res.status(400).json({errors: [{msg: 'Пользователь с таким email уже существует'}]})
            }

            let userByUsername = await db('users').where({username}).first();
            if (userByUsername){
                return res.status(400).json({errors: [{msg: 'Пользователь с таким именем уже существует'}]})
            }

            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            const [insertedUser] = await db('users').insert({
                username,
                email,
                password_hash,
            }).returning(['id', 'username', 'email', 'avatar_url', 'is_online', 'last_seen']);

            const userForClientResponse = {
                id: insertedUser.id,
                username: insertedUser.username,
                email: insertedUser.email,
                avatar_url: insertedUser.avatar_url,
                is_online: insertedUser.is_online,
                last_seen: insertedUser.last_seen
            };

            const payloadForToken = {
                user: {
                    id: insertedUser.id,
                    username: insertedUser.username
                }
            };

            jwt.sign(
                payloadForToken,
                JWT_SECRET,
                {expiresIn: '7d'},
                (err, token) => {
                    if (err) throw err;
                    return res.status(201).json({token: token, user: userForClientResponse});
                }
            )

        } catch (err) {
            console.error(err.message);
            return res.status(500).send('Ошибка сервера при регистрации');
        }
    })

router.post(
    '/login',
    [
        check('email', 'Пожалуйста, введите корректную почту').isEmail().normalizeEmail(),
        check('password', 'Пароль не может быть пустым').exists().not().isEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        const {email, password} = req.body;
        try {
            const user = await db('users').where({email}).first();

            if (!user) {
                return res.status(400).json({errors: [{msg: 'Неверные учетные данные (email)'}]});
            }

            const isMatch = await bcrypt.compare(password, user.password_hash)
            if(!isMatch){
                return res.status(400).json({errors: [{msg: 'Неверные учетные данные (пароль)'}]});
            }

            const userForClientResponse = {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar_url: user.avatar_url,
                is_online: user.is_online,
                last_seen: user.last_seen
            };

            const payloadForToken = {
                user: {
                    id: user.id,
                    username: user.username
                }
            };

            jwt.sign(
                payloadForToken,
                JWT_SECRET,
                {expiresIn: '7d'},
                (err, token) => {
                    if (err) throw err;
                    return res.status(201).json({token: token, user: userForClientResponse});
                }
            )

        } catch (err) {
            console.error(err.message);
            return res.status(500).send('Ошибка сервера при попытке входа')
        }
    })

router.post('/logout', authMiddleware, async (req, res) => {
    try{
        const userId = req.user.id;
        await db('users').where({id: userId}).update({last_seen: new Date(), is_online: false});
        res.status(200).json({msg: 'Выход успешно выполнен'});
    } catch (err){
        console.error('Ошибка при выходе: ', err.message)
        res.status(500).send('Ошибка сервера при выходе')
    }
})

//TODO: перенести в userRoutes
router.get('/me', authMiddleware, async (req, res) => {
    try{
        if(!req.user || !req.user.id){
            return res.status(401).json({msg: 'Пользователь не аутентифицирован или токен не валиден'})
        }

        const userId = req.user.id;
        const currentUserProfile = await db('users')
            .where({id: userId})
            .select('id', 'username', 'email', 'avatar_url', 'is_online', 'last_seen', 'created_at')
            .first();
        if (!currentUserProfile) {
            return res.status(404).json({msg: 'Профиль пользователя не найден'})
        }
        res.status(200).json(currentUserProfile);
    } catch (err){
        console.error("Ошибка при получении данных пользователя (/me):", err.message);
        res.status(500).send('Ошибка сервера');
    }
})

module.exports = router