const API_BASE = window.__SNAPCAL_API__ || `${window.location.origin}/api`;

const state = {
  entries: [],
  selectedFile: null,
  previewUrl: null,
  loading: false,
  error: null,
};

const appEl = document.getElementById('app');

const createHistoryCard = (entry) => {
  const micronutrients = entry.micronutrients
    ?.map((item) => `<li>${item.name} · ${item.amount}</li>`)?.join('') || '';
  const recommendations = entry.recommendations
    ?.map((tip) => `<li>${tip}</li>`)
    .join('');

  return `
    <article class="history-card">
      <header>
        <div>
          <strong>${entry.mealName}</strong>
          <p>${new Date(entry.consumedAt).toLocaleString()}</p>
        </div>
        <span class="badge">${entry.calories} kcal</span>
      </header>
      <p>${entry.mealSummary}</p>
      <div class="analysis-panel">
        <div class="metric">
          <h3>Protein</h3>
          <strong>${entry.macronutrients?.proteinGrams ?? 0} g</strong>
        </div>
        <div class="metric">
          <h3>Carbs</h3>
          <strong>${entry.macronutrients?.carbsGrams ?? 0} g</strong>
        </div>
        <div class="metric">
          <h3>Fat</h3>
          <strong>${entry.macronutrients?.fatGrams ?? 0} g</strong>
        </div>
        <div class="metric">
          <h3>Fiber</h3>
          <strong>${entry.macronutrients?.fiberGrams ?? 0} g</strong>
        </div>
      </div>
      <ul class="micronutrients">${micronutrients}</ul>
      <div>
        <h4>Recommendations</h4>
        <ul class="recommendations">${recommendations}</ul>
      </div>
    </article>
  `;
};

const renderHistory = () => {
  const historyEl = document.getElementById('historyList');
  if (!historyEl) return;
  if (!state.entries.length) {
    historyEl.innerHTML = '<p>No meals tracked yet. Upload a food photo to get started.</p>';
    return;
  }
  historyEl.innerHTML = state.entries.map(createHistoryCard).join('');
};

const renderAnalysisPanel = () => {
  const panel = document.getElementById('analysisPanel');
  if (!panel) return;
  if (!state.entries.length) {
    panel.innerHTML = '<p>Upload a meal photo to unlock AI-powered nutrition insights.</p>';
    return;
  }
  const latest = state.entries[0];
  panel.innerHTML = `
    <div class="analysis-panel">
      <div class="metric"><h3>Calories</h3><strong>${latest.calories} kcal</strong></div>
      <div class="metric"><h3>Protein</h3><strong>${latest.macronutrients?.proteinGrams ?? 0} g</strong></div>
      <div class="metric"><h3>Carbs</h3><strong>${latest.macronutrients?.carbsGrams ?? 0} g</strong></div>
      <div class="metric"><h3>Fat</h3><strong>${latest.macronutrients?.fatGrams ?? 0} g</strong></div>
      <div class="metric"><h3>Fiber</h3><strong>${latest.macronutrients?.fiberGrams ?? 0} g</strong></div>
    </div>
    <p style="margin-top:1rem">${latest.mealSummary}</p>
  `;
};

const setStatus = (message, isError = false) => {
  const statusEl = document.getElementById('status');
  if (!statusEl) return;
  statusEl.textContent = message || '';
  statusEl.className = `status ${isError ? 'error' : ''}`;
};

const bindUploaderEvents = () => {
  const dropZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const preview = document.getElementById('preview');

  const updatePreview = (file) => {
    if (!file) {
      preview.innerHTML = '<p>Drag & drop a food photo or browse files.</p>';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      state.previewUrl = e.target.result;
      preview.innerHTML = `<img src="${state.previewUrl}" alt="Meal preview" />`;
    };
    reader.readAsDataURL(file);
  };

  const handleFiles = (fileList) => {
    if (!fileList?.length) return;
    const [file] = fileList;
    state.selectedFile = file;
    updatePreview(file);
  };

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (evt) => {
    evt.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });
  dropZone.addEventListener('drop', (evt) => {
    evt.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(evt.dataTransfer.files);
  });

  fileInput.addEventListener('change', (evt) => handleFiles(evt.target.files));
};

const handleSubmit = () => {
  const form = document.getElementById('entryForm');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.selectedFile) {
      setStatus('Please choose an image before submitting.', true);
      return;
    }

    const mealName = document.getElementById('mealName').value || 'Untitled Meal';
    const consumedAt = document.getElementById('consumedAt').value;

    const formData = new FormData();
    formData.append('photo', state.selectedFile);
    formData.append('mealName', mealName);
    if (consumedAt) formData.append('consumedAt', new Date(consumedAt).toISOString());

    try {
      state.loading = true;
      setStatus('Analyzing meal with GPT-5.1-Codex (Preview)...');
      const response = await fetch(`${API_BASE}/entries/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Unable to analyze meal');
      }

      const entry = await response.json();
      state.entries = [entry, ...state.entries];
      setStatus('Meal analyzed successfully!');
      renderAnalysisPanel();
      renderHistory();
      form.reset();
      state.selectedFile = null;
      document.getElementById('preview').innerHTML = '<p>Drag & drop a food photo or browse files.</p>';
    } catch (error) {
      console.error(error);
      setStatus(error.message, true);
    } finally {
      state.loading = false;
    }
  });
};

const fetchEntries = async () => {
  try {
    const res = await fetch(`${API_BASE}/entries`);
    if (!res.ok) throw new Error('Unable to load previous entries');
    state.entries = await res.json();
    renderAnalysisPanel();
    renderHistory();
  } catch (error) {
    console.warn('History load failed', error);
    setStatus('Unable to load history. The API might be offline.', true);
  }
};

const renderApp = () => {
  appEl.innerHTML = `
    <header>
      <div class="branding">
        <h1>SnapCal</h1>
        <p>Track calories from food photos with GPT-5.1-Codex (Preview)</p>
      </div>
      <button class="primary" id="newEntryBtn">New meal</button>
    </header>
    <section class="grid">
      <article class="card">
        <h2>Upload your meal</h2>
        <form id="entryForm">
          <div id="uploadZone" class="upload-zone">
            <input type="file" accept="image/*" id="fileInput" />
            <div id="preview"><p>Drag & drop a food photo or browse files.</p></div>
          </div>
          <div class="input-group">
            <label for="mealName">Meal name</label>
            <input id="mealName" type="text" placeholder="e.g., Salmon bowl" />
          </div>
          <div class="input-group">
            <label for="consumedAt">Consumed at</label>
            <input id="consumedAt" type="datetime-local" />
          </div>
          <button class="primary" type="submit">Analyze nutrients</button>
        </form>
        <div id="status" class="status"></div>
      </article>
      <article class="card">
        <h2>Latest insights</h2>
        <div id="analysisPanel"></div>
      </article>
    </section>
    <section class="card" style="margin-top:2.5rem">
      <h2>Nutrition history</h2>
      <div id="historyList" class="history"></div>
    </section>
  `;

  document.getElementById('newEntryBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });

  bindUploaderEvents();
  handleSubmit();
  fetchEntries();
};

renderApp();
