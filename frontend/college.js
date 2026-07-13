const API = 'http://localhost:5000/api';

window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (id) fetchCollege(id);
  else showError();
};

function fetchCollege(id) {
  fetch(`${API}/colleges/${id}`)
    .then(res => res.json())
    .then(data => displayCollege(data))
    .catch(() => showError());
}

function displayCollege(c) {
  document.title = `${c.name} — CollegeFind`;
  document.getElementById('detailContent').innerHTML = `
    <div class="detail-card">

      ${c.photo_url ? `
      <div class="detail-banner">
        <img src="${c.photo_url}" alt="${c.name}" />
      </div>` : `
      <div class="detail-banner detail-banner-placeholder">
        <i class="ti ti-building-community"></i>
        <span>${c.name}</span>
      </div>`}

      ${c.last_verified ? `
      <div class="verified-badge">
        <i class="ti ti-shield-check"></i>
        Data verified: ${new Date(c.last_verified).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
        ${c.data_source ? ` · Source: ${c.data_source}` : ''}
      </div>` : ''}

      <div class="detail-header">
        <div class="detail-icon">
          <i class="ti ti-building-community"></i>
        </div>
        <div>
          <h1 class="detail-name">${c.name}</h1>
          <div class="detail-location">
            <i class="ti ti-map-pin"></i>
            ${c.address}, ${c.city}, ${c.state}
          </div>
        </div>
        <span class="card-badge" style="margin-left:auto">Listed</span>
      </div>

      <hr class="card-divider"/>

      <div class="detail-badges">
        ${c.college_type ? `<span class="detail-badge"><i class="ti ti-building"></i> ${c.college_type}</span>` : ''}
        ${c.naac_grade ? `<span class="detail-badge"><i class="ti ti-rosette"></i> NAAC: ${c.naac_grade}</span>` : ''}
        ${c.established_year ? `<span class="detail-badge"><i class="ti ti-calendar"></i> Est. ${c.established_year}</span>` : ''}
        ${c.nirf_ranking ? `<span class="detail-badge"><i class="ti ti-trophy"></i> NIRF #${c.nirf_ranking}</span>` : ''}
      </div>

      <hr class="card-divider"/>

      <div class="detail-grid">

        <div class="detail-section">
          <div class="detail-section-title">
            <i class="ti ti-books"></i> Courses Offered
          </div>
          <div class="detail-courses">
            ${c.courses.split(',').map(course =>
              `<span class="course-tag">${course.trim()}</span>`
            ).join('')}
          </div>
          <div class="detail-extra-row">
            ${c.fees ? `<span><i class="ti ti-currency-rupee"></i> Fees: ${c.fees}</span>` : ''}
            ${c.total_seats ? `<span><i class="ti ti-users"></i> Total Seats: ${c.total_seats}</span>` : ''}
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">
            <i class="ti ti-target-arrow"></i> Eligibility Criteria
          </div>
          ${c.min_jee != null ? `
          <div class="detail-info-row">
            <i class="ti ti-certificate"></i>
            <span>JEE Advanced Rank: up to ${c.min_jee}</span>
          </div>` : ''}
          ${c.min_cat != null ? `
          <div class="detail-info-row">
            <i class="ti ti-certificate"></i>
            <span>CAT Percentile: ${c.min_cat}+</span>
          </div>` : ''}
          ${c.min_mhtcet != null ? `
          <div class="detail-info-row">
            <i class="ti ti-certificate"></i>
            <span>MHT-CET Percentile: ${c.min_mhtcet}+</span>
          </div>` : ''}
          ${c.min_hsc != null ? `
          <div class="detail-info-row">
            <i class="ti ti-certificate"></i>
            <span>HSC %: ${c.min_hsc}+</span>
          </div>` : ''}
          ${(c.min_jee == null && c.min_cat == null && c.min_mhtcet == null && c.min_hsc == null) ? `
          <div class="detail-info-row">
            <span>Eligibility data not available yet.</span>
          </div>` : ''}
        </div>

        <div class="detail-section">
          <div class="detail-section-title">
            <i class="ti ti-briefcase"></i> Placements & Fees
          </div>
          ${c.avg_package != null ? `
          <div class="detail-info-row">
            <i class="ti ti-cash"></i>
            <span>Average Package: ₹${c.avg_package} LPA</span>
          </div>` : ''}
          ${c.top_company ? `
          <div class="detail-info-row">
            <i class="ti ti-building-skyscraper"></i>
            <span>Top Recruiters: ${c.top_company}</span>
          </div>` : ''}
          ${c.tuition_fee ? `
          <div class="detail-info-row">
            <i class="ti ti-currency-rupee"></i>
            <span>Tuition Fee: ${c.tuition_fee}</span>
          </div>` : ''}
          ${c.hostel_fee ? `
          <div class="detail-info-row">
            <i class="ti ti-home"></i>
            <span>Hostel Fee: ${c.hostel_fee}</span>
          </div>` : ''}
        </div>

        <div class="detail-section">
          <div class="detail-section-title">
            <i class="ti ti-school"></i> Academic Info
          </div>
          ${c.affiliation ? `
          <div class="detail-info-row">
            <i class="ti ti-link"></i>
            <span>Affiliated to: ${c.affiliation}</span>
          </div>` : ''}
          ${c.college_type ? `
          <div class="detail-info-row">
            <i class="ti ti-building"></i>
            <span>Type: ${c.college_type}</span>
          </div>` : ''}
          ${c.established_year ? `
          <div class="detail-info-row">
            <i class="ti ti-calendar"></i>
            <span>Established: ${c.established_year}</span>
          </div>` : ''}
          ${c.naac_grade ? `
          <div class="detail-info-row">
            <i class="ti ti-rosette"></i>
            <span>NAAC Grade: ${c.naac_grade}</span>
          </div>` : ''}
          ${c.nirf_ranking ? `
          <div class="detail-info-row">
            <i class="ti ti-trophy"></i>
            <span>NIRF Ranking: #${c.nirf_ranking}</span>
          </div>` : ''}
        </div>

        <div class="detail-section">
          <div class="detail-section-title">
            <i class="ti ti-address-book"></i> Contact Information
          </div>
          <div class="detail-info-row">
            <i class="ti ti-phone"></i>
            <span>${c.phone}</span>
          </div>
          ${c.email ? `
          <div class="detail-info-row">
            <i class="ti ti-mail"></i>
            <span>${c.email}</span>
          </div>` : ''}
          ${c.website ? `
          <div class="detail-info-row">
            <i class="ti ti-world"></i>
            <a href="https://${c.website}" target="_blank">${c.website}</a>
          </div>` : ''}
        </div>

        <div class="detail-section">
          <div class="detail-section-title">
            <i class="ti ti-map"></i> Location
          </div>
          <div class="detail-info-row">
            <i class="ti ti-map-pin"></i>
            <span>${c.address}, ${c.city}, ${c.state}</span>
          </div>
          <a href="https://www.google.com/maps/search/${encodeURIComponent(c.name + ' ' + c.city)}" 
             target="_blank" class="maps-btn">
            <i class="ti ti-map-2"></i> Open in Google Maps
          </a>
        </div>

      </div>
    </div>
  `;
}

function showError() {
  document.getElementById('detailContent').innerHTML = `
    <div class="no-results">
      <p>College not found. <a href="index.html">Go back</a></p>
    </div>`;
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