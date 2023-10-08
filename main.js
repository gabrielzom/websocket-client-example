
let stompClient = null
const username = document.getElementsByName('username')[0]
const state = document.getElementsByName('state')
const joinOnRoomBtn = document.getElementById('join')
const estimateBtn = document.getElementById('estimate')
const estimationContainerDiv = document.getElementById('estimation-container')
const estimationValuesDiv = document.getElementById('estimation-values')
const uuid = document.getElementsByName('uuid')[0]

document.addEventListener('DOMContentLoaded', getEstimationValues, false)
joinOnRoomBtn.addEventListener('click', connect, true)
estimateBtn.addEventListener('click', estimate, true)

async function getEstimationValues() {
  const { data } = await axios.get('http://localhost:8080/estimation-values')
  data.forEach((value, i) => {
    const radio = document.createElement('input')
    const label = document.createElement('label')
    radio.setAttribute('type', 'radio')
    radio.setAttribute('name', `estimation`)
    radio.setAttribute('id', `estimation-id-${i}`)
    radio.setAttribute('value', value)
    radio.addEventListener('change', updateEstimation, true)
    label.setAttribute('for', `estimation-id-${i}`)
    label.innerHTML = value
    label.appendChild(radio)
    estimationValuesDiv.appendChild(label)
  })
}

function connect(evt) {
  joinOnRoomBtn.disabled = true
  let stateValue = ''
  for (const st of state) {
    if (st.checked) {
      stateValue = st.value
      break;
    }
  }
  if (
    username && 
    username.value && 
    username.value.trim().length &&
    state &&
    stateValue.trim().length
  ) {
    const sock = new SockJS('http://localhost:8080/ws')
    stompClient = Stomp.over(sock)
    stompClient.connect({}, onConnected, onError)
    evt.preventDefault()
  }
}

async function estimate() {
  const { data } = await axios.get('http://localhost:8080/estimate')
}

function onConnected() {
  let stateValue = ''
  for (const st of state) {
    if (st.checked) {
      stateValue = st.value
      break;
    }
  }
  estimationContainerDiv.hidden = false
  stompClient.subscribe('/topic/public', onMessageReceived)
  stompClient.send(
    '/app/planning-poker/user', 
    {},
    JSON.stringify({ 
      username: username.value,
      state: stateValue, 
    })
  )
  
}

function onError() {
  alert('An error has occurred. Please refresh page and try again. ')
}

function onMessageReceived(payload) {
  const player = JSON.parse(payload.body)
}

function updateEstimation(evt) {
  let stateValue = ''
  for (const st of state) {
    if (st.checked) {
      stateValue = st.value
      break;
    }
  }
  if (evt && evt.target.value && stompClient) {
    const player = {
      username: username.value,
      uuid: uuid.value,
      estimation: evt.target.value,
      state: stateValue,
    }
    stompClient.send(
      '/app/planning-poker/vote',
      {},
      JSON.stringify(player)
    )
  }
  evt.preventDefault()
}

