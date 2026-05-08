// ===== CONFIG =====
const CONFIG = {
  // Cole aqui a URL do Web App do Google Apps Script (termina em /exec)
  GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/AKfycby2XpGo-Vaa_oF6GfcbKiNvJww0O5zWVmVupr7rOTf8xyDp0J6bjCoVAG6IhSGclTzk/exec',
  WHATSAPP_NUMBER: '5521990023321',
  WHATSAPP_MESSAGE: 'Olá, preenchi o formulário no site e gostaria ter minha alavancada.'
};

// ===== Footer year =====
document.getElementById('year').textContent = new Date().getFullYear();

// ===== WhatsApp fallback link =====
const waFallback = document.getElementById('wa-fallback');
if (waFallback) {
  waFallback.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(CONFIG.WHATSAPP_MESSAGE)}`;
}

// ===== Multi-step form =====
(function () {
  const form = document.getElementById('apply-form');
  if (!form) return;

  const steps = Array.from(form.querySelectorAll('.form-step'));
  const totalSteps = steps.length;
  const fill = document.getElementById('progress-fill');
  const stepLabel = document.getElementById('progress-step');
  const totalLabel = document.getElementById('progress-total');
  const btnBack = document.getElementById('btn-back');
  const btnNext = document.getElementById('btn-next');
  const btnSubmit = document.getElementById('btn-submit');
  const successCard = document.getElementById('success-card');

  totalLabel.textContent = totalSteps;
  let currentStep = 1;

  function showStep(n) {
    steps.forEach(s => s.classList.toggle('active', Number(s.dataset.step) === n));
    fill.style.width = `${(n / totalSteps) * 100}%`;
    stepLabel.textContent = n;
    btnBack.style.visibility = n === 1 ? 'hidden' : 'visible';
    if (n === totalSteps) {
      btnNext.style.display = 'none';
      btnSubmit.style.display = 'inline-flex';
    } else {
      btnNext.style.display = 'inline-flex';
      btnSubmit.style.display = 'none';
    }
  }

  function clearError(name) {
    const el = form.querySelector(`[data-error="${name}"]`);
    if (el) el.textContent = '';
  }

  function setError(name, msg) {
    const el = form.querySelector(`[data-error="${name}"]`);
    if (el) el.textContent = msg;
  }

  function validateStep(n) {
    const data = new FormData(form);
    let ok = true;
    const validators = {
      1: () => {
        const v = (data.get('name') || '').toString().trim();
        clearError('name');
        if (v.length < 2) { setError('name', 'Digite seu nome completo'); return false; }
        if (v.length > 80) { setError('name', 'Nome muito longo'); return false; }
        return true;
      },
      2: () => {
        const v = (data.get('phone') || '').toString().replace(/\D/g, '');
        clearError('phone');
        if (v.length < 10) { setError('phone', 'Digite um número válido'); return false; }
        if (v.length > 13) { setError('phone', 'Número muito longo'); return false; }
        return true;
      },
      3: () => {
        const v = (data.get('email') || '').toString().trim();
        clearError('email');
        if (!v) { setError('email', 'Digite seu e-mail'); return false; }
        if (v.length > 120) { setError('email', 'E-mail muito longo'); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setError('email', 'E-mail inválido'); return false; }
        return true;
      },
      4: () => {
        const v = (data.get('instagram') || '').toString().trim().replace(/^@/, '');
        clearError('instagram');
        if (v.length < 2) { setError('instagram', 'Digite o @ da sua loja'); return false; }
        return true;
      },
      5: () => {
        clearError('status');
        if (!data.get('status')) { setError('status', 'Selecione uma opção'); return false; }
        return true;
      },
      6: () => {
        clearError('revenue');
        clearError('amount');
        let pass = true;
        if (!data.get('revenue')) { setError('revenue', 'Selecione seu faturamento'); pass = false; }
        if (!data.get('amount')) { setError('amount', 'Selecione uma opção'); pass = false; }
        return pass;
      }
    };
    if (validators[n]) ok = validators[n]();
    return ok;
  }

  btnNext.addEventListener('click', () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < totalSteps) {
      currentStep++;
      showStep(currentStep);
    }
  });

  btnBack.addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep--;
      showStep(currentStep);
    }
  });

  // Phone mask
  const phoneInput = form.querySelector('input[name="phone"]');
  if (phoneInput) {
    phoneInput.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
      else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
      else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5}).*/, '($1) $2');
      else if (v.length > 0) v = v.replace(/(\d{0,2})/, '($1');
      e.target.value = v;
    });
  }

  // Instagram strip @
  const igInput = form.querySelector('input[name="instagram"]');
  if (igInput) {
    igInput.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/^@+/, '').replace(/\s+/g, '');
    });
  }

  // Submit
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    const data = Object.fromEntries(new FormData(form).entries());
    data.timestamp = new Date().toISOString();
    data.page = window.location.href;

    // Disable submit button
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Enviando...';

    // 1) Send to Google Sheets (Apps Script Web App)
    try {
      if (CONFIG.GOOGLE_SHEETS_URL && !CONFIG.GOOGLE_SHEETS_URL.startsWith('COLE_AQUI')) {
        await fetch(CONFIG.GOOGLE_SHEETS_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(data)
        });
      }
    } catch (err) {
      console.warn('Falha ao enviar para Google Sheets:', err);
    }

    // 2) Show success card
    form.style.display = 'none';
    successCard.style.display = 'block';
    successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 3) Redirect to WhatsApp
    const waUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(CONFIG.WHATSAPP_MESSAGE)}`;
    setTimeout(() => { window.location.href = waUrl; }, 1200);

    console.log('Lead capturado:', data);
  });

  showStep(1);
})();

// ===== Smooth scroll for hash links (extra safety on older browsers) =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length > 1) {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});
