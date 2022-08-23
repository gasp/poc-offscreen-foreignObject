onconnect = function (e) {
  // requires @types/sharedworker
  const port = e.ports[0]
  console.log(e.ports)

  port.onmessage = function (e) {
    console.log('sharedWorker: got messsage', e)
    const workerResult = 'Result: ' + e.data[0] * e.data[1]

    port.postMessage(workerResult)
  }
  let n2 = 0
  setInterval(() => {
    port.postMessage('ping' + n2)
    n2++
  }, 1000)
}
