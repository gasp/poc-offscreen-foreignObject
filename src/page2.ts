const myWorker = new Worker(
  new URL('./workers/sampleWorker.ts', import.meta.url),
  {
    type: 'module',
  },
)

myWorker.onmessage = (event) => {
  console.log('Message received from webWorker', event.data)
}

const sharedWorker = new SharedWorker(
  new URL('./workers/sampleWorker.ts', import.meta.url),
  {
    type: 'module',
  },
)

sharedWorker.port.onmessage = (event) => {
  console.log('Message received from sharedWorker', event.data)
}
