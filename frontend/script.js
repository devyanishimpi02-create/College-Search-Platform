const API = 'https://college-search-platform-1.onrender.com/api';

let compareIds = [];
let collegeCache = {};

window.onload = () => {
  fetchColleges();
  updateMarksHint();
  animateCounters();
};

function fetchColleges() {
  fetch(`${API}/colleges`)
    .then(res => res.json())
    .then(data => displayColleges(data))
    .catch(err => console.log('Error:', err));
}

function searchColleges() {
  const query = document.getElementById('searchInput').value;
  if (query.trim() === '') {
    fetchColleges();
    return;
  }
  fetch(`${API}/search?q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      displayColleges(data);
      document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
    })
    .catch(err => console.log('Error:', err));
}

document.getElementById('searchInput')
  .addEventListener('keypress', function(e) {
    if (e.key === 'Enter') searchColleges();
  });
function filterCourse(chip, course) {
  document.querySelectorAll('.chip')
    .forEach(c => c.classList.remove('active'));
  chip.classList.add('active');

  if (course === '') {
    fetchColleges();
    return;
  }

  fetch(`${API}/search?q=${encodeURIComponent(course)}`)
    .then(res => res.json())
    .then(data => displayColleges(data))
    .catch(err => console.log('Error:', err));
}

// ===== Eligibility filter =====

function toggleEligibilityPanel() {
  document.getElementById('eligibilityPanel').classList.toggle('open');
}

function updateMarksHint() {
  const exam = document.getElementById('examSelect').value;
  const label = document.getElementById('marksLabel');
  const input = document.getElementById('marksInput');

  if (exam === 'jee') {
    label.textContent = 'Your JEE Advanced rank';
    input.placeholder = 'e.g. 4500';
    input.removeAttribute('max');
  } else {
    label.textContent = 'Your score (%)';
    input.placeholder = 'e.g. 85';
    input.setAttribute('max', '100');
  }
}

function filterByEligibility() {
  const exam = document.getElementById('examSelect').value;
  const marks = document.getElementById('marksInput').value;

  if (!marks || isNaN(parseFloat(marks))) {
    alert('Enter your score first so we can find your matches.');
    return;
  }

  fetch(`${API}/filter?exam=${exam}&marks=${encodeURIComponent(marks)}`)
    .then(res => res.json())
    .then(data => {
      displayColleges(data, true, exam);
    })
    .catch(err => console.log('Error:', err));
}

// ===== Helpers =====

function chanceLabel(chance) {
  if (chance === 'safe') return '🟢 Good shot';
  if (chance === 'moderate') return '🟡 Worth a try';
  return '🔴 A stretch';
}

function typeClass(type) {
  if (!type) return '';
  const t = type.toLowerCase();
  if (t.includes('government')) return 'type-government';
  if (t.includes('private')) return 'type-private';
  if (t.includes('autonomous') || t.includes('deemed')) return 'type-autonomous';
  return '';
}

// ===== Display colleges =====

function displayColleges(colleges, eligibilityMode = false, exam = null) {
  const results = document.getElementById('results');
  const label = document.getElementById('resultsLabel');

  label.textContent = eligibilityMode
    ? `Here's where you stand — ${colleges.length} college(s) match your score`
    : `Showing ${colleges.length} college(s)`;

  colleges.forEach(c => collegeCache[c.id] = c);

  if (colleges.length === 0) {
    results.innerHTML = `
      <div class="no-results">
        <i class="ti ti-mood-empty"></i>
        <p>No matches yet. Try a different score, exam, or search term.</p>
      </div>`;
    return;
  }

  results.innerHTML = colleges.map(college => `
    <div class="card">
      <label class="compare-checkbox">
        <input type="checkbox" 
               onclick="toggleCompare(${college.id})" 
               ${compareIds.includes(college.id) ? 'checked' : ''} />
        Add to compare
      </label>
      <div class="card-top">
        <div class="card-icon ${typeClass(college.college_type)}">
          <i class="ti ti-building-community"></i>
        </div>
        <span class="card-badge">${college.college_type || 'Listed'}</span>
      </div>
      <div class="card-name">${college.name}</div>
      <div class="card-location">
        <i class="ti ti-map-pin"></i>
        ${college.city || ''}, ${college.state || ''}
      </div>
      <hr class="card-divider"/>
      <div class="card-courses">
        <i class="ti ti-books"></i>
        ${college.courses}
      </div>
      ${eligibilityMode && exam ? `
      <div class="card-eligibility chance-${college.admission_chance}">
        <i class="ti ti-target-arrow"></i>
        ${exam === 'jee' ? `Cutoff rank: ${college[`min_${exam}`]}` : `Cutoff: ${college[`min_${exam}`]}`}
        <span class="chance-badge">${chanceLabel(college.admission_chance)}</span>
      </div>` : ''}
      <div class="card-footer">
        <span class="card-phone">${college.phone || ''}</span>
        <a href="college.html?id=${college.id}" class="card-btn">
          <i class="ti ti-external-link"></i> View details
        </a>
      </div>
    </div>
  `).join('');
}

// ===== Compare feature =====

function toggleCompare(id) {
  const index = compareIds.indexOf(id);
  if (index === -1) {
    if (compareIds.length >= 4) {
      alert('You can compare up to 4 colleges at once.');
      fetchColleges();
      return;
    }
    compareIds.push(id);
  } else {
    compareIds.splice(index, 1);
  }
  updateCompareBar();
}

function updateCompareBar() {
  const bar = document.getElementById('compareBar');
  const count = document.getElementById('compareCount');
  count.textContent = compareIds.length === 1
    ? '1 college selected'
    : `${compareIds.length} colleges selected`;
  bar.classList.toggle('visible', compareIds.length > 0);
}

function clearCompare() {
  compareIds = [];
  updateCompareBar();
  document.querySelectorAll('.compare-checkbox input').forEach(cb => cb.checked = false);
}

function openCompareModal() {
  if (compareIds.length < 2) {
    alert('Pick at least 2 colleges to compare.');
    return;
  }

  fetch(`${API}/compare?ids=${compareIds.join(',')}`)
    .then(res => res.json())
    .then(data => renderCompareModal(data))
    .catch(err => console.log('Error:', err));
}

function renderCompareModal(colleges) {
  const body = document.getElementById('compareModalBody');

  const rows = [
    { label: 'Location', render: c => `${c.city || '—'}, ${c.state || '—'}` },
    { label: 'Type', render: c => c.college_type || '—' },
    { label: 'Affiliation', render: c => c.affiliation || '—' },
    { label: 'NAAC Grade', render: c => c.naac_grade || '—' },
    { label: 'NIRF Ranking', render: c => c.nirf_ranking ? `#${c.nirf_ranking}` : '—' },
    { label: 'Established', render: c => c.established_year || '—' },
    { label: 'Courses', render: c => c.courses || '—' },
    { label: 'Total Seats', render: c => c.total_seats || '—' },
    { label: 'Tuition Fee', render: c => c.tuition_fee || c.fees || '—' },
    { label: 'Hostel Fee', render: c => c.hostel_fee || '—' },
    { label: 'Avg. Package', render: c => c.avg_package ? `₹${c.avg_package} LPA` : '—' },
    { label: 'Top Recruiters', render: c => c.top_company || '—' },
    { label: 'JEE Cutoff (Rank)', render: c => c.min_jee ?? '—' },
    { label: 'CAT Cutoff', render: c => c.min_cat ?? '—' },
    { label: 'MHT-CET Cutoff', render: c => c.min_mhtcet ?? '—' },
    { label: 'HSC % Cutoff', render: c => c.min_hsc ?? '—' },
  ];

  let html = '<div class="compare-table-wrapper"><table class="compare-table"><thead><tr><th>Detail</th>';
  colleges.forEach(c => {
    html += `<th>${c.name}</th>`;
  });
  html += '</tr></thead><tbody>';

  rows.forEach(row => {
    html += `<tr><td class="compare-row-label">${row.label}</td>`;
    colleges.forEach(c => {
      html += `<td>${row.render(c)}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  body.innerHTML = html;

  document.getElementById('compareModalOverlay').classList.add('open');
}

function closeCompareModal() {
  document.getElementById('compareModalOverlay').classList.remove('open');
}

function closeCompareModalOnOverlay(event) {
  if (event.target.id === 'compareModalOverlay') {
    closeCompareModal();
  }
}

// ===== Personalised Guidance Feature =====

function openGuidanceModal() {
  document.getElementById('guidanceModalOverlay').classList.add('open');
  document.getElementById('guidanceForm').style.display = '';
  document.getElementById('guidanceSuccess').style.display = 'none';
}

function closeGuidanceModal() {
  document.getElementById('guidanceModalOverlay').classList.remove('open');
}

function closeGuidanceModalOnOverlay(event) {
  if (event.target.id === 'guidanceModalOverlay') closeGuidanceModal();
}

function updateGuidanceMarksLabel() {
  const exam = document.getElementById('g_exam').value;
  const label = document.getElementById('g_marks_label');
  const input = document.getElementById('g_marks');
  if (exam === 'jee') {
    label.innerHTML = '<i class="ti ti-target-arrow"></i> Your JEE Rank';
    input.placeholder = 'e.g. 4500';
    input.removeAttribute('max');
  } else if (exam === '') {
    label.innerHTML = '<i class="ti ti-target-arrow"></i> Your Score / Rank';
    input.placeholder = 'e.g. 85';
  } else {
    label.innerHTML = '<i class="ti ti-target-arrow"></i> Your Score (%)';
    input.placeholder = 'e.g. 85';
    input.setAttribute('max', '100');
  }
}

function submitGuidanceForm() {
  const name    = document.getElementById('g_name').value.trim();
  const phone   = document.getElementById('g_phone').value.trim();
  const course  = document.getElementById('g_course').value;
  const email   = document.getElementById('g_email').value.trim();
  const exam    = document.getElementById('g_exam').value;
  const marks   = document.getElementById('g_marks').value.trim();
  const location= document.getElementById('g_location').value.trim();
  const message = document.getElementById('g_message').value.trim();

  if (!name) { alert('Please enter your name.'); return; }
  if (!phone || !/^\d{10}$/.test(phone)) { alert('Please enter a valid 10-digit phone number.'); return; }
  if (!course) { alert('Please select a preferred course.'); return; }

  const payload = { name, phone, email, course, exam, marks, location, message };

  const btn = document.querySelector('.guidance-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="ti ti-loader-2"></i> Submitting...';

  fetch(`${API}/guidance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(res => {
    if (!res.ok) throw new Error('Server error');
    return res.json();
  })
  .then(() => showGuidanceSuccess())
  .catch(() => {
    // Even if backend is down, show success to student (store locally as fallback)
    const submissions = JSON.parse(localStorage.getItem('guidance_submissions') || '[]');
    submissions.push({ ...payload, submitted_at: new Date().toISOString() });
    localStorage.setItem('guidance_submissions', JSON.stringify(submissions));
    showGuidanceSuccess();
  })
  .finally(() => {
    btn.disabled = false;
    btn.innerHTML = '<i class="ti ti-send"></i> Submit & Get Guidance';
  });
}

function showGuidanceSuccess() {
  document.getElementById('guidanceForm').style.display = 'none';
  document.getElementById('guidanceSuccess').style.display = '';
}
function toggleTheme() {
  const html = document.documentElement;
  const icon = document.getElementById('themeIcon');
  const text = document.getElementById('themeText');

  if (html.getAttribute('data-theme') === 'dark') {
    html.setAttribute('data-theme', 'light');
    icon.className = 'ti ti-moon';
    text.textContent = 'Dark mode';
  } else {
    html.setAttribute('data-theme', 'dark');
    icon.className = 'ti ti-sun';
    text.textContent = 'Light mode';
  }
}

// ===============================
// Animated Stats Counter
// ===============================
async function animateCounters() {
  try {
    const response = await fetch(`${API}/stats`);
    const stats = await response.json();

    const counters = [
      { id: "collegeCount", target: Number(stats.colleges) || 0, suffix: "" },
      { id: "stateCount", target: Number(stats.states) || 0, suffix: "+" },
      { id: "examCount", target: Number(stats.exams) || 0, suffix: "" }
    ];

    counters.forEach(counter => {
      const element = document.getElementById(counter.id);
      if (!element) return;

      let current = 0;
      const target = counter.target;
      const increment = Math.max(1, Math.ceil(target / 60));

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        element.textContent = current + counter.suffix;
      }, 25);
    });

  } catch (err) {
    console.error("Failed to load stats:", err);
  }
}