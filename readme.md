# Сборка

## Getting started

    npm install

1. В папку *src/assets/img* переместить изображения для html. svg для спрайта поместить в *tmp/icons*.

2. `gulp webp` - добавляет формат webp. `picturefill.js` для поддержки ie уже добавлен в `index.html`.

3. `gulp sprite` - генерирует спрайт. Имя файла становится id: 

          <svg class="social-buttons__icon social-buttons__icon--fb" width="10" height="19">
              <use xlink:href="img/sprite.svg#icon-fb"></use>
          </svg>  
    `svg4everybody.js` для поддержки ie уже подключен в `index.html`.

4. `npm start` для разработки или `npm run build` для продакшн сборки (на macOS/Linux в `package.json` замените `"build": "set NODE_ENV=production && gulp prod"` на `"build": "NODE_ENV=production gulp prod"`). Happy hacking! :-) 


## Тонкие моменты  

### Стили  
Изображения для стилей хранятся в папках блоков. Функция `resolver` указывает правильные пути для изображений при импорте и проверяет хеширование. Чтобы задача `styles` имела доступ к файлу манифеста, `styles:assets` должна быть уже выполнена.  

### js
Для сигнализации завершения первой сборки используется вызов *callback*. Иначе webpack watch подвешивает сборку. Gulp watch в данной ситуации менее эффективен. Для чанков, динамических импортов и тд требуется настройка публичных путей.  

### html
Должны быть завершены задачи `style`, `webpack` и `assets:images` для чтения имен файлов из манифеста.

### production  
Перед сборкой на продакшн директория `public` очищается. Изображения,  файлы `main.js` и `style.css` кэшируются.

### Оптимизация изображений
 Для наглядности результата  оптимизация производится после написания кода сайта. Задача `images:opt` создает оптимизированные копии изображений с постфиксом **-opt** для проверки. После выявления оптимальных настроек оптимизированные копии изображений удаляются задачей `images:clean:opt`. Для замены оригиналов исключите из потока задачи `images:clean:opt` модуль *rename*.   

# Модальное окно

    <div class="shim-container shim-container--active">
      <div class="modal-outter-wrap">
        <div class="modal">
          <p>text</p>
          <button class="modal__button">bottom</button>
        </div>
      </div>
    </div>  

    .modal {
        position: relative;
        min-width: 100%;

        background-color: lightsalmon;
    }

    .modal__button {
        position: fixed;
        bottom: 20px;
        left: calc(50% - 40px);
    }

    @media (min-width: 768px) {
        .modal {
            min-width: auto;
            width: 500px;
            margin: 10px;
        }

        .modal__button {
            position: static;
        }
    }

На *body* повесить `overflow: hidden` и скомпенсировать полосу прокрутки.