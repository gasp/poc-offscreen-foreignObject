import html2canvas from 'html2canvas'
import { clonNode } from './lib/foreignObject'



document.querySelector('#photo').addEventListener('click', () => {
  const clone = cloneNode(document.documentElement, undefined, true, '123')
  html2canvas(document.querySelector('body')).then(canvas => {
    document.body.appendChild(canvas)
  })
  html2canvas(clone).then(canvas => {
    document.body.appendChild(canvas)
  })
})
