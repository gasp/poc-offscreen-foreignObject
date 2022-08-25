import { toSvg } from './lib/foreignObject'

export function capture(key: string) {
  // const node = document.documentElement as Node
  // const node = document.querySelector('main')
  toSvg(document.documentElement, false, key)
    .then(function (svg) {
      // console.log(svg)
      const img = new Image()
      img.src = svg
      document.body.appendChild(img)
    })
    .catch(function (error) {
      console.error('oops, something went wrong!', error)
    })
}

document.addEventListener('mousedown', (ev) => {
  if (!ev.target) return alert('nothing was clicked')
  console.log(ev.target)

  const clickKey = Date.now().toString(36)
  ;(ev.target as Element).setAttribute('data-click', clickKey)

  capture(clickKey)
})

/*
if (window.Worker) {
  const myWorker = new Worker(
    new URL('./workers/sampleWorker.ts', import.meta.url),
    {
      type: 'module',
    },
  )

  // myWorker.postMessage([1, 2])
  // console.log('Message posted to worker')

  myWorker.onmessage = (event) => {
    console.log('Message received from worker', event.data)
  }
} else {
  console.log("Your browser doesn't support web workers.")
}

if (!!window.SharedWorker) {
  const sharedWorker = new SharedWorker(
    new URL('./workers/sharedWorker.ts', import.meta.url),
    {
      type: 'module',
    },
  )

  // sharedWorker.port.postMessage([1, 2])
  // console.log('Message posted to sharedWorker')

  sharedWorker.port.onmessage = (event) => {
    console.log('Message received from sharedWorker', event.data)
  }
}

*/