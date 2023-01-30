const state = {
  connected: false,
}

const media = {
  hash: undefined,
  type: undefined, //text, image, video
  content: undefined // url or text
}

const hideError = () => {
  const error = document.querySelector('#error')
  error.style.display = 'none'
}

const showError = (text) => {
  const error = document.querySelector('#error')
  error.style.display = 'flex'
  const textContainer = error.querySelector('p')
  textContainer.textContent = text
}



const showMedia = () => {
  const textContainer = document.querySelector('#textContainer')
  const videoContainer = document.querySelector('#videoContainer')
  const imageContainer = document.querySelector('#imageContainer')

  textContainer.style.display = 'none'
  imageContainer.style.display = 'none'
  videoContainer.style.display = 'none'

  textContainer.querySelector('.content').innerHTML = ''
  imageContainer.querySelector('.content').innerHTML = ''
  videoContainer.querySelector('.content').innerHTML = ''

  if(!media?.hash?.length) {
    return
  }

  if(media.type === 'text') {
    textContainer.style.display = 'block'

    const contentElement = textContainer.querySelector('.content')
    contentElement.innerHTML = media.content
  } else if(media.type === 'image') {
    imageContainer.style.display = 'block'
    
    const contentElement = imageContainer.querySelector('.content')
    contentElement.innerHTML = `<img src="${media.content}?t=${Date.now()}">`
  } else if(media.type === 'video') {
    videoContainer.style.display = 'block'

    const contentElement = videoContainer.querySelector('.content')
    contentElement.innerHTML = `<video id="autoplay" preload="auto" loop muted autoplay src="${media.content}?t=${Date.now()}">`
    contentElement.querySelector('video').addEventListener('loadeddata', fitVideo)
    contentElement.querySelector('video').addEventListener('loadedmetadata', fitVideo)
    contentElement.querySelector('video').addEventListener('emptied', fitVideo)
  }

  hideError()
}

const connectHandler = () => {
  const loading = document.querySelector('#loading')
  if(state.connected) {
    loading.style.display = 'none'
  } else {
    loading.style.display = 'flex'
  }
}

const loadMediaInfo = async (hash) => {
  const response = await fetch(`/kiosk/media/${hash}`)
  const data = await response.json()
  if(data?.hash && data?.type) return data
  else throw new Error('Wrong response format for media info')
}

const newMediaHandler = async (newHash) => {
  try {
    if(newHash?.length) {
      const { hash, type, content } = await loadMediaInfo(newHash)
      if(hash && hash !== state.mediaHash){
        media.hash = hash
        media.type = type
        media.content = content
      }
    } else {
      media.hash = null
      media.type = null
      media.content = null
    }
  } catch (err) {
    console.error(err)
  }
  showMedia();
}

const makeScreenshot = (socket) => {
  if(state.connected){
    const body = document.querySelector('body')
    htmlToImage.toCanvas(body).then(canvas => {
      socket.emit('screen', { kioskHash, data: canvas.toDataURL('image/jpeg') })
    })
  }
}

const fitVideo = () => {
  if(media.type !== 'video') return;
  const body = document.querySelector('body')
  const bodyAspectRatio = body.offsetWidth / body.offsetHeight

  const videoContainer = document.querySelector('video')
  if(!videoContainer) return;

  const videoAspectRatio = videoContainer.offsetWidth / videoContainer.offsetHeight
  if(bodyAspectRatio/videoAspectRatio < 1) {
    videoContainer.style.width = '100%';  
    videoContainer.style.height = 'auto';
  } else {
    videoContainer.style.width = 'auto';  
    videoContainer.style.height = '100%';
  }
}

const main = async () => {
  console.log(`start worker for kiosk #${kioskHash}`)
  const body = document.querySelector('body')

  await newMediaHandler(mediaHash)

  const socket = io({
    auth: (cb) =>  cb({
      hash: kioskHash,
      type: 'kiosk',
      mediaHash: media.hash,
      width: body.offsetWidth,
      height: body.offsetHeight,
    })
  })

  socket.on('disconnect', (reason) => {
    state.connected = false
    connectHandler()
    if (reason === 'io server disconnect' || reason === 'io client disconnect') {
      socket.connect()
    }
  })

  socket.on('connect_error', () => {
    setTimeout(() => socket.connect(), 1000)
  })

  socket.on('connect', () => {
    state.connected = true
    connectHandler()
  })

  socket.on('new_media', ({ hash }) => {
    newMediaHandler(hash)
    setTimeout(() => {
      makeScreenshot(socket)
    }, 500)
  })

  socket.on('screenshot', () => {
    makeScreenshot(socket)
  })

  window.onresize = () => {
    fitVideo()
  }
  setInterval(fitVideo, 100)
}

window.addEventListener('load', main)


/* Only register a service worker if it's supported */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}