async function loadKiosksInfo(){
  var response = await fetch('/admin/kiosk/all')
  if (response.redirected) {
    window.location.href = response.url
    return
  }
  var data = await response.json()
  if(data && (data.length === 0 || data.length)) return data
  else throw new Error('Wrong response format')
}

async function loadMediaInfo(){
  var response = await fetch('/admin/media/all')
  if (response.redirected) {
    window.location.href = response.url
    return
  }
  var data = await response.json()
  if(data && (data.length === 0 || data.length)) return data
  else throw new Error('Wrong response format')
}

function renderMediaSelectItem(media, currentMediaHash) {
  return `<option value="${media.hash}" ${currentMediaHash === media.hash ? 'selected' : ''}>${media.name}</option>`
}

function renderMediaSelect({hash, mediaHash, media}) {
  console.log({hash, mediaHash, media})
  var currentMediaHash = mediaHash?.length ? mediaHash : ''
  return `<select class="kiosk-media-select" data-kiosk="${hash}">
            <option value="" ${currentMediaHash === '' ? 'selected' : ''}>Ничего</option>
            ${media.map(function (currentMedia) {
              return renderMediaSelectItem(currentMedia, currentMediaHash)
            }).join('')}
          </select>`
}

function renderKioskAction({id, hash, mediaHash}, media) {
  return `${renderMediaSelect({hash, mediaHash, media})}`
}

function renderKioskPreview({id, hash}) {
  return `<img class="preview-img materialboxed" id="preview-img-${hash}" src="/admin/kiosk/screen/${hash}.jpg?t=${Date.now()}" alt="preview">`
}

function renderKioskTableRow({ id, hash, name, mediaHash }, media) {
  return `
    <tr>
      <td class="preview-img-row">${renderKioskPreview({id, hash})}</td>
      <td>${name}</td>
      <td>${renderKioskAction({id, hash, mediaHash}, media)}</td>
    </tr>
  `
}

function renderKioskTable(kiosks, media) {
  var element = document.querySelector('#table tbody');
  var html = ''
  
  kiosks.sort(({id: a}, {id: b}) => a - b)

  for(var i = 0; i < kiosks.length; i++){
    html += renderKioskTableRow(kiosks[i], media)
  }

  element.innerHTML = html
  M.Materialbox.init(document.querySelectorAll('.materialboxed'))
  M.FormSelect.init(document.querySelectorAll('select'))

  document.querySelectorAll('select').forEach(function(select) {
    select.addEventListener('change', (event) => {
      var mediaHash = event.target.value
      var kioskHash = event.target.dataset.kiosk
      
      var data = new FormData()
      data.append('mediaHash', mediaHash)
      data.append('kioskHash', kioskHash)

      document.querySelector('.main-loader').classList.remove('hide')
      fetch(`/admin/kiosk/setmedia`, {
        method: 'POST',
        body: data
      }).then(function (response) {
        if (response.redirected) {
          window.location.href = response.url
          return
        }
        return response.json()
      }).then(function (data){
        if (data.error) {
          alert(data.error)
        } else if (data.result) {
          alert('Медиа успешно установлено')
        }
      }).finally(async () => {
        var [media, kiosks] = await Promise.all([
          loadMediaInfo(),
          loadKiosksInfo()
        ])
        renderKioskTable(kiosks, media)
        document.querySelector('.main-loader').classList.add('hide')
      })
    })
  })
}

window.addEventListener('load', async function() {
  const socket = io()

  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect' || reason === 'io client disconnect') {
      socket.connect()
    }
  })

  socket.on('connect_error', () => setTimeout(socket.connect, 1000))

  M.AutoInit()

  var [media, kiosks] = await Promise.all([
    loadMediaInfo(),
    loadKiosksInfo()
  ])
  renderKioskTable(kiosks, media)

  socket.on('screen', ({ kioskHash, data }) => {
    if(data){
      document.querySelectorAll(`img#preview-img-${kioskHash}`).forEach(img => {
        img.src=data
      })
    }
  })
  document.querySelector('.main-loader').classList.add('hide')
})
