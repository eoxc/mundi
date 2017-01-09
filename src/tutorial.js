import { Anno, AnnoButton } from 'anno.js/src/anno.litcoffee';

require('anno.js/dist/anno.css');
require('./tutorial.css');

AnnoButton.DoneButton.text = 'Skip';
AnnoButton.DoneButton.className = 'anno-btn-low-importance';

const annoWidget = new Anno([
  {
    target: '.ol-viewport',
    position: 'center-top',
    className: 'complete-page-tag',
    content: `Welcome! It seems this is your first time here. This is a short
      introduction to the functionalities of this service. You can skip this at
      any point by clicking the Skip button.`,
    buttons: [AnnoButton.DoneButton, AnnoButton.Next],
    onShow: (anno, $target, $annoElem) => {
      $annoElem.find('.anno-arrow').hide();
    },
  },
  {
    target: '.ol-viewport',
    position: 'center-top',
    className: 'complete-page-tag',
    content: `This is the map tool which displays available data and their 
      location. It is interactive, i.e. you can pan by clicking and dragging 
      with the mouse and zoom in and out with the mouse wheel (or the + and - 
      buttons at the bottom right).`,
    buttons: [AnnoButton.BackButton, AnnoButton.DoneButton, AnnoButton.Next],
  },
  {
    target: '#timeSlider',
    position: 'center-top',
    content: `This is the Interactive time line selection (we also refer to it 
      as time slider). It displays the available data as points or bars, or 
      as histogramm bars when there are many datasets. You can select the 
      time you are interested in by clicking and dragging in the top area of 
      the timeslider. This will update the map as well as the result list. You 
      can also zoom in/out with your mouse wheel, as well as move the time 
      domain (i.e. pan) by clicking and dragging at the bottom area.`,
    buttons: [AnnoButton.BackButton, AnnoButton.DoneButton, AnnoButton.Next],
  },
  {
    target: '.side-panel-right.scrollbar-inner',
    position: 'left',
    content: `This is the result list. It displays the available data based on 
      the selected time in the time slider and the area currently shown by the 
      map tool. From here you can directly select and download the data you 
      are interested in.`,
    buttons: [AnnoButton.BackButton, AnnoButton.DoneButton, AnnoButton.Next],
    onHide: () => {
      if (!$('.btn.btn-default.toggle-side-panel.toggle-side-panel-left.toggle-side-panel-out').hasClass('out')){
        $('.btn.btn-default.toggle-side-panel.toggle-side-panel-left.toggle-side-panel-out').click();
      }
    },
  },
  {
    target: '.side-panel-left.scrollbar-inner',
    position: 'right',
    content: 'This opens a panel where you can configure filters for multiple paramaters',
    buttons: [AnnoButton.BackButton, AnnoButton.DoneButton, AnnoButton.Next],
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