const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'public/avatars')
    },
    filename: function(req, file, cb){
        const uniqueSuffix = Date.now() + '-' + + Math.round(Math.random() * 1e9)
        const fileExtension = path.extname(file.originalname)
        cb(null, req.user.id + '-' + uniqueSuffix + fileExtension)
    }
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/webp' || file.mimetype === 'image/png'){
        cb(null, true)
    } else {
        cb(new Error('Недопустимый тип файла. Только JPEG, PNG, WEBP.'), false);
    }
}

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 1024,
    },
    fileFilter: fileFilter,
})

module.exports = upload