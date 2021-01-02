const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const dateFns = require('date-fns');
const YAML = require('yaml');
const markdownIt = require('markdown-it');
const markdownItTitleAnchor = require('markdown-it-anchor');
const markdownItContainer = require('markdown-it-container');
const markdownItToc = require('markdown-it-table-of-contents');
const markdownItFootNote = require('@gerhobbelt/markdown-it-footnote');

/**
 * @param {UserConfig} config Конфигурация
 */
function buildEleventyConfig(config) {

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
    const tags = new Set();

    templateCollection.getAll().forEach((item) => {
      if ('tags' in item.data) {
        for (const tagName of item.data.tags) {
          tags.add(tagName);
        }
      }
    });

    return Array.from(tags.values());
  });

  // userConfig.addPlugin(syntaxHighlight);

  config.addPassthroughCopy('static');

  const markdownParser = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true
  })
    .use(markdownItKatex)
    .use(markdownItFootNote)
    .use(markdownItToc, {
      includeLevel: [ 2, 3, 4, 5, 6 ],
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
          return `<section class="alert ${markdownParser.utils.escapeHtml(m[1])}">\n`
        } else {
          return `</section>\n`
        }
      },

      marker: ':'
    })

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
    markdownTemplateEngine: 'liquid',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk'
  };
}

module.exports = buildEleventyConfig;
