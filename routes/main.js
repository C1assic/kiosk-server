const express = require('express')
const { Kiosk, Media } = require('../db/models')
const router = express.Router()


router.get('/kiosk/:hash', async (req, res, next) => {
  const hash = req.params.hash;
  const kiosk = await Kiosk.findOne({
    where: {
      hash
    }
  })

  if(!kiosk) return next()

  res.render('kiosk/index', { 
    title: `kiosk #${hash}`, 
    kioskHash: hash,
    mediaHash: kiosk.mediaHash,
  })
})

router.get('/kiosk/media/:hash', async (req, res, next) => {
  const hash = req.params.hash

  const media = await Media.findOne({
    where: {
      hash
    }
  })

  if(media?.type === 'text') {
    res.json({ 
      hash,
      type: 'text',
      content: media.content // text
    })
  } else if(media?.type === 'image') {
    res.json({ 
      hash,
      type: 'image',
      content: `/images/${media.content}` // url
    })
  } else if(media?.type === 'video') {
    res.json({ 
      hash,
      type: 'video',
      content: `/videos/${media.content}` // url
    })
  } else {
    next()
  }
})

module.exports = router
