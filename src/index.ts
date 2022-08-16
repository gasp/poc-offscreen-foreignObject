import { toSvg } from './lib/foreignObject';

export function capture(key: string) {
    // const node = document.documentElement as Node
    const node = document.querySelector('main')
    toSvg(node, false, key).then(function (svg) {
        // console.log(svg)
        const img = new Image()
        img.src = svg
        document.body.appendChild(img);
    })
    .catch(function (error) {
        console.error('oops, something went wrong!', error);
    });
}


document.addEventListener('click', (ev) => {
    if (!ev.target) return alert('nothing was clicked');
    if (!(ev.target instanceof HTMLElement))
        return alert("target isn't an htmlElement, can it be Text?");

    const clickKey = Date.now().toString(36);
    ev.target.setAttribute('data-click', clickKey);
    
    capture(clickKey)
})