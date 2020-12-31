const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const dateFns = require('date-fns');
const YAML = require('yaml')

/**
 * @param {UserConfig} config Конфигурация
 */
function buildEleventyConfig(config) {
  
  config.setDataDeepMerge(true);
  
  config.addLayoutAlias('article', 'layouts/article.njk');
  
  config.addDataExtension('yaml', (content) => YAML.parse(content))
  
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
          tags.add(tagName)
        }
      }
    })
    
    return Array.from(tags.values())
  });
  
  // userConfig.addPlugin(syntaxHighlight);
  
  config.addPassthroughCopy('static');
  
  return {
    dir: {
      input: 'src',
      output: 'dist',
      dataTemplateEngine: 'njk'
    },
    templateFormats: [
      'md',
      'njk',
      'html'
    ],
    markdownTemplateEngine: 'liquid',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk'
  };
}

module.exports = buildEleventyConfig;
