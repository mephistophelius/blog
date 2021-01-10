---
title: "Redux в Angular"
date: 2021-01-09
lastModifyDate: 2021-01-09
author: "Сэм Булатов"
tags: [ "angular", "rxjs", "ngrx", "redux" ]
commentsEnable: true
thumbnail: /static/articles/my-second-post/images/test.png
draft: true
---

### План

1. Что такое Redux?
2. Что такое NgRx?

## Предисловие

Когда я только пришел работать в проект, опыта ни с [Angular](https://anuglar.io), ни с [NgRx](https://ngrx.io) и в само собой с Redux тоже, но работать надо было 😀. Поэтому я сел изучать, как это работает и для чего это нужно.

В то время я как-то не додумался читать про [Redux](https://redux.js.org), а не про NgRx. Поэтому, достаточно, много информации не нашел, сейчас с этим лучше.

Мой коллега, который уже был в проекте, пытался мне объяснить что это за зверь такой (ngrx), но я что-то не понимал. Хотя сама идея до боли простая, что казалось несколько обидным, то что я не понял ее сразу.

В тот момент существовало серия статей моего бывшего коллеги о NgRx:

- [Реактивные приложения на Angular/NGRX. Часть 1. Введение.](https://medium.com/@demyanyuk/%D1%80%D0%B5%D0%B0%D0%BA%D1%82%D0%B8%D0%B2%D0%BD%D1%8B%D0%B5-%D0%BF%D1%80%D0%B8%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D1%8F-%D0%BD%D0%B0-angular-ngrx-%D1%87%D0%B0%D1%81%D1%82%D1%8C-1-cb7b4f2852dc)
- [Реактивные приложения на Angular/NGRX. Часть 2. Store.](https://medium.com/@independbear/%D1%80%D0%B5%D0%B0%D0%BA%D1%82%D0%B8%D0%B2%D0%BD%D1%8B%D0%B5-%D0%BF%D1%80%D0%B8%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D1%8F-%D0%BD%D0%B0-angular-ngrx-%D1%87%D0%B0%D1%81%D1%82%D1%8C-2-1412bc9adf17)
- [Реактивные приложения на Angular/NGRX. Часть 3. Effects.](https://medium.com/@independbear/%D1%80%D0%B5%D0%B0%D0%BA%D1%82%D0%B8%D0%B2%D0%BD%D1%8B%D0%B5-%D0%BF%D1%80%D0%B8%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D1%8F-%D0%BD%D0%B0-angular-ngrx-%D1%87%D0%B0%D1%81%D1%82%D1%8C-3-effects-6f4b34dfa289)

и доклад его же авторства:

- [Демянюк Игорь - Угловатый Redux. Реактивные приложения на Angular\NGRX](https://youtu.be/cjc6o1b9Rac)

самое забавное, то что тогда прочитав и посмотрев это все, я все равно мало что понял 🙂 (да, такой вот я). _Статьи и доклады на высоте_!

Концептуально, вся выше перечисленная информация до сих пор актуальна, изменилось только API самого ngrx.

А я в свою очередь решил что попытаюсь поведать о том что сам понял и как бы я хотел, чтобы мне объяснили как это работает и зачем нужно.

## Что такое Redux?

И так, все начинает с redux, те кто уже знаком с этой методологией, можете просто пройти к следующему заголовку.

Redux это методология управления состоянием. Она предоставляет вам единое хранилище данных (это может быть что угодно, но чаще все это [объект](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Object)). Таким образом вы можете распространять его по всему вашему приложению и управление состоянием станет в разы проще.

Думаю будет проще если я покажу код:

```typescript
interface Action {
  /**
   * Тип события, некая уникальная строка, в ней может содержаться что угодно
   */
  type: string
}

/**
 * Функция изменяющая состояние хранилища
 * @returns Возвращает новое состояние
 */
type Reducer<T> = (state: T, action: Action) => T

interface Store<T> {
  /**
   * Уведомляет хранилище о новом событии
   * @param action Событие
   */
  dispatch(action: Action): void

  /**
   * Возвращает хранилище
   */
  takeState(): T
}

/**
 * Фабрика создания хранилище
 *
 * @param reducer Функция-редуктор
 * @param initialState Изначальное значение хранилища
 */
function createStore<T>(reducer: Reducer<T>, initialState: T): Store<T> {
  let state: T = initialState

  return {
    dispatch: (action: Action) => {
      state = reducer(state, action)
    },
    takeState: () => state,
  }
}
```

источник: [Redux. Простой как грабли](https://habr.com/ru/post/439104/)

Собственно все! Без типизации и комментариев весь код занял бы всего __7 строк__!

## NgRx - Redux в Angular

