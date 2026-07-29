(function () {
  'use strict';

  const TOTAL_SECONDS = 20 * 60;
  const PASS_SCORE = 700;
  const STORAGE_KEY = 'tenedu-genai-exam-v1';

  const QUESTIONS = [
    {
      id: 1,
      type: 'matrix',
      domain: 'Ethics, Law, and Societal Impact',
      prompt: 'For each use of generative AI, decide whether it is likely to have a positive or negative impact on society.',
      note: 'You will receive partial credit for each correct selection.',
      columns: ['Positive', 'Negative'],
      statements: [
        'A museum creates audio descriptions to make exhibits more accessible.',
        'A teacher creates a first draft of a lesson outline and reviews it before use.',
        'A campaign publishes a fabricated video that falsely represents another person.',
        'A delivery company generates route suggestions that are checked by a dispatcher.'
      ],
      correct: ['Positive', 'Positive', 'Negative', 'Positive']
    },
    {
      id: 2,
      type: 'matching',
      domain: 'Generative AI Methods and Methodologies',
      prompt: 'Match each scenario to the most appropriate AI technology.',
      note: 'An AI technology may be used more than once.',
      bank: ['Generative AI', 'Predictive AI', 'Discriminative AI'],
      targets: [
        'Classify incoming messages as spam or not spam.',
        'Create a new illustration from a written description.',
        'Forecast next month’s product demand from historical sales.',
        'Draft an original product description.'
      ],
      correct: ['Discriminative AI', 'Generative AI', 'Predictive AI', 'Generative AI']
    },
    {
      id: 3,
      type: 'single',
      domain: 'Basic Prompt Engineering',
      prompt: 'You want an AI assistant to write three short social media posts from a product brief. Which prompt is most likely to produce the desired output?',
      options: [
        'Tell me something interesting about this product.',
        'Using the supplied brief, write three social media posts of no more than 50 words each for new customers.',
        'List topics that might be related to marketing.',
        'Rewrite whatever information is available.'
      ],
      correct: 1
    },
    {
      id: 4,
      type: 'matching',
      domain: 'Prompt Refinement',
      prompt: 'Select the best technique for verifying each AI-generated output.',
      note: 'Use the strongest source or test for each output.',
      bank: ['Run the code in a safe test environment', 'Consult an authoritative reference', 'Check an official map service', 'Ask the same model again'],
      targets: [
        'A JavaScript function intended to sort a list.',
        'A summary of the stages of photosynthesis.',
        'Driving directions between two cities.'
      ],
      correct: ['Run the code in a safe test environment', 'Consult an authoritative reference', 'Check an official map service']
    },
    {
      id: 5,
      type: 'single',
      domain: 'Prompt Refinement',
      prompt: 'An AI explanation uses terminology that beginning students may not understand. Which follow-up prompt is most audience-appropriate?',
      sample: 'Explain data encapsulation in computer science.',
      options: [
        'Explain this to a ninth-grade student taking their first programming class, using one simple example.',
        'Use more technical terminology and make the answer longer.',
        'Remove all details and provide only one sentence.',
        'Explain it to an unspecified audience.'
      ],
      correct: 0
    },
    {
      id: 6,
      type: 'split-matrix',
      domain: 'Basic Prompt Engineering',
      prompt: 'Choose Yes for each prompt element that should be included to generate the scene, or No if it should not.',
      reference: [
        'A camera drone rises above a forest at sunrise.',
        'It crosses a misty valley and reveals a snow-covered mountain.',
        'The shot ends with a slow pullback as the title fades in.'
      ],
      columns: ['Yes', 'No'],
      statements: [
        'Create a 10-second cinematic video at sunrise.',
        'Show a drone crossing a misty forest valley.',
        'Reveal a snowy mountain and finish with a title fade-in.',
        'Summarize my private production notes instead of creating a video.'
      ],
      correct: ['Yes', 'Yes', 'Yes', 'No']
    },
    {
      id: 7,
      type: 'matrix',
      domain: 'Ethics, Law, and Societal Impact',
      prompt: 'For each statement about generative AI and data privacy, select True or False.',
      note: 'Do not enter confidential or personal information unless its use is authorized.',
      columns: ['True', 'False'],
      statements: [
        'Training data may contain personal information.',
        'AI output should be reviewed before sharing potentially sensitive information.',
        'An AI system automatically ignores every personal detail entered in a prompt.'
      ],
      correct: ['True', 'True', 'False']
    },
    {
      id: 8,
      type: 'multiple',
      domain: 'Generative AI Methods and Methodologies',
      prompt: 'Which three capabilities are useful when creating marketing copy from a product image and a list of selling points? (Choose 3)',
      options: [
        'Image understanding',
        'Natural-language generation',
        'Following formatting instructions',
        'Weather forecasting',
        'Network packet routing',
        'Disk defragmentation'
      ],
      correct: [0, 1, 2]
    },
    {
      id: 9,
      type: 'multiple',
      domain: 'Basic Prompt Engineering',
      prompt: 'Which two guidelines should you follow when prompting an image generator? (Choose 2)',
      options: [
        'Describe the subject, setting, lighting, and important visual details.',
        'State the intended visual style.',
        'Add unrelated technical jargon.',
        'Avoid specifying what the image should contain.',
        'Use vague slang instead of concrete descriptions.'
      ],
      correct: [0, 1]
    },
    {
      id: 10,
      type: 'completion',
      domain: 'Prompt Refinement',
      prompt: 'Complete the improved prompt by selecting one option from each drop-down list.',
      context: 'The prompt “Explain current” produced an explanation of an ocean current, but the learner needs a physics flash card.',
      pieces: [
        { prefix: 'Explain the', options: ['advantages of', 'concept of'], correct: 'concept of' },
        { prefix: '', options: ['ocean current', 'electrical current', 'current events'], correct: 'electrical current' },
        { prefix: '', options: ['in simple terms.', 'using legal terminology.', 'as a travel plan.'], correct: 'in simple terms.' }
      ]
    }
  ];

  const app = document.getElementById('examApp');
  let tickId = null;
  let toastId = null;

  const newState = () => ({
    screen: 'welcome',
    tutorialPage: 0,
    current: 0,
    answers: {},
    review: [],
    feedbackMarks: [],
    remaining: TOTAL_SECONDS,
    startedAt: null,
    deadline: null,
    submittedAt: null,
    toolsOpen: false,
    highContrast: false,
    generalFeedback: '',
    score: null
  });

  let state = loadState();

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved && typeof saved === 'object' ? { ...newState(), ...saved } : newState();
    } catch (_) {
      return newState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatTime(seconds) {
    const safe = Math.max(0, seconds);
    const min = Math.floor(safe / 60);
    const sec = safe % 60;
    return `00:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  function header(title, progress) {
    return `
      <header class="exam-top">
        <h1>${escapeHtml(title)}</h1>
        ${state.screen === 'exam' || state.screen === 'summary'
          ? `<div class="timer"><span>Time Remaining</span><strong>${formatTime(state.remaining)}</strong></div>`
          : ''}
      </header>
      ${typeof progress === 'number'
        ? `<div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
             <div class="progress-value" style="width:${progress}%"></div>
           </div>`
        : ''}
    `;
  }

  function brand() {
    return `<span class="brand"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>10 EDUCATION</span>`;
  }

  function footer(left, right) {
    return `<footer class="footer-bar"><div class="footer-left">${left || ''}</div><div class="footer-right">${right || ''}</div></footer>`;
  }

  function render() {
    document.body.classList.toggle('high-contrast', state.highContrast);
    if (state.screen === 'welcome') renderWelcome();
    if (state.screen === 'tutorial') renderTutorial();
    if (state.screen === 'exam') renderExam();
    if (state.screen === 'summary') renderSummary();
    if (state.screen === 'feedback-intro') renderFeedbackIntro();
    if (state.screen === 'feedback') renderFeedback();
    if (state.screen === 'report') renderReport();
    saveState();
  }

  function renderWelcome() {
    stopTimer();
    app.innerHTML = `
      <main class="welcome screen">
        <section class="welcome-copy">
          ${brand()}
          <h1>Welcome!</h1>
          <h2>Generative AI Foundations<br>Practice Test</h2>
          <p>Maximum exam time: <strong>20 minutes</strong></p>
          <p>Number of exam questions: <strong>${QUESTIONS.length}</strong></p>
          <p>Minimum score required to pass: <strong>${PASS_SCORE}</strong></p>
        </section>
        <section class="welcome-visual" aria-label="Minh họa không gian học tập"></section>
      </main>
      ${footer(toolControl(), `<button class="nav-btn" data-action="open-tutorial">Start Exam</button>`)}
    `;
  }

  function renderTutorial() {
    const pages = [
      `
        <div class="tutorial-banner">
          <h2>GENERATIVE AI FOUNDATIONS</h2>
          <p>Build practical AI literacy</p>
        </div>
        <div class="tutorial-body">
          <h3>Chào mừng bạn đến với bài thi thử</h3>
          <p>Bài thi giúp bạn luyện tập bốn nhóm kiến thức: phương pháp Generative AI, prompt cơ bản, tinh chỉnh prompt và sử dụng AI có trách nhiệm.</p>
          <p>Các câu hỏi và ví dụ trên trang này do 10 Education tự biên soạn cho mục đích luyện tập.</p>
        </div>
      `,
      `
        <div class="tutorial-body">
          <h2>Exam Process</h2>
          <ol>
            <li><strong>Tutorial:</strong> đọc hướng dẫn trước khi bắt đầu.</li>
            <li><strong>Questions:</strong> trả lời, quay lại câu trước và đánh dấu câu cần xem lại.</li>
            <li><strong>Exam Summary:</strong> kiểm tra câu đã trả lời, chưa trả lời và các dấu đánh dấu.</li>
            <li><strong>Finish Exam:</strong> nộp bài, khóa đáp án và chuyển sang phần phản hồi.</li>
            <li><strong>Score Report:</strong> xem điểm tổng và tỷ lệ đúng theo từng nhóm kiến thức.</li>
          </ol>
          <h3>Controls</h3>
          <ul>
            <li><strong>Go To Summary:</strong> mở bảng tổng kết.</li>
            <li><strong>Mark for Review:</strong> đánh dấu câu cần quay lại.</li>
            <li><strong>Mark for Feedback:</strong> đánh dấu câu muốn góp ý.</li>
            <li><strong>Tools:</strong> mở hướng dẫn, đổi độ tương phản hoặc đặt lại câu.</li>
          </ul>
          <p>Đồng hồ 20 phút bắt đầu khi bạn chọn <strong>Start Exam</strong>.</p>
        </div>
      `
    ];

    app.innerHTML = `
      ${header('Tutorial')}
      <main class="content-shell screen"><article class="tutorial-card">${pages[state.tutorialPage]}</article></main>
      ${footer(
        toolControl() + `<button class="text-btn" data-action="skip-tutorial">Skip Tutorial</button>`,
        `<button class="nav-btn secondary" data-action="tutorial-back" ${state.tutorialPage === 0 ? 'disabled' : ''}>Back</button>
         ${state.tutorialPage === pages.length - 1
           ? `<button class="nav-btn" data-action="start-exam">Start Exam</button>`
           : `<button class="nav-btn" data-action="tutorial-next">Next</button>`}`
      )}
    `;
  }

  function questionTop() {
    return header(`Question ${state.current + 1} of ${QUESTIONS.length}`, Math.round(((state.current + 1) / QUESTIONS.length) * 100));
  }

  function renderExam() {
    startTimer();
    const q = QUESTIONS[state.current];
    app.innerHTML = `
      ${questionTop()}
      <main class="question-shell screen">
        <article class="question-card">${questionContent(q)}</article>
      </main>
      ${examFooter()}
    `;
  }

  function questionContent(q) {
    if (q.type === 'split-matrix') return splitMatrix(q);
    return `
      <section class="question-prompt">
        <p>${escapeHtml(q.prompt)}</p>
        ${q.sample ? `<p class="prompt-sample">${escapeHtml(q.sample)}</p>` : ''}
        ${q.context ? `<p>${escapeHtml(q.context)}</p>` : ''}
        ${q.note ? `<p class="note">Note: ${escapeHtml(q.note)}</p>` : ''}
      </section>
      <section class="answer-area">
        <h3>Answer Area</h3>
        ${answerWidget(q)}
      </section>
    `;
  }

  function answerWidget(q) {
    if (q.type === 'single' || q.type === 'multiple') return optionList(q);
    if (q.type === 'matrix') return matrixWidget(q);
    if (q.type === 'matching') return matchingWidget(q);
    if (q.type === 'completion') return completionWidget(q);
    return '';
  }

  function optionList(q) {
    const current = state.answers[q.id];
    const selected = Array.isArray(current) ? current : [];
    const inputType = q.type === 'multiple' ? 'checkbox' : 'radio';
    return `
      <div class="option-list">
        ${q.options.map((option, index) => `
          <label class="option">
            <input type="${inputType}" name="q-${q.id}" value="${index}"
              ${q.type === 'single' && Number(current) === index ? 'checked' : ''}
              ${q.type === 'multiple' && selected.includes(index) ? 'checked' : ''}>
            <span class="option-letter">${String.fromCharCode(65 + index)}.</span>
            <span class="option-text">${escapeHtml(option)}</span>
          </label>
        `).join('')}
      </div>
    `;
  }

  function matrixWidget(q) {
    const current = Array.isArray(state.answers[q.id]) ? state.answers[q.id] : [];
    return `
      <table class="matrix">
        <thead><tr><th>Statement</th>${q.columns.map(column => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead>
        <tbody>
          ${q.statements.map((statement, row) => `
            <tr>
              <td>${escapeHtml(statement)}</td>
              ${q.columns.map(column => `
                <td><input type="radio" name="q-${q.id}-${row}" value="${escapeHtml(column)}"
                  aria-label="${escapeHtml(column)}" ${current[row] === column ? 'checked' : ''}></td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function splitMatrix(q) {
    return `
      <div class="split-question">
        <section class="reference-pane">
          <h2>Scene Notes</h2>
          ${q.reference.map(line => `<p>${escapeHtml(line)}</p>`).join('')}
        </section>
        <section class="answer-pane">
          <div class="question-prompt">
            <p>${escapeHtml(q.prompt)}</p>
            <p class="note">Note: You will receive partial credit for each correct selection.</p>
          </div>
          <div class="answer-area"><h3>Answer Area</h3>${matrixWidget(q)}</div>
        </section>
      </div>
    `;
  }

  function matchingWidget(q) {
    const current = Array.isArray(state.answers[q.id]) ? state.answers[q.id] : [];
    return `
      <div class="matching">
        <div class="matching-bank">
          ${q.bank.map(item => `<div class="bank-item">${escapeHtml(item)}</div>`).join('')}
        </div>
        <div class="matching-targets">
          ${q.targets.map((target, index) => `
            <label class="target-row">
              <span>${escapeHtml(target)}</span>
              <select data-match-index="${index}" aria-label="Answer for ${escapeHtml(target)}">
                <option value="">Select answer</option>
                ${q.bank.map(item => `<option value="${escapeHtml(item)}" ${current[index] === item ? 'selected' : ''}>${escapeHtml(item)}</option>`).join('')}
              </select>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }

  function completionWidget(q) {
    const current = Array.isArray(state.answers[q.id]) ? state.answers[q.id] : [];
    return `
      <div class="completion">
        ${q.pieces.map((piece, index) => `
          ${piece.prefix ? `<span>${escapeHtml(piece.prefix)}</span>` : ''}
          <select data-piece-index="${index}" aria-label="Prompt part ${index + 1}">
            <option value="">Select</option>
            ${piece.options.map(option => `<option value="${escapeHtml(option)}" ${current[index] === option ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}
          </select>
        `).join('')}
      </div>
    `;
  }

  function examFooter() {
    const q = QUESTIONS[state.current];
    const reviewActive = state.review.includes(q.id);
    const feedbackActive = state.feedbackMarks.includes(q.id);
    return footer(
      `<button class="text-btn" data-action="summary">Go To Summary</button>
       <button class="text-btn ${reviewActive ? 'active' : ''}" data-action="toggle-review">${reviewActive ? 'Unmark for Review' : 'Mark for Review'}</button>
       <button class="text-btn ${feedbackActive ? 'active' : ''}" data-action="toggle-feedback">${feedbackActive ? 'Unmark for Feedback' : 'Mark for Feedback'}</button>
       ${toolControl()}`,
      `<button class="nav-btn secondary" data-action="back" ${state.current === 0 ? 'disabled' : ''}>Back</button>
       <button class="nav-btn" data-action="${state.current === QUESTIONS.length - 1 ? 'summary' : 'next'}">${state.current === QUESTIONS.length - 1 ? 'Summary' : 'Next'}</button>`
    );
  }

  function toolControl() {
    return `
      <span class="tools-wrap">
        <button class="text-btn" data-action="toggle-tools">Tools ▾</button>
        <span class="tools-menu ${state.toolsOpen ? '' : 'hidden'}">
          <button data-action="instructions">Instructions</button>
          <button data-action="calculator">Calculator</button>
          <button data-action="color-scheme">Color Scheme</button>
          ${state.screen === 'exam' ? '<button data-action="reset-question">Reset Question</button>' : ''}
        </span>
      </span>
    `;
  }

  function isAnswered(q) {
    const value = state.answers[q.id];
    if (q.type === 'single') return Number.isInteger(Number(value)) && value !== '';
    if (q.type === 'multiple') return Array.isArray(value) && value.length > 0;
    if (q.type === 'matrix' || q.type === 'split-matrix') return Array.isArray(value) && value.length === q.statements.length && value.every(Boolean);
    if (q.type === 'matching') return Array.isArray(value) && value.length === q.targets.length && value.every(Boolean);
    if (q.type === 'completion') return Array.isArray(value) && value.length === q.pieces.length && value.every(Boolean);
    return false;
  }

  function renderSummary() {
    startTimer();
    const answeredCount = QUESTIONS.filter(isAnswered).length;
    app.innerHTML = `
      ${header('Exam Summary', Math.round((answeredCount / QUESTIONS.length) * 100))}
      <main class="summary-shell screen">
        <p class="summary-help">Select a question to return to it before finishing the exam.</p>
        <table class="summary-table">
          <thead>
            <tr>
              <th>Question Number</th>
              <th>Question Content</th>
              <th>Answered<br>${answeredCount}</th>
              <th>Unanswered<br>${QUESTIONS.length - answeredCount}</th>
              <th>Review<br>${state.review.length}</th>
              <th>Leave Feedback<br>${state.feedbackMarks.length}</th>
            </tr>
          </thead>
          <tbody>
            ${QUESTIONS.map((q, index) => `
              <tr>
                <td>${q.id}</td>
                <td><a class="summary-link" href="#" data-question-index="${index}">${escapeHtml(q.prompt.slice(0, 62))}${q.prompt.length > 62 ? '…' : ''}</a></td>
                <td>${isAnswered(q) ? '<span class="status-icon">✓</span>' : ''}</td>
                <td>${!isAnswered(q) ? '<span class="status-icon">◇</span>' : ''}</td>
                <td>${state.review.includes(q.id) ? '<span class="status-icon">✓</span>' : ''}</td>
                <td>${state.feedbackMarks.includes(q.id) ? '<span class="status-icon">✓</span>' : ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </main>
      ${footer(toolControl(), `<button class="nav-btn" data-action="finish-exam">Finish Exam</button>`)}
    `;
  }

  function renderFeedbackIntro() {
    stopTimer();
    app.innerHTML = `
      ${header('')}
      <main class="feedback screen">
        ${brand()}
        <h2>Leave feedback about exam items</h2>
        <p>Bạn có thể để lại nhận xét về các câu hỏi đã đánh dấu. Đáp án hiện đã bị khóa và không thể thay đổi.</p>
        <p>Nhận xét giúp 10 Education cải thiện nội dung và trải nghiệm luyện tập.</p>
      </main>
      ${footer(toolControl(), `<button class="nav-btn secondary" data-action="skip-feedback">Skip Feedback</button><button class="nav-btn" data-action="start-feedback">Start Feedback</button>`)}
    `;
  }

  function renderFeedback() {
    app.innerHTML = `
      ${header('')}
      <main class="feedback screen">
        ${brand()}
        <h2>Leave feedback about the exam</h2>
        <p>Bạn có thể cho biết phần nào hữu ích, phần nào cần cải thiện hoặc lỗi kỹ thuật đã gặp.</p>
        <textarea id="generalFeedback" aria-label="Feedback">${escapeHtml(state.generalFeedback)}</textarea>
      </main>
      ${footer(toolControl(), `<button class="nav-btn" data-action="show-report">Next</button>`)}
    `;
  }

  function calculateResults() {
    let correctCount = 0;
    const domains = {};
    QUESTIONS.forEach(q => {
      const correct = isCorrect(q);
      domains[q.domain] ||= { correct: 0, total: 0 };
      domains[q.domain].total += 1;
      if (correct) {
        correctCount += 1;
        domains[q.domain].correct += 1;
      }
    });
    const score = 100 + Math.round((correctCount / QUESTIONS.length) * 900);
    return { correctCount, score, domains };
  }

  function isCorrect(q) {
    const answer = state.answers[q.id];
    if (q.type === 'single') return Number(answer) === q.correct;
    if (q.type === 'multiple') {
      const actual = Array.isArray(answer) ? [...answer].sort((a, b) => a - b) : [];
      return JSON.stringify(actual) === JSON.stringify([...q.correct].sort((a, b) => a - b));
    }
    if (q.type === 'matrix' || q.type === 'split-matrix' || q.type === 'matching') {
      return JSON.stringify(answer || []) === JSON.stringify(q.correct);
    }
    if (q.type === 'completion') {
      return JSON.stringify(answer || []) === JSON.stringify(q.pieces.map(piece => piece.correct));
    }
    return false;
  }

  function renderReport() {
    stopTimer();
    const results = state.score || calculateResults();
    state.score = results;
    const passed = results.score >= PASS_SCORE;
    app.innerHTML = `
      ${header('')}
      <main class="report screen">
        ${brand()}
        <h1 class="report-title">Exam Score Report</h1>
        <div class="report-grid">
          <section class="report-card">
            <h3>Section Analysis</h3>
            <table>
              ${Object.entries(results.domains).map(([name, value]) => `
                <tr><td>${escapeHtml(name)}</td><td>${Math.round((value.correct / value.total) * 100)}%</td></tr>
              `).join('')}
            </table>
          </section>
          <div>
            <section class="report-card">
              <h3>Final Score</h3>
              <table>
                <tr><td>Required Score</td><td>${PASS_SCORE}</td></tr>
                <tr><td>Your Score</td><td class="result-score">${results.score}</td></tr>
              </table>
            </section>
            <section class="report-card" style="margin-top:18px">
              <h3>Outcome</h3>
              <table><tr><td class="${passed ? 'pass' : 'fail'}">${passed ? 'Pass ✓' : 'Fail ✕'}</td></tr></table>
            </section>
          </div>
        </div>
      </main>
      ${footer(toolControl(), `<a class="nav-btn secondary" href="index.html" style="text-decoration:none;text-align:center">Exit Exam</a><button class="nav-btn" data-action="print">Print</button><button class="nav-btn" data-action="restart">Try Again</button>`)}
    `;
  }

  function startTimer() {
    if (tickId || !state.startedAt || state.submittedAt) return;
    if (!state.deadline) state.deadline = Date.now() + (state.remaining * 1000);
    tickId = setInterval(() => {
      state.remaining = Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));
      if (state.remaining <= 0) {
        state.remaining = 0;
        submitExam();
        return;
      }
      const timer = document.querySelector('.timer strong');
      if (timer) timer.textContent = formatTime(state.remaining);
      saveState();
    }, 1000);
  }

  function stopTimer() {
    if (tickId) clearInterval(tickId);
    tickId = null;
  }

  function startExam() {
    state.screen = 'exam';
    state.startedAt ||= Date.now();
    state.remaining = state.submittedAt ? TOTAL_SECONDS : state.remaining;
    state.deadline = Date.now() + (state.remaining * 1000);
    state.submittedAt = null;
    state.score = null;
    render();
  }

  function submitExam() {
    state.submittedAt = Date.now();
    state.score = calculateResults();
    state.screen = 'feedback-intro';
    stopTimer();
    render();
  }

  function showModal(title, body, confirmAction, confirmLabel) {
    const wrapper = document.createElement('div');
    wrapper.className = 'modal-backdrop';
    wrapper.innerHTML = `
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <h2 id="modalTitle">${escapeHtml(title)}</h2>
        <div class="modal-body">${body}</div>
        <div class="modal-actions">
          <button data-modal-close>Cancel</button>
          ${confirmAction ? `<button data-modal-confirm="${confirmAction}">${escapeHtml(confirmLabel || 'Confirm')}</button>` : ''}
        </div>
      </section>
    `;
    document.body.appendChild(wrapper);
  }

  function toast(message) {
    clearTimeout(toastId);
    document.querySelector('.toast')?.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    document.body.appendChild(el);
    toastId = setTimeout(() => el.remove(), 1500);
  }

  function toggleList(name, id) {
    const set = new Set(state[name]);
    set.has(id) ? set.delete(id) : set.add(id);
    state[name] = [...set];
    toast(set.has(id) ? 'Item marked' : 'Item unmarked');
    render();
  }

  function resetQuestion() {
    delete state.answers[QUESTIONS[state.current].id];
    toast('Question reset');
    render();
  }

  function updateAnswer(target) {
    if (state.submittedAt || state.screen !== 'exam') return;
    const q = QUESTIONS[state.current];

    if (target.matches('input[type="radio"]')) {
      if (q.type === 'single') {
        state.answers[q.id] = Number(target.value);
      } else {
        const row = Number(target.name.split('-').pop());
        const value = Array.isArray(state.answers[q.id]) ? [...state.answers[q.id]] : [];
        value[row] = target.value;
        state.answers[q.id] = value;
      }
    }

    if (target.matches('input[type="checkbox"]')) {
      const value = Array.isArray(state.answers[q.id]) ? [...state.answers[q.id]] : [];
      const index = Number(target.value);
      state.answers[q.id] = target.checked ? [...new Set([...value, index])] : value.filter(item => item !== index);
    }

    if (target.matches('[data-match-index]')) {
      const value = Array.isArray(state.answers[q.id]) ? [...state.answers[q.id]] : [];
      value[Number(target.dataset.matchIndex)] = target.value;
      state.answers[q.id] = value;
    }

    if (target.matches('[data-piece-index]')) {
      const value = Array.isArray(state.answers[q.id]) ? [...state.answers[q.id]] : [];
      value[Number(target.dataset.pieceIndex)] = target.value;
      state.answers[q.id] = value;
    }

    saveState();
  }

  app.addEventListener('change', event => {
    if (event.target.id === 'generalFeedback') {
      state.generalFeedback = event.target.value;
      saveState();
      return;
    }
    updateAnswer(event.target);
  });

  app.addEventListener('input', event => {
    if (event.target.id === 'generalFeedback') {
      state.generalFeedback = event.target.value;
      saveState();
    }
  });

  document.addEventListener('click', event => {
    const modalClose = event.target.closest('[data-modal-close]');
    if (modalClose) {
      modalClose.closest('.modal-backdrop').remove();
      return;
    }

    const modalConfirm = event.target.closest('[data-modal-confirm]');
    if (modalConfirm) {
      const action = modalConfirm.dataset.modalConfirm;
      modalConfirm.closest('.modal-backdrop').remove();
      if (action === 'start-exam') startExam();
      if (action === 'submit-exam') submitExam();
      return;
    }

    const questionLink = event.target.closest('[data-question-index]');
    if (questionLink) {
      event.preventDefault();
      state.current = Number(questionLink.dataset.questionIndex);
      state.screen = 'exam';
      render();
      return;
    }

    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;

    if (action === 'open-tutorial') { state.screen = 'tutorial'; state.tutorialPage = 0; render(); }
    if (action === 'tutorial-next') { state.tutorialPage += 1; render(); }
    if (action === 'tutorial-back') { state.tutorialPage = Math.max(0, state.tutorialPage - 1); render(); }
    if (action === 'skip-tutorial' || action === 'start-exam') {
      showModal('Start Exam?', '<p>Đồng hồ 20 phút sẽ bắt đầu. Bạn có thể quay lại các câu hỏi trước khi nộp bài.</p>', 'start-exam', 'Start');
    }
    if (action === 'next') { state.current = Math.min(QUESTIONS.length - 1, state.current + 1); render(); }
    if (action === 'back') { state.current = Math.max(0, state.current - 1); render(); }
    if (action === 'summary') { state.screen = 'summary'; render(); }
    if (action === 'toggle-review') toggleList('review', QUESTIONS[state.current].id);
    if (action === 'toggle-feedback') toggleList('feedbackMarks', QUESTIONS[state.current].id);
    if (action === 'toggle-tools') { state.toolsOpen = !state.toolsOpen; render(); }
    if (action === 'color-scheme') { state.highContrast = !state.highContrast; state.toolsOpen = false; render(); }
    if (action === 'reset-question') { state.toolsOpen = false; resetQuestion(); }
    if (action === 'instructions') {
      state.toolsOpen = false;
      render();
      showModal('Instructions', '<p>Dùng Back và Next để di chuyển. Câu trả lời được lưu tự động. Mở Exam Summary để kiểm tra trước khi nộp.</p>', '', '');
    }
    if (action === 'calculator') {
      state.toolsOpen = false;
      render();
      showModal('Calculator', '<p>Máy tính không cần thiết cho bộ câu hỏi hiện tại.</p>', '', '');
    }
    if (action === 'finish-exam') {
      showModal('Finish Exam?', '<p>Chọn Finish để dừng đồng hồ và nộp bài. Sau khi nộp, bạn không thể thay đổi đáp án.</p>', 'submit-exam', 'Finish');
    }
    if (action === 'skip-feedback' || action === 'start-feedback') { state.screen = 'feedback'; render(); }
    if (action === 'show-report') { state.screen = 'report'; render(); }
    if (action === 'print') window.print();
    if (action === 'restart') {
      localStorage.removeItem(STORAGE_KEY);
      state = newState();
      render();
    }
  });

  render();
})();
