// Mobile nav
const burger = document.querySelector('.burger');
const links = document.querySelector('.links');
burger.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
});
links.addEventListener('click', e => {
  if (e.target.tagName === 'A') { links.classList.remove('open'); burger.classList.remove('open'); }
});

// Menu category tabs
const tabs = document.querySelectorAll('.tab');
const cards = document.querySelectorAll('.card');
function filter(cat) {
  tabs.forEach(t => t.classList.toggle('active', t.dataset.cat === cat));
  cards.forEach(c => c.classList.toggle('hide', cat !== 'all' && c.dataset.cat !== cat));
}
tabs.forEach(t => t.addEventListener('click', () => filter(t.dataset.cat)));
filter('tea');

// Nutrition facts toggle
document.querySelectorAll('.facts-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const open = btn.nextElementSibling.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
});

// Demo contact form (no backend yet)
const form = document.getElementById('contactForm');
const status = form.querySelector('.status');
form.addEventListener('submit', e => {
  e.preventDefault();
  if (!form.checkValidity()) {
    status.textContent = 'Please fill in every field so we can reply.';
    return;
  }
  status.textContent = 'Message sent. Thanks, we\u2019ll be in touch soon.';
  form.reset();
});

// Build your order (demo prices: edit the numbers below)
const $ = s => document.querySelector(s);
const money = n => '$' + n.toFixed(2);
const SIZES = ['16 oz', '24 oz', '32 oz'];
const BASES = {                       // price per size
  'Loaded tea':     [4.50, 5.50, 6.50],
  'Energy drink':   [4.00, 5.00, 6.00],
  'Aloe refresher': [4.50, 5.50, 6.50],
  'Shake':          [6.50, 7.50, 8.50]
};
const FLAVORS = ['Strawberry','Peach mango','Green apple','Blue raspberry','Pineapple','Watermelon','Pomegranate','Cotton candy','Vanilla cookie','Mint chip'];
const EXTRA_FLAVOR = 0.50;            // each flavor after the first
const ENERGY = [['Regular',0],['Light',0],['Extra energy',1.00]];
const SWEET  = [['Regular',0],['Less sweet',0],['Sugar-free',0]];
const ADDINS = [['Protein boost',1.50],['Aloe shot',0.75],['Popping pearls',0.75],['Whipped topping',0.50]];

function chips(id, type, name, opts) {
  $(id).insertAdjacentHTML('beforeend', opts.map(([label, price], i) =>
    `<label class="chip"><input type="${type}" name="${name}" value="${label}"${type === 'radio' && i === 0 && ['energy','sweet'].includes(name) ? ' checked' : ''}><span>${label}${price ? ' +' + money(price) : ''}</span></label>`
  ).join(''));
}
chips('#g-base', 'radio', 'base', Object.keys(BASES).map(b => [b, 0]));
chips('#g-size', 'radio', 'size', SIZES.map(s => [s, 0]));
chips('#g-flavor', 'checkbox', 'flavor', FLAVORS.map(f => [f, 0]));
chips('#g-energy', 'radio', 'energy', ENERGY);
chips('#g-sweet', 'radio', 'sweet', SWEET);
chips('#g-addin', 'checkbox', 'addin', ADDINS);

const bform = $('#builder');
const addBtn = $('#addBtn');
const hint = $('#hint');
let qty = 1;
let cart = [];

function current() {
  const fd = new FormData(bform);
  const base = fd.get('base'), size = fd.get('size');
  if (!base || !size) return null;
  const flavors = fd.getAll('flavor');
  const energy = fd.get('energy'), sweet = fd.get('sweet');
  const addins = fd.getAll('addin');
  let unit = BASES[base][SIZES.indexOf(size)];
  unit += Math.max(0, flavors.length - 1) * EXTRA_FLAVOR;
  unit += ENERGY.find(e => e[0] === energy)[1];
  addins.forEach(a => unit += ADDINS.find(x => x[0] === a)[1]);
  const name = `${size} ${base}`;
  const detail = [flavors.join(', ') || 'No flavor', energy + ' energy', sweet + ' sweet', ...addins].join(' \u00b7 ');
  return { name, detail, unit };
}

function refresh() {
  // cap flavors at 3
  const boxes = [...bform.querySelectorAll('input[name=flavor]')];
  const n = boxes.filter(b => b.checked).length;
  boxes.forEach(b => b.disabled = !b.checked && n >= 3);
  const c = current();
  addBtn.disabled = !c;
  hint.textContent = c ? `This drink: ${money(c.unit * qty)}` : 'Pick a base and size to start.';
}
bform.addEventListener('change', refresh);
$('#qMinus').addEventListener('click', () => { qty = Math.max(1, qty - 1); $('#qVal').textContent = qty; refresh(); });
$('#qPlus').addEventListener('click', () => { qty = Math.min(20, qty + 1); $('#qVal').textContent = qty; refresh(); });

addBtn.addEventListener('click', () => {
  const c = current();
  if (!c) return;
  cart.push({ ...c, qty });
  qty = 1; $('#qVal').textContent = 1;
  renderCart();
  refresh();
});

function renderCart() {
  const list = $('#cart');
  list.innerHTML = cart.length ? cart.map((it, i) =>
    `<li><div><b>${it.qty > 1 ? it.qty + ' x ' : ''}${it.name}</b><span>${it.detail}</span></div><div class="r"><b>${money(it.unit * it.qty)}</b><button type="button" data-i="${i}">Remove</button></div></li>`
  ).join('') : '<li class="empty">Nothing yet. Build a drink and add it.</li>';
  const drinks = cart.reduce((s, it) => s + it.qty, 0);
  $('#count').textContent = `${drinks} drink${drinks === 1 ? '' : 's'}`;
  $('#total').textContent = money(cart.reduce((s, it) => s + it.unit * it.qty, 0));
}
$('#cart').addEventListener('click', e => {
  if (e.target.dataset.i !== undefined) { cart.splice(+e.target.dataset.i, 1); renderCart(); }
});

$('#copyBtn').addEventListener('click', async e => {
  if (!cart.length) { e.target.textContent = 'Add a drink first'; setTimeout(() => e.target.textContent = 'Copy order', 1600); return; }
  const text = 'Spartan Nutrition order\n' + cart.map(it => `${it.qty} x ${it.name} (${it.detail}) ${money(it.unit * it.qty)}`).join('\n') + `\nSubtotal: ${$('#total').textContent} before tax`;
  try { await navigator.clipboard.writeText(text); e.target.textContent = 'Copied'; }
  catch { e.target.textContent = 'Copy not available'; }
  setTimeout(() => e.target.textContent = 'Copy order', 1600);
});
refresh();

// Spartan helmet follower: drifts along the right side, trails scroll like a butterfly,
// tilts with scroll speed, and recolors per section (set data-helm / data-tip in the HTML).
(() => {
  const helm = document.getElementById('helm');
  if (!helm) return;
  const tip = helm.querySelector('.helm-tip');
  const marks = [...document.querySelectorAll('[data-helm]')];
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  let tops = [], x = 0, y = 0, tilt = 0, svel = 0, last = scrollY, cur = -1, tipTimer;

  function measure() {
    tops = marks.map(m => m.getBoundingClientRect().top + scrollY);
  }
  function section(yDoc) {
    let idx = 0;
    tops.forEach((t, i) => { if (yDoc >= t) idx = i; });
    return idx;
  }
  function paint(i) {
    if (i === cur) return;
    cur = i;
    helm.style.setProperty('--accent', marks[i].dataset.helm);
    tip.textContent = marks[i].dataset.tip || '';
    tip.classList.add('show');
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => tip.classList.remove('show'), 2200);
  }
  function target(now) {
    const w = innerWidth, h = innerHeight, size = helm.offsetWidth;
    const max = Math.max(1, document.documentElement.scrollHeight - h);
    const p = scrollY / max;
    const lane = Math.min(w * 0.3, 320);
    const tx = w - size - 12 - (0.5 + 0.5 * Math.sin(p * Math.PI * 8)) * lane;
    const ty = h * 0.68 - clamp(svel * 5, -140, 140) + Math.sin(now / 550) * 9;
    return [tx, ty];
  }
  function frame(now) {
    const dy = scrollY - last; last = scrollY;
    svel += (dy - svel) * 0.15;
    const [tx, ty] = target(now);
    x += (tx - x) * 0.07;
    y += (ty - y) * 0.09;
    tilt += (clamp(svel * 1.4, -25, 25) + clamp((tx - x) * 0.15, -15, 15) - tilt) * 0.1;
    helm.style.transform = `translate3d(${x}px,${y}px,0) rotate(${tilt}deg)`;
    paint(section(scrollY + y + helm.offsetHeight / 2));
    requestAnimationFrame(frame);
  }
  function park() {
    x = innerWidth - helm.offsetWidth - 12;
    y = innerHeight - helm.offsetHeight - 12;
    helm.style.transform = `translate3d(${x}px,${y}px,0)`;
    paint(section(scrollY + y + helm.offsetHeight / 2));
  }

  measure();
  addEventListener('resize', () => { measure(); if (still) park(); });
  addEventListener('load', measure);
  if (still) { addEventListener('scroll', park, { passive: true }); park(); return; }
  [x, y] = target(performance.now());
  requestAnimationFrame(frame);
})();
