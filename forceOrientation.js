/* 
Copyright (C) 2012 Oliver Herdin https://github.com/DDJarod

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/**
 * @param {String} [_orientation='horizontal'] either 'horizontal' or 'vertical'. Both of which are saved as 
 *                                             constants forceOrientation.VERTICAL/HORIZONTAL
 * @param {Object}.[_options] options to overwrite defaults
 * @param {bool}   [_options.dontRotate] can be set to true to prevent the rotation of the body, for debugging
 * @param {Object} [_options.meta] the keys are the names and the properties are the content of meta elements
 *                                defaults: 'apple-mobile-web-app-capable': 'yes'
 *                                          'apple-mobile-web-app-status-bar-style': 'black-translucent'
 *                                          'format-detection': 'telephone=no'
 * @param {int}    [_options.devicePixelRatio] some devices (iPhone with retina display) render pages like they only had 
 *                                            half the resolution. Per default this is prevented, but you can re-enable
 *                                            it by supplying 1
 * @param {string} [_options.overflow] do we want scrollbars or force the screenresolution and remove the rest?
 *                                    defaults to 'hidden', reasonable other option: 'auto'
 */
function forceOrientation(_orientation, _options)
{
  "use strict"; // like it says, use strict
  // we will need this elements later on
  var body = document.querySelector('body'),
      head = document.querySelector('head'),
      html = document.querySelector('html'),
      metaViewport, // the viewport meta element
      metaElements = {},
      bodyWidth, bodyHeight,
      devicePixelRatio = ((_options && _options.devicePixelRation) || window.devicePixelRatio),
      vertical = (_orientation === forceOrientation.VERTICAL);

  // we need these css styles, otherwise this wont work (<- who would have guessed : )
  html.style.overflow = ((_options && _options.overflow) || 'hidden');
  body.style.position = 'absolute';
  body.style.overflow = html.style.overflow === 'hidden' ? 'hidden' : 'visible';
  body.style.top = 0;
  body.style.left = 0;
  body.style.margin = 0;
  body.style.padding = 0;

  // set iOs meta stuff to let the site work nicely in homescreenmode
  if (_options && _options.meta) 
  {
    metaElements['apple-mobile-web-app-capable'] = _options.meta['apple-mobile-web-app-capable'] || 'yes';
    metaElements['apple-mobile-web-app-status-bar-style'] = _options.meta['apple-mobile-web-app-status-bar-style'] || 'black-translucent';
    metaElements['format-detection'] = _options.meta['format-detection'] || 'telephone=no';
  }
  
  // viewport cannot be overwritten
  metaElements.viewport = 'width='+window.innerWidth+ ',height='+window.innerHeight+
                             ',maximum-scale=' + (1.0 / devicePixelRatio) + ',minimum-scale=' + (1.0 / devicePixelRatio);

  // set the meta stuff
  var name;
  for (name in metaElements)
  {
    var meta = document.createElement('meta');
    meta.setAttribute('name', name);
    meta.setAttribute('content', metaElements[name]);
    head.appendChild(meta);

    if (name === 'viewport')
    {
      metaViewport = meta;
    }
  }

  // the update function, will be triggered once to setup, and every time we rotate
  var updateOrientation = function()
  {
    // rotate the body into the desired position
    if (vertical)
    {
      body.style['-webkit-transform'] = 'rotate(-' + Math.abs((Math.abs(window.orientation) % 180)) + 'deg)';
    }
    else
    {
      body.style['-webkit-transform'] = 'rotate(-' + Math.abs((Math.abs(window.orientation) - 90)) + 'deg)';
    }

    // calculate the desired body dimensions
    if (vertical)
    {
      bodyWidth = Math.min(window.innerHeight, window.innerWidth);
      bodyHeight = Math.max(window.innerHeight, window.innerWidth);
    }
    else
    {
      bodyWidth = Math.max(window.innerHeight, window.innerWidth);
      bodyHeight = Math.min(window.innerHeight, window.innerWidth);
    }

    // the html base element should have the same dimensions as the screen area we can use
    html.style.height = window.innerHeight + 'px';
    html.style.width = window.innerWidth + 'px';

    // the body is the element were our stuff is rendere to. This is what we want to rotate.
    // Set its size to the size out application uses
    body.style.height = bodyHeight + 'px';
    body.style.width = bodyWidth + 'px';

    // For the case where we force the body to rotate, the normal body is to large for the html in one dimension
    // to not increase the size of the html in that dimension, we shift the body to the left/top (depending on rotation)
    var left = Math.min(0, window.innerWidth - bodyWidth),
        top = Math.min(0, window.innerHeight - bodyHeight);

    if (vertical) 
    {
      body.style.top = top + 'px';
    } else 
    {
      body.style.left = left + 'px';
    }

    // We rotate a rectangle in another rectangle, which means the after the rotation the borders dont align.
    // To fix, we calculate by how much they wont align and then transform the element.
    // This step is purely cosmetic and wont change dimensions of DOM elements
    var translateOffsetY = Math.abs((bodyWidth - window.innerWidth) / 2.0),
        translateOffsetX = Math.abs((bodyHeight - window.innerHeight) / 2.0);

    if (_options && _options.dontRotate) 
    {
      body.style['-webkit-transform'] = '';
    } 
    else 
    {
      body.style['-webkit-transform'] = body.style['-webkit-transform'] + ' translate(-' + translateOffsetX + 'px, ' + translateOffsetY + 'px)';
    }

    // Reset the viewport with the newly generated dimensions. This will force the size recalculation of the html element (dont ask me why ..)
    metaViewport.setAttribute(
      'content',
      'width='+window.innerWidth+',height='+window.innerHeight+',maximum-scale='+(1.0/devicePixelRatio)+',minimum-scale='+(1.0/devicePixelRatio)
    );

    // scroll to the top left of the page
    body.scrollLeft = 0;
    body.scrollTop = 0;
  };

  // call once to set up
  setTimeout(updateOrientation, 1);

  // bind to the rotate event
  window.onorientationchange = updateOrientation;
}

forceOrientation.VERTICAL = 'vertical';
forceOrientation.HORIZONTAL = 'horizontal';