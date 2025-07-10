const express = require('express');
const router = express.Router()
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const db = require('../db/knex');
const {check, query, param, validationResult} = require('express-validator');

router.get(
    '/search',
    [
        authMiddleware,
        query('q', 'Поисковый запрос должен быть не пустой строкой')
            .isString()
            .trim()
            .notEmpty()
            .isLength({min: 1})
            .escape()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() });
        }

        const searchTerm = req.query.q;
        const currentUserId = req.user.id;

        try {
            const users = await db('users')
                .whereNot('id', currentUserId)
                .andWhere(function(){
                    this.where('username', 'ILIKE', `%${searchTerm}%`)
                        .orWhere('email', 'ILIKE', `%${searchTerm}%`)
                })
                .select('id', 'username', 'email', 'avatar_url', 'is_online', 'last_seen')
                .limit(10)

            res.json(users);
        } catch (err) {
            console.error('Ошибка при поиске пользователей:', err.message, err.stack);
            res.status(500).send('Ошибка сервера при поиске пользователей');
        }
    }
)

router.get(
    '/:id',
    [
        authMiddleware,
        param('id', 'ID пользователя должен быть валидным UUID').isUUID()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const userIdToFind = req.params.id;
            const currentUserId = req.user.id;

            const userProfile = await db('users')
                .where({ id: userIdToFind })
                .select('id', 'username', 'email', 'avatar_url', 'is_online', 'last_seen', 'created_at')
                .first();

            if (!userProfile) {
                return res.status(404).json({ msg: 'Пользователь не найден' });
            }

            res.json(userProfile);
        } catch (err) {
            console.error('Ошибка при получении профиля пользователя:', err.message, err.stack);
            res.status(500).send('Ошибка сервера');
        }
    }
)

router.put(
    '/me',
    [
        authMiddleware,
        check('username', 'Имя пользователя не может быть пустым и должно быть строкой').optional().not().isEmpty().trim().escape(),
        check('email', 'Пожалуйста, введите корректный email').optional().isEmail().normalizeEmail(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const userId = req.user.id;
        const {username, email}  = req.body

        const fieldsToUpdate = {}
        if(username) fieldsToUpdate.username = username;
        if(email) fieldsToUpdate.email = email;
        fieldsToUpdate.updated_at = new Date();

        if(Object.keys(fieldsToUpdate).length === 1 && fieldsToUpdate.updated_at) {
            return res.status(400).json({ msg: 'Не передано полей для обновления' });
        }

        try{
            if(username){
                const existindUser = await db('users').where('username', username).andWhereNot('id', userId).first();
                if(existindUser) return res.status(400).json({ errors: [{ msg: 'Это имя пользователя уже занято' }] });
            }
            if(email){
                const existingUser = await db('users').where('email', email).andWhereNot('id', userId).first();
                if (existingUser) return res.status(400).json({ errors: [{ msg: 'Этот email уже используется' }] });
            }

            const [updatedUser] = await db('users')
                .where({id: userId})
                .update(fieldsToUpdate)
                .returning(['id', 'username', 'email', 'avatar_url', 'is_online', 'last_seen'])

            res.json(updatedUser);
        } catch (err) {
            console.error("Ошибка обновления профиля:", error);
            res.status(500).send('Ошибка сервера');
        }
    }
)

router.post(
    '/me/avatar',
    authMiddleware,
    upload.single('avatar'),
    async(req, res) => {
        if(!req.file){
            return res.status(400).json({msg: 'Файл не был загружен'})
        }

        try{
            const avatarUrl = `/avatars/${req.file.filename}`;
            const [updatedUser] = await db('users')
                .where({ id: req.user.id })
                .update({avatar_url: avatarUrl})
                .returning(['id', 'username', 'email', 'avatar_url', 'is_online', 'last_seen'])
            res.json(updatedUser);
        } catch (err) {
            console.error("Ошибка обновления аватара:", error);
            res.status(500).send('Ошибка сервера');
        }
    },
    (error, req, res, next) => {
        if(error){
            console.error("Ошибка Multer:", error.message);
            res.status(400).json({ msg: error.message });
        } else {
            next()
        }
    }
)

router.post(
    '/me/change-password',
    [
        authMiddleware,
        check('oldPassword', 'Старый пароль не может быть пустым. Пожалуйста подтвердите старый пароль.').not().isEmpty(),
        check('newPassword', 'Новый пароль должен содержать минимум 6 символов').isLength({ min: 6 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id;

        try{
            const user = await db('users').where({id: userId}).select('id', 'password_hash').first();
            if(!user){
                return res.status(404).json({msg: 'Пользователь не найден'})
            }

            const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
            if(!isMatch){
                return res.status(400).json({ errors: [{ msg: 'Неверный старый пароль', path: 'oldPassword' }] });
            }

            const salt = await bcrypt.genSalt(10);
            const newPasswordHash = await bcrypt.hash(newPassword, salt);

            await db('users')
                .where({id: userId})
                .update({password_hash: newPasswordHash, updated_at: new Date()})

            res.status(200).json({msg: 'Пароль успешно изменен'})
        } catch (err) {
            console.error("Ошибка смены пароля:", error);
            res.status(500).send('Ошибка сервера');
        }
    }
)

router.delete(
    '/me/delete-profile',
    authMiddleware,
    async (req, res) => {
        const userId = req.user.id;
        try{
            await db.transaction(async (trx) => {
                const deletedRows = await trx('users').where({id: userId}).del();
                if(deletedRows === 0){
                    throw new Error('Пользователь не найден или удален')
                }
            })
            res.status(200).json({msg: 'Профиль успешно удален'})
        } catch (error) {
            console.error("Ошибка удаления профиля:", error);
            res.status(500).send('Ошибка сервера');
        }
    }
)

module.exports = router;