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

async function deleteKiosk(id){
  var response = await fetch(`/admin/kiosk/delete/${id}`)
  if (response.redirected) {
    window.location.href = response.url
    return
  }
  var data = await response.json()
  if (data.error) {
    alert(data.error)
  } else if (data.result) {
    renderKioskTable(data.result)
  }
}

function renderKioskAction({id, hash}) {
  return `<a href="#" data-id="${id}" data-hash="${hash}" class='delete-btn'>Удалить 🗑</a>`
}

function renderKioskTableRow({ id, hash, name }) {
  return `
    <tr>
      <td>${name}</td>
      <td>${hash}</td>
      <td>${renderKioskAction({id, hash})}</td>
    </tr>
  `
}

function renderKioskTable(kiosks) {
  var element = document.querySelector('#table tbody');
  var html = ''
  
  kiosks.sort(({id: a}, {id: b}) => a - b)

  for(var i = 0; i < kiosks.length; i++){
    html += renderKioskTableRow(kiosks[i])
  }

  element.innerHTML = html
  document.querySelectorAll('a[class="delete-btn"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelector('.main-loader').classList.remove('hide')
      deleteKiosk(btn.dataset.id)
      document.querySelector('.main-loader').classList.add('hide')
    })
  })
}



window.addEventListener('load', async function() {
  M.AutoInit()

  var kiosks = await loadKiosksInfo()
  renderKioskTable(kiosks)


  document.querySelector('a#add-btn').addEventListener('click', async (e) => {
    var name = document.querySelector('#name').value

    if(!name?.length) {
      alert('Укажите имя')
      return
    }

    var data = new FormData()
    data.append('name', name)

    document.querySelector('.main-loader').classList.remove('hide')
    fetch('/admin/kiosk/add', {
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
        document.querySelector('#name').value = ''
        renderKioskTable(data.result)
      }
    }).finally(() => {
      document.querySelector('.main-loader').classList.add('hide')
    })
  })
  document.querySelector('.main-loader').classList.add('hide')
})
