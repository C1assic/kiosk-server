function initSelectMediaType() {
  var contentTypeSelectElement = document.querySelector('#content-type-select');

  var textInputElement = document.querySelector('#text-input');
  var videoInputElement = document.querySelector('#video-input');
  var imageInputElement = document.querySelector('#image-input');

  contentTypeSelectElement.addEventListener('change', (event) => {
    var val = event.target.value
    if(val === 'text') {
      textInputElement.classList.remove("hide");
      videoInputElement.classList.add("hide");
      imageInputElement.classList.add("hide");
    } else if(val === 'image') {
      textInputElement.classList.add("hide");
      videoInputElement.classList.add("hide");
      imageInputElement.classList.remove("hide");
    } else if(val === 'video') {
      textInputElement.classList.add("hide");
      videoInputElement.classList.remove("hide");
      imageInputElement.classList.add("hide");
    } else {
      textInputElement.classList.add("hide");
      videoInputElement.classList.add("hide");
      imageInputElement.classList.add("hide");
    }
  });
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

async function deleteMedia(id){
  var response = await fetch(`/admin/media/delete/${id}`)
  if (response.redirected) {
    window.location.href = response.url
    return
  }
  var data = await response.json()
  if (data.error) {
    alert(data.error)
  } else if (data.result) {
    renderMediaTable(data.result)
  }
}

function renderMediaType(type) {
  if (type === 'text'){
    return 'Текст'
  } else if (type === 'image'){
    return 'Картинка'
  } else if (type === 'video'){
    return 'Видео'
  } else {
    return '-'
  }
}

function renderMediaAction({id, hash}) {
  return `<a href="#" data-id="${id}" data-hash="${hash}" class='delete-media-btn'>Удалить 🗑</a>`
}

function renderMediaTableRow({ id, hash, name, type }) {
  return `
    <tr>
      <td>${name}</td>
      <td>${renderMediaType(type)}</td>
      <td>${renderMediaAction({id, hash})}</td>
    </tr>
  `
}

function renderMediaTable(media) {
  var element = document.querySelector('#media-table tbody');
  var html = ''

  media.sort(({id: a}, {id: b}) => b - a)

  for(var i = 0; i < media.length; i++){
    html += renderMediaTableRow(media[i])
  }

  element.innerHTML = html
  document.querySelectorAll('a[class="delete-media-btn"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelector('.main-loader').classList.remove('hide')
      deleteMedia(btn.dataset.id)
      document.querySelector('.main-loader').classList.add('hide')
    })
  })
}



window.addEventListener('load', async function() {
  M.AutoInit()

  initSelectMediaType()
  var media = await loadMediaInfo()
  renderMediaTable(media)


  document.querySelector('a#upload-btn').addEventListener('click', async (e) => {
    var mediaType = document.querySelector('#content-type-select').value
    var mediaName = document.querySelector('#media-name').value

    if(!mediaName?.length) {
      alert('Укажите имя')
      return
    }

    var data = new FormData()
    data.append('name', mediaName)

    if(mediaType === 'text') {
      var text = document.querySelector('#text-input textarea').value
      if(!text.length) {
        alert('Укажите текст')
        return
      }
      data.append('text', text)
    } else if(mediaType === 'image') {
      var file = document.querySelector('#image-input input').files[0]
      if(!file) {
        alert('Выберите картинку')
        return
      }
      data.append('image', file, 'image')
    } else if(mediaType === 'video') {
      var file = document.querySelector('#video-input input').files[0]
      if(!file) {
        alert('Выберите видео')
        return
      }
      data.append('video', file, 'video')
    } else {
      alert('Выберите тип данных')
      return
    }

    data.append('type', mediaType)

    document.querySelector('.main-loader').classList.remove('hide')
    fetch('/admin/media/upload', {
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
        document.querySelector('#content-type-select').value = ''
        document.querySelector('#media-name').value = ''
        document.querySelector('#text-input textarea').value = ''
        document.querySelector('#image-input input').value = ''
        document.querySelector('#video-input input').value = ''
        renderMediaTable(data.result)
      }
    }).finally(() => {
      document.querySelector('.main-loader').classList.add('hide')
    })
  })
  document.querySelector('.main-loader').classList.add('hide')
})
