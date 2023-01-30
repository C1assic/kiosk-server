const { Kiosk, Media } = require('../db/models')
const crypto = require('crypto')
const ffmpeg = require('ffmpeg')
const express = require('express')
const passport = require('passport')
const path = require('path')
const router = express.Router()
const fs = require('fs')
const cache = require('../cache')
const defaultImg = require('../assets/defaultImg')

const loginMiddleware = (req, res, next) => {
  if (req.user) next()
  else res.redirect('/admin/login')
}

router.get('/login', (req, res, next) => { 
  if (!req.user) next()
  else res.redirect('/admin')
}, (req, res, next) => {
  res.render('admin/login', { 
    title: `Login`, 
  })
})

router.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/admin',
    failureRedirect: '/admin/login',
  })
)

router.get('/', loginMiddleware, (req, res, next) => {
  res.render('admin/content', { 
    title: `Контент`, 
  })
})

router.get('/content', loginMiddleware, (req, res, next) => {
  res.render('admin/content', { 
    title: `Контент`, 
  })
})

router.get('/kiosks', loginMiddleware, (req, res, next) => {
  res.render('admin/kiosks', { 
    title: `Киоски`, 
  })
})

router.get('/out', loginMiddleware, (req, res, next) => {
  res.render('admin/out', { 
    title: `Вывод`, 
  })
})

router.get('/kiosk/all', loginMiddleware, async (req, res, next) => {
  const kiosks = await Kiosk.findAll()
  res.json(kiosks)
})

router.get('/kiosk/screen/:hash.jpg', loginMiddleware, async (req, res, next) => {
  try{
    const hash = req.params.hash
    if(!hash || !cache?.screenshots[hash]?.data) return res.send(Buffer.from(defaultImg.replace(/^data:([A-Za-z-+/]+);base64,/, ''), 'base64'))
    if(Date.now() - cache.screenshots[hash].timestamp > 15000) return res.send(Buffer.from(defaultImg.replace(/^data:([A-Za-z-+/]+);base64,/, ''), 'base64'))
    
    res.send(Buffer.from(cache.screenshots[hash].data.replace(/^data:([A-Za-z-+/]+);base64,/, ''), 'base64'))
  } catch (err) {
    console.error(err)
    next()
  }
})

router.get('/kiosk/delete/:id(\\d+)', loginMiddleware, async (req, res, next) => {
  try{
    const id = parseInt(req.params.id)
    if(!id) throw new Error('id не передан')

    await Kiosk.destroy({
      where: {
        id
      }
    })
  
    const kiosks = await Kiosk.findAll()

    res.json({
      result: kiosks
    })
  } catch (err) {
    res.json({
      error: err.message
    })
  }
})

router.post('/kiosk/add', loginMiddleware, async (req, res, next) => {
  try{
    const name = req.body.name
    if(!name?.length) throw new Error('Необходимо указать имя')

    const hash = crypto.createHash('sha1').update(`${name}_${Date.now()}`).digest('hex')

    const isExsist = await Kiosk.count({
      where: {
        name,
      }
    })

    if(isExsist) throw new Error('Киоск с таким именем уже существует')

    await Kiosk.create({ name, hash })

    const kiosks = await Kiosk.findAll()

    res.json({
      result: kiosks
    })
  } catch (err) {
    res.json({
      error: err.message
    })
  }
})


router.get('/media/all', loginMiddleware, async (req, res, next) => {
  const media = await Media.findAll()
  res.json(media)
});

router.get('/media/delete/:id(\\d+)', loginMiddleware, async (req, res, next) => {
  try{
    const id = parseInt(req.params.id)
    if(!id) throw new Error('id не передан')

    const currentMedia = await Media.findOne({
      where: {
        id
      }
    })

    if(currentMedia?.hash) {
      const isExsist = await Kiosk.count({
        where: {
          mediaHash: currentMedia.hash,
        }
      })

      if(isExsist) throw new Error('Прежде чем удалять медиа, необходимо убрать его со всех киосков')

      if(currentMedia.type === 'image'){
        await (new Promise((resolve) => {
          fs.unlink(path.join('images', currentMedia.content), (err) => {
            resolve(err)
          })
        }))
      } else if(currentMedia.type === 'video') {
        await (new Promise((resolve) => {
          fs.unlink(path.join('videos', currentMedia.content), (err) => {
            resolve(err)
          })
        }))
      }

      await currentMedia.destroy();
    }
  
    const media = await Media.findAll()

    res.json({
      result: media
    })
  } catch (err) {
    res.json({
      error: err.message
    })
  }
})

router.post('/media/upload', loginMiddleware, async (req, res, next) => {
  try{
    const type = req.body.type
    const name = req.body.name

    if (!type?.length) throw new Error('Необходимо указать тип')
    if (!name?.length) throw new Error('Необходимо указать имя')

    const isExsist = await Media.count({
      where: {
        name,
      }
    })

    if(isExsist) throw new Error('Медиа с таким именем уже существует')

    const hash = crypto.createHash('sha1').update(`${name}_${Date.now()}_${type}`).digest('hex')

    if (type === 'text') {
      const text = req.body.text
      if(!text?.length) throw new Error('Необходимо указать текст')
      if(text.length > 1000) throw new Error('Текст слишком длинный')
      await Media.create({ 
        name, 
        hash, 
        type, 
        content: text 
      })
    } else if(type === 'image') {
      const file = req.files.image
      if(file?.name !== 'image') throw new Error('Необходимо загрузить файл')

      let extension = null
      if(file.mimetype === 'image/jpeg') extension = 'jpg'
      else if(file.mimetype === 'image/bmp') extension = 'bmp'
      else if(file.mimetype === 'image/gif') extension = 'gif'
      else if(file.mimetype === 'image/png') extension = 'png'
      else throw new Error('Этот тип файла не поддерживается')

      const filename = `${hash}_${file.md5}.${extension}`
      await file.mv(path.join('images', filename))
      await Media.create({ 
        name, 
        hash, 
        type, 
        content: filename 
      })
    } else if(type === 'video') {
      const file = req.files.video
      if(file?.name !== 'video') throw new Error('Необходимо загрузить файл')
      if(file.mimetype.indexOf('video/') === -1)
        throw new Error('Этот тип файла не поддерживается')

      const filename = `${hash}_${file.md5}.mp4`
      const video = await (new ffmpeg(file.tempFilePath))
      await (new Promise((resolve, reject) => {
        video
        .setDisableAudio()
        .setVideoCodec('h264')
        .save(path.join('videos', filename), (error, file) => {
          if (error) return reject(error)

          resolve(file)
        })
      })).catch((err) => {
        console.error(err)
        throw new Error('Ошибка обработки видео')
      })

      await Media.create({ 
        name, 
        hash, 
        type, 
        content: filename 
      })
    } else throw new Error('Неверный тип медиа')

    const media = await Media.findAll()

    res.json({
      result: media
    })
  } catch (err) {
    res.json({
      error: err.message
    })
  }
})

router.post('/kiosk/setmedia', loginMiddleware, async (req, res, next) => {
  try{
    const { kioskHash, mediaHash } = req.body

    if(!kioskHash?.length) throw new Error('Необходимо передать хэш киоска')

    const kiosk = await Kiosk.findOne({
      where: {
        hash: kioskHash,
      }
    })

    if(!kiosk) throw new Error('Киоск не найден')

    if(!mediaHash?.length) {
      kiosk.mediaHash = null
    } else {
      const media = await Media.findOne({
        where: {
          hash: mediaHash,
        }
      })

      if(!media) throw new Error('Медиа не найдено')

      kiosk.mediaHash = media.hash
    }
    
    await kiosk.save()

    req.io.to(kiosk.hash).emit('new_media', { hash: mediaHash })

    res.json({
      result: kiosk
    })
  } catch (err) {
    res.json({
      error: err.message
    })
  }
})

module.exports = router;
