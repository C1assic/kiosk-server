const { Kiosk, Media } = require('./db/models')
const cache = require('./cache')
const { Server } = require('socket.io')
const defaultImg = require('./assets/defaultImg')

const state = {
  lastScreenshot: 0
}

const kiosks = {

}

const main = (server) => {
  const io = new Server(server)

  io.use(function(socket, next){
    if (socket.handshake.auth && socket.handshake.auth.type === 'kiosk' && socket.handshake.auth.hash?.length) {
      if(kiosks[socket.handshake.auth.hash]) return next(new Error('Authentication error')) 

      Kiosk.findOne({
        where: {
          hash: socket.handshake.auth.hash,
        }
      }).then((kiosk) => {
        if(!kiosk) next(new Error('Authentication error')) 
        
        socket.kiosk = kiosk
        next()
      }).catch((err) => {
        next(err)
      })
    } else {
      next()
    }
  }).on('connection', (socket) => {
    if(socket.kiosk?.hash) {
      const hash = socket.kiosk.hash
      kiosks[hash] = socket.kiosk
      socket.join(hash)
      socket.join('kiosk')

      socket.emit('screenshot')
      io.to('other').emit('screen', { kioskHash: hash, data: defaultImg })

      socket.on('screen', ({ kioskHash, data }) => {
        if(kioskHash === hash){
          cache.screenshots[hash] = {
            data,
            timestamp: Date.now()
          }
          io.to('other').emit('screen', { kioskHash: hash, data })
        }
      })

      if (socket.kiosk?.mediaHash && socket.kiosk?.mediaHash !== socket.handshake?.auth?.mediaHash) {
        socket.emit('new_media', { hash: socket.kiosk.mediaHash })
      }

      socket.on('disconnect', (reason) => {
        delete kiosks[hash]
        cache.screenshots[hash] = {
          data: defaultImg,
          timestamp: Date.now()
        }
        io.to('other').emit('screen', { kioskHash: hash, data: defaultImg })
      })
    } else {
      socket.join('other')
      socket.on('screenshot', () => {
        if(Date.now() - state.lastScreenshot < 1000) return
        io.to('kiosk').emit('screenshot')
        state.lastScreenshot = Date.now()
      })
    }
  })

  setInterval(() => {
    io.to('kiosk').emit('screenshot')
    state.lastScreenshot = Date.now()
  }, 10000)

  return io
}

module.exports = main
