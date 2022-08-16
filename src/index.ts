import { toSvg } from './lib/foreignObject';

export function capture() {
    // const node = document.documentElement as Node
    const node = document.querySelector('main')
    toSvg(node, false).then(function (svg) {
        console.log(svg)
        const img = new Image()
        img.src=svg
        document.body.appendChild(img);
    })
    .catch(function (error) {
        console.error('oops, something went wrong!', error);
    });
}


document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#capture')?.addEventListener('click', capture)
})