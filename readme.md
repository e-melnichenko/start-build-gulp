

# Getting started

    npm install
    npm start

# Сборка

1. В папку *src/assets/img* переместить изображения для html. svg для спрайта поместить в *tmp/sprite-icons*.

2. `gulp webp` - добавляет формат webp. `picturefill.js` для поддержки ie уже добавлен в `main.js`.

3. `gulp sprite` - генерирует спрайт. Имя файла становится id: 

          <svg class="social-buttons__icon social-buttons__icon--fb" width="10" height="19">
              <use xlink:href="img/sprite.svg#icon-fb"></use>
          </svg>  
    `svg4everybody.js` для поддержки ie уже подключен в `index.html`.

4. `npm start` для разработки или `npm run build` для продакшн сборки (на macOS/Linux в `package.json` замените `"build": "set NODE_ENV=production && gulp prod"` на `"build": "NODE_ENV=production gulp prod"`).

5. Для сравнения с макетом используется pixel-glass. Поместить изображения в папку `tmp/preview` и отредактировать `<head>`. 


## Тонкие моменты  

### Стили  
Изображения для стилей хранятся в папках блоков. Функция `resolver` указывает правильные пути для изображений при импорте и проверяет хеширование. Чтобы задача `styles` имела доступ к файлу манифеста, `styles:assets` должна быть уже выполнена.  

### js
Для сигнализации завершения первой сборки используется вызов callback. Иначе webpack watch подвешивает сборку. Gulp watch в данной ситуации менее эффективен. Для чанков, динамических импортов и тд требуется настройка публичных путей. В  main.js  добавлен полифил для метода  closest  в ie11.Для поддержки браузеров из browserslist нужно в файле `.babelrc` изменить `useBuiltIns` на `usage`.

### html
Должны быть завершены задачи `style`, `webpack` и `assets:images` для чтения имен файлов из манифеста.

### production  
Перед сборкой на продакшн директория `public` очищается. Изображения,  файлы `main.js` и `style.css` кэшируются.

### Оптимизация изображений
 Для наглядности результата  оптимизация производится после написания кода сайта. Задача `images:opt` создает оптимизированные копии изображений с постфиксом **-opt** для проверки. После выявления оптимальных настроек оптимизированные копии изображений удаляются задачей `images:clean:opt`. Для замены оригиналов исключите из потока задачи `images:clean:opt` модуль *rename*.   

# Модальное окно

    <button data-open-modal  data-target="my-modal">show modal</button>
    <div class="modal" id="my-modal" data-modal>
        <div class="modal__inner" id="my-modal">
            <button data-close-modal>close</button>
            <!-- content -->
        </div>  
    </div>

js и стили уже включены в сборку.