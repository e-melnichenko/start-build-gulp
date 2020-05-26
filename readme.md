# Сборка

## Get started

    npm install

1. В папку *tmp/img* переместить изображения для html. svg для спрайта поместить в *tmp/img/icons*.

2. `gulp image:opt` - оптимизирует изображения и перемещает в  *src/assets/img*.

3. `gulp webp` - добавляет формат webp. Добавить `picturefill.js` для поддержки ie.

4. `gulp sprite` - генерирует спрайт. Имя файла становится id: 

          <svg class="social-buttons__icon social-buttons__icon--fb" width="10" height="19">
              <use xlink:href="img/sprite.svg#icon-fb"></use>
          </svg>  
    Подключить `svg4everybody.js` для поддержки ie.

5. `npm start` для разработки или `npm run build` для продакшн сборки. Happy hacking! :-) 


## Тонкие моменты  

### Стили  
`resolver` указывает правильные пути для изображений при импорте и проверяет хеширование изображений. Чтобы задача `styles` имела доступ к файлу манифеста, `styles:assets` должна быть уже выполнена.  

### js
Для сигнализации завершения первой сборки используется вызов *callback*. Иначе webpack watch подвешивает сборку. Gulp watch в данной ситуации менее эффективен. Для чанков, динамических импортов и тд требуется настройка публичных путей.  

### html
Должны быть завершены задачи `style`, `webpack` и `assets:images` для чтения имен файлов из манифеста.

### production  
Перед сборкой на продакшн директория `public` очищается. 

### Изображения в css  
Изображения хранятся раздельно в блоках, поэтому нет необходимости вычищать их из общей папки при удалении/обновлении блока. Для наглядности результата  оптимизация производится после написания стилей задачей `image:opt:styles`. Создается оптимизированная копия изображения с постфиксом **-opt** для проверки. После выявления оптимальных настроек оптимизированные копии изображений удаляются задачей `clean:styles:image`. Для замены оригиналов исключите из потока задачи `image:opt:styles` модуль *rename*.   

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