const a = 1;

const util = {
    width: function (node) {
        var leftBorder = util.px(node, 'border-left-width');
        var rightBorder = util.px(node, 'border-right-width');
        return node.scrollWidth + leftBorder + rightBorder;
    },
    height: function (node) {
        var topBorder = util.px(node, 'border-top-width');
        var bottomBorder = util.px(node, 'border-bottom-width');
        return node.scrollHeight + topBorder + bottomBorder;
    },
    px: function (node, styleProperty) {
        var value = window.getComputedStyle(node).getPropertyValue(styleProperty);
        return parseFloat(value.replace('px', ''));
    },
    asArray: function (arrayLike) {
        var array = [];
        var length = arrayLike.length;
        for (var i = 0; i < length; i++) array.push(arrayLike[i]);
        return array;
    },
    escapeXhtml: function (string) {
        return string.replace(/#/g, '%23').replace(/\n/g, '%0A');
    },
    uid: function() {
        let index = 0;
        return function () {
            return 'u' + fourRandomChars() + index++;

            function fourRandomChars() {
                /* see http://stackoverflow.com/a/6248722/2519373 */
                return ('0000' + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4);
            }
        };
    }

}

/**
 * @param {Node} node - The DOM Node object to render
 * @param {Object} options - Rendering options
 * @param {Function} options.filter - Should return true if passed node should be included in the output
 *          (excluding node means excluding it's children as well). Not called on the root node.
 * @param {String} options.bgcolor - color for the background, any valid CSS color value.
 * @param {Number} options.width - width to be applied to node before rendering.
 * @param {Number} options.height - height to be applied to node before rendering.
 * @param {Object} options.style - an object whose properties to be copied to node's style before rendering.
 * @param {Number} options.quality - a Number between 0 and 1 indicating image quality (applicable to JPEG only),
        defaults to 1.0.
* @param {String} options.imagePlaceholder - dataURL to use as a placeholder for failed images, default behaviour is to fail fast on images we can't fetch
* @param {Boolean} options.cacheBust - set to true to cache bust by appending the time to the request url
* @return {Promise} - A promise that is fulfilled with a SVG image data URL
* */
export function toSvg(node, options) {
    options = options || {
        bgcolor: '#fff',
        width: null,
        height: null,
        style: null,
        quality: 0,
        imagePlaceholder: undefined,
        cacheBust: false,
    };
    return Promise.resolve(node)
        .then(function (node) {
            return cloneNode(node, options.filter, true);
        })
        // .then(embedFonts)
        // .then(inlineImages)
        .then(applyOptions)
        .then(function (clone) {
            return makeSvgDataUri(clone,
                options.width || util.width(node),
                options.height || util.height(node)
            );
        });


    function applyOptions(clone) {
        if (options.bgcolor) clone.style.backgroundColor = options.bgcolor;

        if (options.width) clone.style.width = options.width + 'px';
        if (options.height) clone.style.height = options.height + 'px';

        if (options.style)
            Object.keys(options.style).forEach(function (property) {
                clone.style[property] = options.style[property];
            });

        return clone;
    }
}


function cloneNode(node, filter, root: boolean) {
    if (!root && filter && !filter(node)) return Promise.resolve();

    return Promise.resolve(node)
        .then(makeNodeCopy)
        .then(function (clone) {
            return cloneChildren(node, clone, filter);
        })
        .then(function (clone) {
            return processClone(node, clone);
        });

    function makeNodeCopy(node) {
        // if (node instanceof HTMLCanvasElement) return util.makeImage(node.toDataURL());
        return node.cloneNode(false);
    }

    function cloneChildren(original, clone, filter) {
        var children = original.childNodes;
        if (children.length === 0) return Promise.resolve(clone);

        return cloneChildrenInOrder(clone, util.asArray(children), filter)
            .then(function () {
                return clone;
            });

        function cloneChildrenInOrder(parent, children, filter) {
            var done = Promise.resolve();
            children.forEach(function (child) {
                done = done
                    .then(function () {
                        // recursivity!
                        return cloneNode(child, filter, false);
                    })
                    .then(function (childClone) {
                        if (childClone) parent.appendChild(childClone);
                    });
            });
            return done;
        }
    }

    function processClone(original, clone) {
        if (!(clone instanceof Element)) return clone;

        return Promise.resolve()
            .then(cloneStyle)
            .then(clonePseudoElements)
            .then(copyUserInput)
            .then(fixSvg)
            .then(function () {
                return clone;
            });

        function cloneStyle() {
            copyStyle(window.getComputedStyle(original), clone.style);

            function copyStyle(source, target) {
                if (source.cssText) target.cssText = source.cssText;
                else copyProperties(source, target);

                function copyProperties(source, target) {
                    util.asArray(source).forEach(function (name) {
                        target.setProperty(
                            name,
                            source.getPropertyValue(name),
                            source.getPropertyPriority(name)
                        );
                    });
                }
            }
        }

        function clonePseudoElements() {
            [':before', ':after'].forEach(function (element) {
                clonePseudoElement(element);
            });

            function clonePseudoElement(element) {
                var style = window.getComputedStyle(original, element);
                var content = style.getPropertyValue('content');

                if (content === '' || content === 'none') return;

                var className = util.uid();
                clone.className = clone.className + ' ' + className;
                var styleElement = document.createElement('style');
                styleElement.appendChild(formatPseudoElementStyle(className, element, style));
                clone.appendChild(styleElement);

                function formatPseudoElementStyle(className, element, style) {
                    var selector = '.' + className + ':' + element;
                    var cssText = style.cssText ? formatCssText(style) : formatCssProperties(style);
                    return document.createTextNode(selector + '{' + cssText + '}');

                    function formatCssText(style) {
                        var content = style.getPropertyValue('content');
                        return style.cssText + ' content: ' + content + ';';
                    }

                    function formatCssProperties(style) {

                        return util.asArray(style)
                            .map(formatProperty)
                            .join('; ') + ';';

                        function formatProperty(name) {
                            return name + ': ' +
                                style.getPropertyValue(name) +
                                (style.getPropertyPriority(name) ? ' !important' : '');
                        }
                    }
                }
            }
        }

        function copyUserInput() {
            if (original instanceof HTMLTextAreaElement) clone.innerHTML = original.value;
            if (original instanceof HTMLInputElement) clone.setAttribute("value", original.value);
        }

        function fixSvg() {
            if (!(clone instanceof SVGElement)) return;
            clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            if (!(clone instanceof SVGRectElement)) return;
            ['width', 'height'].forEach(function (attribute) {
                var value = clone.getAttribute(attribute);
                if (!value) return;

                clone.style.setProperty(attribute, value);
            });
        }
    }
}


function makeSvgDataUri(node, width, height) {
    return Promise.resolve(node)
        .then(function (node) {
            node.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
            return new XMLSerializer().serializeToString(node);
        })
        .then(util.escapeXhtml)
        .then(function (xhtml) {
            return '<foreignObject x="0" y="0" width="100%" height="100%">' + xhtml + '</foreignObject>';
        })
        .then(function (foreignObject) {
            return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">' +
                foreignObject + '</svg>';
        })
        .then(function (svg) {
            return 'data:image/svg+xml;charset=utf-8,' + svg;
        });
}