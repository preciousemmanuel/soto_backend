import multer from 'multer'
import path from 'path'

const upload = multer({
  storage: multer.diskStorage({}),
  fileFilter: (
    req: Express.Request,
    file: Express.Multer.File,
    cb
  ) => {
    let ext = path.extname(file.originalname)
    cb(null, true)
  }
})

export default upload