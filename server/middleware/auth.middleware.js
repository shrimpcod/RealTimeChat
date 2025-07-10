const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

if(!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in auth.middleware.js")
    process.exit(1);
}

module.exports = function(req, res, next) {
    const authHeader = req.header('authorization');
    const tokenFromHeader = req.header('x-auth-token');

    let token;

    if(authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7, authHeader.length);
    } else if(tokenFromHeader) {
        token = tokenFromHeader;
    }

    if(!token){
        return res.status(401).json({msg: 'Нет токена, авторизация отклонена'})
    }

    try{
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err){
        console.error('Ошибка верификации токена: ', err.message);
        if(err.name === 'TokenExpiredError') {
            return res.status(401).json({msg: 'Срок действия токена истек'})
        }
        if(err.name === 'JsonWebTokenError') {
            return res.status(401).json({msg: 'Невалидный токе'})
        }
        return res.status(401).json({msg: 'Токен недействителен или произошла ошибка'})
    }
}