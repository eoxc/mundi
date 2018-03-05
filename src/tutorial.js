
import { Anno, AnnoButton } from 'anno.js/src/anno.litcoffee';
import i18next from './i18next';
import $ from 'jquery';

import 'anno.js/dist/anno.css';
import './tutorial.css';

export default function getTutorialWidget() {
  AnnoButton.DoneButton.text = i18next.t('Skip');
  AnnoButton.DoneButton.className = 'anno-btn-low-importance';

  const finishButton = $.extend(true, {}, AnnoButton.DoneButton);
  finishButton.text = i18next.t('End');

  AnnoButton.NextButton.text = i18next.t('Next');
  AnnoButton.BackButton.text = i18next.t('Back');


  const tutorialWidget = new Anno([
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
      onShow: () => {
        if (!$('#rightPanel button').hasClass('out')) {
          $('#rightPanel button')[0].click();
        }
        if (!$('#rightPanel .nav.nav-tabs :nth-child(1)').hasClass('active')) {
          $('#rightPanel .nav.nav-tabs :nth-child(1) a').click();
        }
      },
    },
    {
      target: '#leftPanel .side-panel-left',
      position: 'right',
      content: i18next.t('tutorial5'),
      buttons: [AnnoButton.BackButton, AnnoButton.DoneButton, AnnoButton.NextButton],
      onShow: () => {
        if (!$('#leftPanel button').hasClass('out')) {
          $('#leftPanel button')[0].click();
        }
        if (!$('#leftPanel .nav.nav-tabs :nth-child(1)').hasClass('active')) {
          $('#leftPanel .nav.nav-tabs :nth-child(1) a').click();
        }
      },
    },
    {
      target: '#leftPanel .side-panel-left',
      position: 'right',
      content: i18next.t('tutorial6'),
      buttons: [AnnoButton.BackButton, finishButton],
      onShow: () => {
        if (!$('#leftPanel button').hasClass('out')) {
          $('#leftPanel button')[0].click();
        }
        if (!$('#leftPanel .nav.nav-tabs :nth-child(2)').hasClass('active')) {
          $('#leftPanel .nav.nav-tabs :nth-child(2) a').click();
        }
      },
    },
  ]);

  return tutorialWidget;
}
