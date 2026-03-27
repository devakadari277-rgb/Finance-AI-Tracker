function loadTargets() {
  fetch('/api/targets')
    .then(function(r) { if (!r.ok) throw new Error(); return r.json(); })
    .then(function(list) {
      var html = '';
      list.forEach(function(t) {
      var monthly = t.required_monthly != null
        ? Math.round(t.required_monthly)
        : (t.years > 0 ? Math.round(t.target_amount / (t.years * 12)) : 0);
      var avg = t.avg_monthly_saving != null ? Math.round(t.avg_monthly_saving) : null;
      html += '<div class="card card-stat-3 mb-3"><div class="card-body">' +
        '<h6 class="text-dark">' + t.name + '</h6>' +
        '<p class="mb-0 text-dark">Target: ₹' + t.target_amount.toLocaleString() + ' in ' + t.years + ' years</p>' +
        '<p class="mb-0 text-dark">Required monthly savings: <strong>₹' + monthly.toLocaleString() + '</strong></p>';
      if (avg !== null && !isNaN(avg)) {
        html += '<p class="mb-0 text-dark">Your recent average monthly savings: <strong>₹' + avg.toLocaleString() + '</strong></p>';
      }
      if (t.monthly_income != null && t.monthly_income > 0) {
        html += '<hr class="my-2">';
        html += '<p class="mb-0 text-dark">Income-based analysis</p>';
        html += '<p class="mb-0 text-dark">Monthly Income: <strong>₹' + Math.round(t.monthly_income).toLocaleString() + '</strong></p>';
        html += '<p class="mb-0 text-dark">Estimated Monthly Expense: <strong>₹' + Math.round(t.estimated_monthly_expense || 0).toLocaleString() + '</strong></p>';
        html += '<p class="mb-0 text-dark">You can save: <strong>₹' + Math.round(t.saving_capacity_monthly || 0).toLocaleString() + '/month</strong> (' + (t.saving_capacity_pct || 0).toFixed(1) + '% of income)</p>';
        html += '<p class="mb-0 text-dark">Daily saving capacity: <strong>₹' + Math.round(t.saving_capacity_daily || 0).toLocaleString() + '/day</strong></p>';
        html += '<p class="mb-0 text-dark">Yearly saving capacity: <strong>₹' + Math.round(t.saving_capacity_yearly || 0).toLocaleString() + '/year</strong></p>';
        if (t.months_to_goal_at_current_income != null) {
          html += '<p class="mb-0 text-dark">Goal reach (current income pattern): <strong>' + t.months_to_goal_at_current_income + ' months</strong></p>';
        } else {
          html += '<p class="mb-0 text-danger">Goal reach: Not possible with current income/expense pattern (saving capacity ≤ 0).</p>';
        }
      }
      if (t.suggestion) {
        html += '<p class="mb-0 text-muted small mt-1">' + t.suggestion + '</p>';
      }
      html += '</div></div>';
      });
      document.getElementById('target-list').innerHTML = html || '<p class="text-muted">No targets yet. Add one above.</p>';
    })
    .catch(function() { document.getElementById('target-list').innerHTML = '<p class="text-muted">Load failed.</p>'; });
}

function loadProfile() {
  fetch('/api/profile')
    .then(function(r) { if (!r.ok) throw new Error(); return r.json(); })
    .then(function(p) {
      var inc = p.monthly_income || 0;
      var exp = p.monthly_expense || 0;
      document.getElementById('p-income').value = inc ? inc : '';
      document.getElementById('p-expense').value = exp ? exp : '';

      var btn = document.getElementById('add-target-btn');
      var hint = document.getElementById('add-target-hint');
      if (inc > 0) {
        btn.disabled = false;
        hint.textContent = 'Income setup saved. Now you can add targets and get income-based evaluation.';
      } else {
        btn.disabled = true;
        hint.textContent = 'Please save Monthly Income first to enable target evaluation.';
      }
    })
    .catch(function() {});
}

document.getElementById('profile-form').addEventListener('submit', function(e) {
  e.preventDefault();
  var msg = document.getElementById('profile-msg');
  msg.textContent = 'Saving...';
  fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      monthly_income: parseFloat(document.getElementById('p-income').value || 0),
      monthly_expense: parseFloat(document.getElementById('p-expense').value || 0)
    })
  })
    .then(function(r) { return r.json(); })
    .then(function() {
      msg.textContent = 'Saved. Targets are now enabled.';
      loadProfile();
      loadTargets();
    })
    .catch(function() { msg.textContent = 'Save failed.'; });
});

document.getElementById('target-form').addEventListener('submit', function(e) {
  e.preventDefault();
  fetch('/api/targets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: document.getElementById('tname').value,
      target_amount: parseFloat(document.getElementById('tamount').value),
      years: parseFloat(document.getElementById('tyears').value),
      notes: document.getElementById('tnotes').value
    })
  }).then(function(r) {
    if (!r.ok) return r.json().then(function(d) { throw new Error(d.error || 'Failed'); });
    return r.json();
  }).then(function() {
    showToast('Target added successfully!', 'success');
    document.getElementById('tname').value = '';
    document.getElementById('tamount').value = '';
    document.getElementById('tyears').value = '';
    document.getElementById('tnotes').value = '';
    loadTargets();
  }).catch(function(e) {
    showToast(e.message || 'Could not add target.', 'error');
  });
});

loadProfile();
loadTargets();
