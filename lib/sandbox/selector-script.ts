export const SELECTOR_SCRIPT = `
<script>
(function() {
  let selectionMode = false;
  let textEditMode = false;
  let highlightEl = null;
  let editingElement = null;
  let originalEditText = '';
  let editKeyHandler = null;

  const highlight = document.createElement('div');
  highlight.id = '__think_sel_hl__';
  highlight.style.cssText = 'position:fixed;pointer-events:none;z-index:999999;border:2px solid #3b82f6;background:rgba(59,130,246,0.1);transition:all 0.1s ease;display:none;';
  document.body.appendChild(highlight);

  function getSelector(el) {
    if (!el || el === document.body) return 'body';
    if (el.id) return '#' + CSS.escape(el.id);
    let path = [];
    let current = el;
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        path.unshift('#' + CSS.escape(current.id));
        break;
      }
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\\s+/).filter(c => !c.startsWith('__') && c !== '');
        if (classes.length > 0) {
          selector += '.' + classes.map(c => CSS.escape(c)).join('.');
        }
      }
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(s => s.tagName === current.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += ':nth-of-type(' + index + ')';
        }
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    return path.join(' > ');
  }

  function getElementInfo(el) {
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      classes: Array.from(el.classList).filter(c => !c.startsWith('__')).join('.'),
      text: (el.textContent || '').trim().slice(0, 60),
      selector: getSelector(el),
    };
  }

  function cancelEditing() {
    if (!editingElement) return;
    editingElement.textContent = originalEditText;
    editingElement.contentEditable = 'false';
    editingElement.style.outline = 'none';
    if (editKeyHandler) {
      editingElement.removeEventListener('keydown', editKeyHandler);
      editKeyHandler = null;
    }
    editingElement = null;
    originalEditText = '';
  }

  function saveAndPostEdit() {
    if (!editingElement) return;
    const newText = editingElement.textContent.trim();
    const oldText = originalEditText;
    const sel = getSelector(editingElement);
    editingElement.contentEditable = 'false';
    editingElement.style.outline = 'none';
    if (editKeyHandler) {
      editingElement.removeEventListener('keydown', editKeyHandler);
      editKeyHandler = null;
    }
    editingElement = null;
    originalEditText = '';
    if (newText !== oldText) {
      window.parent.postMessage({
        type: '__THINK_TEXT_SAVED__',
        oldText: oldText,
        newText: newText,
        selector: sel,
      }, '*');
    }
  }

  function startEditing(el) {
    if (editingElement) return;
    if (!el || el === document.body || el === document.documentElement) return;
    if (['INPUT','TEXTAREA','SELECT','BUTTON','A'].indexOf(el.tagName) !== -1) return;
    if (el.id === '__think_sel_hl__') return;

    originalEditText = el.textContent.trim();
    editingElement = el;
    el.contentEditable = 'true';
    el.style.outline = '2px solid #3b82f6';
    el.style.outlineOffset = '2px';
    el.focus();

    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditing();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        saveAndPostEdit();
      }
    }
    el.addEventListener('keydown', onKey);
    editKeyHandler = onKey;

    el.addEventListener('blur', function onBlur() {
      el.removeEventListener('blur', onBlur);
      setTimeout(function() {
        if (editingElement === el) {
          saveAndPostEdit();
        }
      }, 150);
    });
  }

  function onMouseMove(e) {
    if (!selectionMode && !textEditMode) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === highlightEl || el.id === '__think_sel_hl__') return;
    if (editingElement && editingElement.contains(el)) return;
    highlightEl = el;
    const rect = el.getBoundingClientRect();
    highlight.style.left = rect.left + 'px';
    highlight.style.top = rect.top + 'px';
    highlight.style.width = rect.width + 'px';
    highlight.style.height = rect.height + 'px';
    highlight.style.display = 'block';
  }

  function onDocumentClick(e) {
    if (selectionMode) {
      e.preventDefault();
      e.stopPropagation();
      const el = highlightEl || document.elementFromPoint(e.clientX, e.clientY);
      if (!el || el.id === '__think_sel_hl__') return;
      const info = getElementInfo(el);
      highlight.style.display = 'none';
      selectionMode = false;
      window.parent.postMessage({ type: '__THINK_SELECTOR_RESULT__', ...info }, '*');
    } else if (textEditMode) {
      if (editingElement) {
        saveAndPostEdit();
      }
      const el = highlightEl || document.elementFromPoint(e.clientX, e.clientY);
      if (!el || el.id === '__think_sel_hl__') return;
      e.preventDefault();
      e.stopPropagation();
      highlight.style.display = 'none';
      startEditing(el);
    }
  }

  // Register event handlers once on load — dispatch by mode flags
  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onDocumentClick, true);

  window.addEventListener('message', function(e) {
    if (e.data.type === '__THINK_SELECTOR_ENABLE__') {
      if (textEditMode) {
        if (editingElement) saveAndPostEdit();
        textEditMode = false;
      }
      selectionMode = true;
      document.body.style.cursor = 'crosshair';
    } else if (e.data.type === '__THINK_SELECTOR_DISABLE__') {
      selectionMode = false;
      highlight.style.display = 'none';
      document.body.style.cursor = '';
    } else if (e.data.type === '__THINK_TEXT_EDIT_ENABLE__') {
      if (selectionMode) {
        selectionMode = false;
      }
      textEditMode = true;
      highlight.style.display = 'none';
      document.body.style.cursor = 'text';
    } else if (e.data.type === '__THINK_TEXT_EDIT_DISABLE__') {
      textEditMode = false;
      if (editingElement) saveAndPostEdit();
      highlightEl = null;
      highlight.style.display = 'none';
      document.body.style.cursor = '';
    }
  });
})();
</script>`;
