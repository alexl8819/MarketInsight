/**
 * components/article.js - Article component
 * Copyright (C) 2018  idealwebsolutions
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
**/
const Image = require('react-image-resizer').default;
const PropTypes = require('prop-types');
const strftime = require('strftime');
const h = require('react-hyperscript');

const { PLACEHOLDER_32X32_NEWS_ICON } = require('../../../../lib/constants');

const Article = (props) => {
  const { article, index } = props;
  return h('article.media', length > 1 ? {
    key: Date.now() + index
  } : {}, [
    h('figure.media-left', {},
      h('div.image', {}, 
        h(Image, {
          alt: article.headline,
          src: article.image,
          noImageSrc: PLACEHOLDER_32X32_NEWS_ICON,
          height: 28,
          width: 28
        })
      )
    ),
    h('div.media-content', {}, 
      h('div.content', {}, 
        h('p', {}, [
          h('strong', {}, 
            h('a', { 
              href: article.url,
              target: '_blank'
            }, article.headline)
          ),
          h('br', {}),
          h('small', {}, 
            `by ${article.source} on ${strftime('%Y-%m-%d %I:%M %p', new Date(article.datetime))}`
          )
        ])
      )
    )
  ]);
};

Article.propTypes = {
  article: PropTypes.exact({
    headline: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    source: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    datetime: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ])
  })
};

module.exports = Article;
