
import { Anno, AnnoButton } from 'anno.js/src/anno.litcoffee';
import i18next from 'i18next';

import 'anno.js/dist/anno.css';
import './tutorial.css';


AnnoButton.DoneButton.text = i18next.t('Skip');

const finishButton = $.extend(true, {}, AnnoButton.DoneButton);
finishButton.text = i18next.t('End');

AnnoButton.NextButton.text = i18next.t('Next');
AnnoButton.DoneButton.className = 'anno-btn-low-importance';

AnnoButton.BackButton.text = i18next.t('Back');

const annoWidget = new Anno([
  {
    target: '.ol-viewport',
    position: 'center-top',
    className: 'complete-page-tag',
    content: i18next.t('tutorial1'),
    buttons: [AnnoButton.DoneButton, AnnoButton.NextButton],
    onShow: (anno, $target, $annoElem) => {
      $annoElem.find('.anno-arrow').hide();
    },
  },
  {
    target: '.ol-viewport',
    position: 'center-top',
    className: 'complete-page-tag',
    content: i18next.t('tutorial2'),
    buttons: [AnnoButton.BackButton, AnnoButton.DoneButton, AnnoButton.NextButton],
  },
  {
    target: '#timeSlider',
    position: 'center-top',
    content: i18next.t('tutorial3'),
    buttons: [AnnoButton.BackButton, AnnoButton.DoneButton, AnnoButton.NextButton],
  },
  {
    target: '#rightPanel .side-panel-right',
    position: 'left',
    content: i18next.t('tutorial4'),
    buttons: [AnnoButton.BackButton, AnnoButton.DoneButton, AnnoButton.NextButton],
    onHide: () => {
      if (!$('.btn.btn-default.toggle-side-panel.toggle-side-panel-left.toggle-side-panel-out').hasClass('out')){
        $('.btn.btn-default.toggle-side-panel.toggle-side-panel-left.toggle-side-panel-out').click();
      }
    },
  },
  {
    target: '#leftPanel .side-panel-left',
    position: 'right',
    content: i18next.t('tutorial5'),
    buttons: [AnnoButton.BackButton, finishButton],
  },
]);

// Open tutorial automatically if it is the first visit
if (typeof (Storage) !== 'undefined') {
  if (localStorage.getItem('firstVisit') === null) {
    annoWidget.show();
    localStorage.setItem('firstVisit', false);
  }
}


$('.ol-attribution').append(
  `<button type="button" title="Tutorial" id="tutorial" style="float:right;">
    <span>
      <i style="font-size:0.8em;" class="fa fa-book" aria-hidden="true"></i>
    </span>
  </button>`
);

$('#tutorial').click(() => {
  annoWidget.show();
});