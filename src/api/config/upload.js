const multer = require('multer');
const path = require('path');

module.exports = {
  storage: multer.diskStorage({
    destination: path.resolve(__dirname, '..', '..', '..', 'uploads', 'images'),
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname);
      const filename = path.basename(file.originalname, extension);
      cb(null, `${filename}-${Date.now()}${extension}`);
    }
  })
};
