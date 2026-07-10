(() => {
  const COLORS = [
    { name: 'Vàng', value: '#fff59d' },
    { name: 'Xanh lá', value: '#c8f7c5' },
    { name: 'Xanh dương', value: '#b9e6ff' },
    { name: 'Hồng', value: '#ffd1e8' },
    { name: 'Tím', value: '#e3d0ff' }
  ];

  const storageKey = key => `highlight:${location.pathname}:${key}`;

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
  }

  function getHighlightTarget(range) {
    const container = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement
      : range.commonAncestorContainer;
    return container?.closest?.('[data-highlight-key]');
  }

  function saveTarget(target) {
    if (!target?.dataset.highlightKey) return;
    localStorage.setItem(storageKey(target.dataset.highlightKey), target.innerHTML);
  }

  function applyColor(color) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const target = getHighlightTarget(range);
    if (!target || !target.contains(range.commonAncestorContainer)) return;

    const mark = document.createElement('mark');
    mark.className = 'text-highlight';
    mark.style.backgroundColor = color;

    try {
      range.surroundContents(mark);
      saveTarget(target);
      selection.removeAllRanges();
    } catch {
      // Browser cannot wrap partial overlapping nodes; keep existing content unchanged.
    }
  }

  function clearSelectionHighlight() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const target = getHighlightTarget(range);
    if (!target) return;

    target.querySelectorAll('mark.text-highlight').forEach(mark => {
      if (!range.intersectsNode(mark)) return;
      mark.replaceWith(document.createTextNode(mark.textContent));
    });
    target.normalize();
    saveTarget(target);
    selection.removeAllRanges();
  }

  function createToolbar() {
    if (document.querySelector('.highlight-toolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'highlight-toolbar';
    toolbar.setAttribute('aria-label', 'Highlight tools');

    const label = document.createElement('span');
    label.textContent = 'Bút highlight';
    toolbar.appendChild(label);

    COLORS.forEach(color => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'highlight-color';
      button.title = color.name;
      button.style.backgroundColor = color.value;
      button.addEventListener('click', () => applyColor(color.value));
      toolbar.appendChild(button);
    });

    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.className = 'highlight-clear';
    clearButton.textContent = 'Xóa';
    clearButton.addEventListener('click', clearSelectionHighlight);
    toolbar.appendChild(clearButton);

    document.body.appendChild(toolbar);
  }

  window.HighlightTool = {
    setup() {
      createToolbar();
    },
    setText(element, key, text) {
      if (!element) return;
      element.dataset.highlightKey = key;
      element.innerHTML = localStorage.getItem(storageKey(key)) || escapeHtml(text);
    },
    clearElement(element) {
      if (!element) return;
      element.removeAttribute('data-highlight-key');
      element.textContent = '';
    }
  };

  document.addEventListener('DOMContentLoaded', () => window.HighlightTool.setup());
})();
