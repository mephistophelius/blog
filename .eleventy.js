const eleventyPluginRss = require('@11ty/eleventy-plugin-rss');
const dateFns = require('date-fns');
const YAML = require('yaml');
const markdownIt = require('markdown-it');
const markdownItTitleAnchor = require('markdown-it-anchor');
const markdownItContainer = require('markdown-it-container');
const markdownItToc = require('markdown-it-table-of-contents');
const markdownItFootNote = require('@gerhobbelt/markdown-it-footnote');
const markdownItAttrs = require('markdown-it-attrs');
const markdownItTaskList = require('markdown-it-task-checkbox');

/**
 * @param {UserConfig} config Конфигурация
 */
function buildEleventyConfig(config) {
  
  config.addPlugin(eleventyPluginRss);
  
  config.setDataDeepMerge(true);
  
  config.addLayoutAlias('article', 'layouts/article.njk');
  
  config.addDataExtension('yaml', (content) => YAML.parse(content));
  
  config.addNunjucksFilter('date', (date) => {
    if (date instanceof Date) {
      return dateFns.format(date, 'yyyy-MM-dd');
    }
    
    if (typeof date === 'string' && dateFns.isMatch(date, 'yyyy-MM-dd')) {
      return dateFns.format(dateFns.parseISO(date), 'yyyy-MM-dd');
    }
  });
  
  config.addNunjucksFilter('head', (array, n) => {
    if (n < 0) {
      return array.slice(n);
    }
    
    return array.slice(0, n);
  });
  
  config.addNunjucksShortcode('comments', () => {
    return `<script
      src="https://utteranc.es/client.js"
      repo="mephistorine/blog"
      issue-term="pathname"
      label="Комментарий"
      theme="github-dark"
      crossorigin="anonymous"
      async>
    </script>`;
  });
  
  config.addNunjucksShortcode('youtube', (id) => {
    return `<section class="video-cintainer is-youtube-container">
      <iframe
        src="https://www.youtube.com/embed/${id}"
        frameborder="0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        style="width: 100%"
        allowfullscreen
      ></iframe>
    </section>`;
  });
  
  config.addNunjucksShortcode('vimeo', (id) => {
    return `<div style="position: relative;
    width: 100%;
    height: 0;
    padding-bottom: 56.25%; margin-bottom: 1rem;">
    <iframe src="https://player.vimeo.com/video/${id}" width="640" height="360" frameborder="0" allow="autoplay; fullscreen" allowfullscreen style="
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;"><p><a href="https://vimeo.com/${id}">Watch the video on Vimeo</a></p></iframe>
    </div>`;
  });
  
  config.addNunjucksFilter('readingTime', (content) => {
    const contentType = typeof content;
    
    if (contentType !== 'string') {
      throw new Error(`Wrong content type: ${contentType}`);
    }
    
    const words = content.replace(/(<([^>]+)>)/gi, '')
      .match(/[a-zA-Z]+|\S+\s*/g);
    
    /**
     * Средняя скорость чтения (слова в секунду)
     * @see https://en.wikipedia.org/wiki/Reading
     */
    const normalRedingSpeed = 3.4;
    
    const readingTimeInSeconds = words.length / 3.4;
    const readingTimeInMinutes = readingTimeInSeconds / 60;
    return Math.round(readingTimeInMinutes);
  });
  
  config.addCollection('articles', /** @param {TemplateCollection} templateCollection */(templateCollection) => {
    const articles = [];
    
    templateCollection.getAll().forEach((item) => {
      if ('type' in item.data) {
        if (item.data.type === 'article') {
          articles.push(item);
        }
      }
    });
    
    return articles;
  });
  
  config.addCollection('tags', /** @param {TemplateCollection} templateCollection */(templateCollection) => {
    
    const tags = [];
  
    templateCollection.getAll().forEach((item) => {
      if ('tags' in item.data) {
        for (const tagName of item.data.tags) {
          const tag = tags.find((tag) => tag.name === tagName)
          
          if (typeof tag !== 'undefined') {
            tag.articleCount = tag.articleCount + 1
            continue
          }
        
          tags.push({
            name: tagName,
            articleCount: 1
          })
        }
      }
    });
    
    return tags;
  });
  
  // userConfig.addPlugin(syntaxHighlight);
  
  config.addPassthroughCopy('static');
  
  const markdownParser = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true
  })
    .use(markdownItFootNote)
    .use(markdownItAttrs)
    .use(markdownItTaskList)
    .use(markdownItToc, {
      includeLevel: [2, 3, 4, 5, 6],
      listType: 'ol',
      containerHeaderHtml: `<h2>Содержание</h2>`,
      containerClass: `article-table-of-content`
    })
    .use(markdownItTitleAnchor, {
      permalink: true,
      permalinkClass: 'title-anchor',
      permalinkSymbol: '⌗'
    })
    .use(markdownItContainer, 'spoiler', {
      validate: function (params) {
        return params.trim().match(/^spoiler\s+(.*)$/);
      },
      
      render: function (tokens, idx) {
        var m = tokens[idx].info.trim().match(/^spoiler\s+(.*)$/);
        
        if (tokens[idx].nesting === 1) {
          // opening tag
          return '<details><summary>' + markdownParser.utils.escapeHtml(m[1]) + '</summary>\n';
          
        } else {
          // closing tag
          return '</details>\n';
        }
      },
      
      marker: '&'
    })
    .use(markdownItContainer, 'alert', {
      validate: function (params) {
        return params.trim().match(/^alert\s+(.*)$/);
      },
      
      render: function (tokens, idx) {
        const m = tokens[idx].info.trim().match(/^alert\s+(.*)$/);
        
        if (tokens[idx].nesting === 1) {
          return `<section class="alert ${markdownParser.utils.escapeHtml(m[1])}">\n`;
        } else {
          return `</section>\n`;
        }
      },
      
      marker: ':'
    });
  
  config.setLibrary('md', markdownParser);
  
  return {
    dir: {
      input: 'src',
      output: 'dist',
      dataTemplateEngine: 'njk'
    },
    templateFormats: [
      'md',
      'njk',
      'html',
      'liquid'
    ],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk'
  };
}

module.exports = buildEleventyConfig;
