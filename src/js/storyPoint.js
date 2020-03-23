const toArray = (nodes) => {
  return [].map.call(nodes, node => node);
}

const getProjectColumns = () => {
  return document.querySelectorAll('.project-column');
}

const getStoryPointLabels = (column, pattern) => {
  const cards = toArray(column.querySelectorAll('.issue-card'));
  const labels = cards.map(card =>
    JSON.parse(card.getAttribute('data-card-label')) || [],
  ).flat();
  return labels.filter(label => pattern.test(label));
}

const findOrCreateStoryPointConter = (column) => {
  const storyPointConter = column.querySelector('.js-column-story-point-count');
  if (storyPointConter) {
    return storyPointConter;
  } else {
    const newStoryPointCounter = document.createElement('span');
    newStoryPointCounter.classList.add('Counter');
    newStoryPointCounter.classList.add('Counter--green-light');
    newStoryPointCounter.classList.add('js-column-story-point-count');
    const columnHeader = column.querySelector('.js-details-container > .hide-sm');
    const cardCounter = column.querySelector('.js-column-card-count');
    columnHeader.insertBefore(newStoryPointCounter, cardCounter.nextSibling);
    return newStoryPointCounter;
  }
}

const setStoryPoint = (column, points) => {
  console.log(column, points);
  const storyPointConter = findOrCreateStoryPointConter(column);
  const suffix = points === 1 ? 'pt' : 'pts';
  storyPointConter.textContent = points + suffix;
}

const calculateStoryPoints = (column, pattern) => {
  const storyPointLabels = getStoryPointLabels(column, pattern);
  const storyPoints = storyPointLabels.reduce((total, storyPointLabel) => {
    return total + parseInt(pattern.exec(storyPointLabel)[1]);
  }, 0)
  setStoryPoint(column, storyPoints);
}

const calculateStoryPointsForEachColumns = (pattern) => {
  getProjectColumns().forEach(column => calculateStoryPoints(column, pattern));
}

// Auto calculate story points on change number of story point labels.
const setAutoCalculation = (pattern) => {
  const detect = (prev) => {
    const current = getStoryPointLabels(document, pattern).length;
    if (prev !== current) {
      calculateStoryPointsForEachColumns(pattern);
    }
    setTimeout(() => detect(current), 1000);
  }
  detect(0);
}

// GitHub Project columns are loaded as async.
// This function detect it finished.
const detectFinishToLoadCards = async (column) => {
  return new Promise(resolve => {
    let attempts = 0;
    const detect = (targetColumn) => {
      if (targetColumn.querySelector('.issue-card') || attempts >= 10) {
        return resolve(true);
      } else {
        attempts++;
        setTimeout(() => detect(targetColumn), 100);
      }
    }
    return detect(column);
  });
}

const initialize = (pattern) => {
  const columnContainer = document.querySelector('.project-columns-container');
  const calculate = () => { calculateStoryPointsForEachColumns(pattern) };
  columnContainer.ondragend = calculate;
  columnContainer.onclick = calculate;
  setAutoCalculation(pattern);
}

const getLabelPattern = async () => {
  const defaultPattern = '(\\d+)pts?';
  return new RegExp(defaultPattern);
}

(async () => {
  const pattern = await getLabelPattern();
  const projectColumns = toArray(getProjectColumns());
  await Promise.all(
    projectColumns.map(column => detectFinishToLoadCards(column))
  );
  // Detect story point labels. If does not detect labels, not to initialize it.
  const numOfPointLabels = projectColumns.reduce((total, column) => {
    return total + getStoryPointLabels(column, pattern).length;
  }, 0);
  if (numOfPointLabels > 0) {
    initialize(pattern);
  }
  return;
})();
