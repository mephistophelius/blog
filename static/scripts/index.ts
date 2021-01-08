import { fromEvent, merge, Observable } from 'rxjs'
import { ajax, AjaxResponse } from 'rxjs/ajax'
import { delay, filter, map, pluck, shareReplay, switchMap } from 'rxjs/operators'

interface AllData {
  data: SiteData
}

interface SiteData {
  articles: Article[]
  tags: string[]
}

interface Article {
  slug: string
  url: string
  title: string
  contentHtml: string
  createDate: string
  lastModifyDate: string
  tags: string[]
}

interface SearchResult {
  articles: Article[]
  tags: string[]
}

interface SearchResultValue {
  url: string
  label: string
}

function takeSearchResultSection(title: string, values: SearchResultValue[]): string {
  return `<section class="search-result-section">
    <h4 class="search-result-title">${ title }</h4>
    <div class="search-result-content">
      <ul>
        ${ values.map((value) => `<li><a href="${ value.url }">${ value.label }</a></li>`).join('') }
      </ul>
    </div>
  </section>`
}

function onLoadWindow() {
  const searchInputRef: HTMLInputElement = document.querySelector('.search-input')
  const searchResultsContainerRef: HTMLDivElement = document.querySelector('.search-results-container')

  const siteData: Observable<AllData> = ajax({
    url: '/all-data.json',
    responseType: 'json'
  }).pipe(
    map((response: AjaxResponse) => response.response),
    shareReplay(1)
  )

  const searchValueChanges: Observable<string> = fromEvent(searchInputRef, 'input').pipe(
    map(() => searchInputRef.value)
  )

  const onBlurSearchInput: Observable<boolean> = fromEvent(searchInputRef, 'blur').pipe(
    delay(300),
    map(() => true)
  )

  const onFocusSearchInput: Observable<boolean> = fromEvent(searchInputRef, 'focus').pipe(
    filter(() => searchInputRef.value !== '' && searchInputRef.value !== null),
    map(() => false)
  )

  const isHideSearchContainer: Observable<boolean> = searchValueChanges.pipe(
    map((value: string) => value === null || value === '')
  )

  const searchResult: Observable<{ articles: Article[], tags: string[] }> = searchValueChanges.pipe(
    filter((value: string) => value !== '' && value !== null),
    switchMap((searchValue: string) => {
      const preparedSearchValue: string = searchValue.toLowerCase()

      return siteData.pipe(
        pluck('data'),
        map((siteData: SiteData) => {
          const foundArticles: Article[] = siteData.articles.filter((article: Article) => {
            return article.title.toLowerCase().includes(preparedSearchValue)
              || article.contentHtml.replace(/(<([^>]+)>)/gi, '').toLowerCase().includes(preparedSearchValue)
          })

          const foundTags: string[] = siteData.tags.filter((tagName: string) => {
            return tagName.toLowerCase().includes(preparedSearchValue)
          })

          return { articles: foundArticles, tags: foundTags }
        })
      )
    })
  )

  searchResult.subscribe((result) => {
    const sections = []

    if (result.articles.length > 0) {
      const articleResultValues = result.articles.map<SearchResultValue>((article) => ({
        url: `/articles/${ article.slug }`,
        label: article.title
      }))

      sections.push(takeSearchResultSection('Статьи', articleResultValues))
    }

    if (result.tags.length > 0) {
      const tagResultValues = result.tags.map<SearchResultValue>((tag) => ({
        url: `/tags/${ tag }`,
        label: tag
      }))

      sections.push(takeSearchResultSection('Метки', tagResultValues))
    }

    searchResultsContainerRef.innerHTML = sections.join('')
  })

  merge(isHideSearchContainer, onBlurSearchInput, onFocusSearchInput).subscribe((isHide: boolean) => {
    if (!isHide) {
      searchResultsContainerRef.removeAttribute('hidden')
    } else {
      searchResultsContainerRef.setAttribute('hidden', '')
    }
  })

}

fromEvent(window, 'load').subscribe(() => onLoadWindow())
