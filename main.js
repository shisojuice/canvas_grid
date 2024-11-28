import * as PIXI from 'pixi.js';
const app = new PIXI.Application();

const colCount = Number(100);
const rowCount = Number(100);
const cellWidth = Number(60);
const cellHeight = Number(20);
const gridWidth = cellWidth * colCount;
const gridHeight = cellHeight * rowCount;

const canvas_id = 'app_pixigrid';
const _Graphics = '_Graphics';
const _TextGraphics = '_TextGraphics';

// GridのFocus
let last_focus_lbl = null;
const focus_input = document.createElement('input');
focus_input.id = canvas_id + '_focus';
focus_input.autocomplete = 'off';
focus_input.spellcheck = false;

window.onload = async () => {
  await app.init({
    width: gridWidth,
    height: gridHeight,
    backgroundAlpha: 0
  });
  app.canvas.id = 'maincanvas';
  app.stage.interactive = true;
  app.stage.hitArea = app.renderer.screen;
  document.getElementById(canvas_id).appendChild(app.canvas);
  document.getElementById('maincanvas').style.backgroundSize = `${cellWidth}px ${cellHeight}px`;
  for (let col = 0; col < colCount; col++) {
    for (let row = 0; row < rowCount; row++) {
      const txt = col + '-' + row;
      const container = createDetailCellContainer(col, row, txt);
      app.stage.addChild(container);
    }
  }
  detailCellFocus(0, 0); // InitFocus
}


/**
 * Detail部のCellをCreateする関数です。
 * @param {number} index_column CellColumnIndex
 * @param {number} index_row CellRowIndex
 * @param {string} txt CellText
 * @returns {PIXI.Container} PIXI.Container(Cell)を返す
 */
const createDetailCellContainer = (index_column, index_row, txt) => {
  // Object群作成
  let obj = new PIXI.Graphics()
    .rect(index_column * cellWidth, index_row * cellHeight, cellWidth, cellHeight)
    .fill(0xffffff);
  obj.alpha = 0.0;
  obj.label = _Graphics;
  obj.interactive = true;
  obj.buttonMode = true;
  let text = new PIXI.Text({
    text: txt,
    style: new PIXI.TextStyle({
      fontFamily: 'monospace',
      fontSize: cellHeight - 4,
      fill: 0xffffff,
    })
  })
  text.label = _TextGraphics;
  text.x = index_column * cellWidth + 4;
  text.y = index_row * cellHeight;
  text.interactive = true;
  text.buttonMode = true;
  const bounds = text.getBounds();
  if (cellWidth < bounds.width) {
    let temptext = '';
    let maxHalfWords = Math.floor(cellWidth / Math.floor(cellHeight / 2));
    for (let i = 0; i < txt.length; i++) {
      if (/^[a-zA-Z0-9!-/:-@\[-`{-~ｧ-ﾝﾞﾟ]+$/.test(txt[i])) {
        maxHalfWords = maxHalfWords - 1;
      }
      else {
        maxHalfWords = maxHalfWords - 2;
      }
      if (maxHalfWords < 0) {
        break;
      }
      temptext += txt[i];
    }
    text.text = temptext
  }
  obj.on('pointerover', (e) => { txthover(txt); });
  text.on('pointerover', (e) => { txthover(txt); });
  obj.on('pointerdown', (e) => {
    detailCellFocus(index_column, index_row);
  });
  text.on('pointerdown', (e) => {
    detailCellFocus(index_column, index_row);
  });
  // Container作成
  const lbl = `col${index_column}row${index_row}`;
  const container = new PIXI.Container();
  container.zIndex = 1;
  container.label = lbl;
  container.my_col = index_column;
  container.my_row = index_row;
  container.my_txt = txt;
  container.addChild(obj);
  container.addChild(text);
  return container;
}


/**
 * CellのHover時にTextのTitleを表示する関数です。
 * @param {string} txt CellText
 */
const txthover = (txt) => {
  document.getElementById(canvas_id).title = txt;
}


/**
 * Detail部のCellをFocusする関数です。
 * @param {number} index_column CellColumnIndex
 * @param {number} index_row CellRowIndex
 */
const detailCellFocus = (index_column, index_row) => {
  detailCellBlur();
  let targetcontainer = app.stage.getChildByLabel(`col${index_column}row${index_row}`);
  if (targetcontainer) {
    // HTMLInputFocus
    focus_input.value = targetcontainer.my_txt; focus_input.title = targetcontainer.my_txt;
    focus_input.dataset.my_col = targetcontainer.my_col; focus_input.dataset.my_row = targetcontainer.my_row;
    focus_input.style.width = (cellWidth - 8) + 'px'; focus_input.style.height = (cellHeight - 6) + 'px';
    const rect = document.getElementById(canvas_id).getBoundingClientRect();
    const scr_left = document.getElementById(canvas_id).scrollLeft;
    const scr_top = document.getElementById(canvas_id).scrollTop;
    focus_input.style.top = ((targetcontainer.my_row * cellHeight) + rect.top - scr_top) + 'px'; focus_input.style.left = ((targetcontainer.my_col * cellWidth) + rect.left - scr_left) + 'px';
    document.getElementById(canvas_id).appendChild(focus_input);
    requestAnimationFrame(() => {
      focus_input.focus();
      focus_input.select();
    });
  }
}

/**
 * Detail部のCellをBlurする関数です。
 */
const detailCellBlur = () => {
  last_focus_lbl = `col${focus_input.dataset.my_col}row${focus_input.dataset.my_row}`;
  const targetcontainer = app.stage.getChildByLabel(last_focus_lbl);
  if (targetcontainer) {
    targetcontainer.destroy({ children: true, texture: true, textureSource: true, context: true });
  }
  const container = createDetailCellContainer(focus_input.dataset.my_col, focus_input.dataset.my_row, focus_input.value);
  app.stage.addChild(container);
  focus_input.blur();
  focus_input.remove();
}

focus_input.addEventListener('blur', () => { detailCellBlur(); });

focus_input.addEventListener('keydown', (e) => {
  const rowix = Number(e.target.dataset.my_row);
  const colix = Number(e.target.dataset.my_col);
  if (e.key == 'Tab' && e.shiftKey == false) {
    e.preventDefault();
    const next_rowix = Number(rowix + 1);
    const next_colix = Number(colix + 1);
    if (next_colix < colCount) {
      detailCellFocus(next_colix, rowix);
    } else {
      if (next_rowix < rowCount) {
        detailCellFocus(0, next_rowix);
      }
      else {
        detailCellFocus(0, 0);
      }
    }
  }
  if (e.key == 'Tab' && e.shiftKey == true) {
    e.preventDefault();
    const next_rowix = Number(rowix - 1);
    const next_colix = Number(colix - 1);
    if (next_colix >= 0) {
      detailCellFocus(next_colix, rowix);
    } else {
      if (next_rowix >= 0) {
        detailCellFocus(Number(colCount - 1), next_rowix);
      }
      else {
        detailCellFocus(Number(colCount - 1), Number(rowCount - 1));
      }
    }
  }
  if (e.key == 'ArrowLeft') {
    e.preventDefault();
    const next_colix = Number(colix - 1);
    if (next_colix >= 0) {
      detailCellFocus(next_colix, rowix);
    } else {
      detailCellFocus(Number(colCount - 1), rowix);
    }
  }
  if (e.key == 'ArrowRight') {
    e.preventDefault();
    const next_colix = Number(colix + 1);
    if (next_colix < colCount) {
      detailCellFocus(next_colix, rowix);
    } else {
      detailCellFocus(0, rowix);
    }
  }
  if (e.key == 'ArrowUp') {
    e.preventDefault();
    const next_rowix = Number(rowix - 1);
    if (next_rowix >= 0) {
      detailCellFocus(colix, next_rowix);
    }
    else {
      detailCellFocus(colix, Number(rowCount - 1));
    }
  }
  if (e.key == 'ArrowDown') {
    e.preventDefault();
    const next_rowix = Number(rowix + 1);
    if (next_rowix < rowCount) {
      detailCellFocus(colix, next_rowix);
    }
    else {
      detailCellFocus(colix, 0);
    }
  }
});

/**
 * Detail部のCellFocusを追従する関数です。
 */
document.getElementById(canvas_id).addEventListener('scroll', (e) => {
  if (document.getElementById(canvas_id).contains(focus_input)) {
    requestAnimationFrame(() => {
      detailCellFocus(focus_input.dataset.my_col, focus_input.dataset.my_row);
    });
  }
});
