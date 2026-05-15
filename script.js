// ============================================================
// ELECTRIC HERO CANVAS — interactive animated background
// ============================================================
const canvas = document.getElementById("heroCanvas");
const ctx = canvas.getContext("2d");

let W, H, mouse = { x: -9999, y: -9999 };

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);
canvas.addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener("mouseleave", () => { mouse.x = -9999; mouse.y = -9999; });

// ── Nodes (charge points) ─────────────────────────────────────
const NODE_COUNT = 55;
const nodes = Array.from({ length: NODE_COUNT }, () => ({
  x:  Math.random() * window.innerWidth,
  y:  Math.random() * window.innerHeight,
  vx: (Math.random() - 0.5) * 0.45,
  vy: (Math.random() - 0.5) * 0.45,
  r:  1.5 + Math.random() * 2,
  pulse: Math.random() * Math.PI * 2,
}));

// ── Lightning bolt state ──────────────────────────────────────
const bolts = [];
let boltTimer = 0;
const BOLT_INTERVAL = 90;

function makeBolt(x1, y1, x2, y2, depth) {
  const segs = [];
  function split(ax, ay, bx, by, d) {
    if (d === 0) { segs.push([ax, ay, bx, by]); return; }
    const mx = (ax + bx) / 2 + (Math.random() - 0.5) * 60 / d;
    const my = (ay + by) / 2 + (Math.random() - 0.5) * 60 / d;
    split(ax, ay, mx, my, d - 1);
    split(mx, my, bx, by, d - 1);
  }
  split(x1, y1, x2, y2, depth);
  return segs;
}

// ── Ripple rings ──────────────────────────────────────────────
const ripples = [];
function addRipple(x, y) {
  ripples.push({ x, y, r: 0, alpha: 0.6 });
}

const MAX_DIST   = 160;
const MOUSE_DIST = 200;

// ── Draw loop ─────────────────────────────────────────────────
function draw() {
  requestAnimationFrame(draw);

  // Deep navy base
  ctx.fillStyle = "#03051e";
  ctx.fillRect(0, 0, W, H);

  // Subtle grid
  ctx.strokeStyle = "rgba(50, 80, 180, 0.07)";
  ctx.lineWidth = 0.5;
  const GRID = 55;
  for (let x = 0; x < W; x += GRID) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += GRID) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // ── Move nodes ──────────────────────────────────────────────
  for (const n of nodes) {
    n.x += n.vx;
    n.y += n.vy;
    n.pulse += 0.025;
    if (n.x < 0 || n.x > W) n.vx *= -1;
    if (n.y < 0 || n.y > H) n.vy *= -1;
    const dx = n.x - mouse.x, dy = n.y - mouse.y;
    const md = Math.sqrt(dx * dx + dy * dy);
    if (md < 120) { n.x += (dx / md) * 1.8; n.y += (dy / md) * 1.8; }
  }

  // ── Connection lines between close nodes ────────────────────
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MAX_DIST) {
        const alpha = (1 - dist / MAX_DIST) * 0.35;
        ctx.strokeStyle = `rgba(122, 162, 255, ${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }

  // ── Mouse to nearest nodes ───────────────────────────────────
  for (const n of nodes) {
    const dx = n.x - mouse.x, dy = n.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < MOUSE_DIST) {
      const alpha = (1 - dist / MOUSE_DIST) * 0.55;
      ctx.strokeStyle = `rgba(255, 228, 77, ${alpha})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(n.x, n.y); ctx.stroke();
    }
  }

  // ── Draw nodes ───────────────────────────────────────────────
  for (const n of nodes) {
    const glow = 0.55 + Math.sin(n.pulse) * 0.35;
    const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5);
    grad.addColorStop(0, `rgba(100, 140, 255, ${glow * 0.4})`);
    grad.addColorStop(1, "rgba(100, 140, 255, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(180, 210, 255, ${glow})`;
    ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
  }

  // ── Random lightning bolts ────────────────────────────────────
  boltTimer++;
  if (boltTimer >= BOLT_INTERVAL) {
    boltTimer = 0;
    const a = nodes[Math.floor(Math.random() * nodes.length)];
    const b = nodes[Math.floor(Math.random() * nodes.length)];
    if (a !== b) {
      bolts.push({ segs: makeBolt(a.x, a.y, b.x, b.y, 4), life: 18, maxLife: 18 });
      addRipple(a.x, a.y);
      addRipple(b.x, b.y);
    }
  }

  // ── Draw bolts ────────────────────────────────────────────────
  for (let i = bolts.length - 1; i >= 0; i--) {
    const bolt = bolts[i];
    const alpha = bolt.life / bolt.maxLife;
    ctx.shadowColor = "rgba(255, 220, 60, 0.8)";
    ctx.shadowBlur = 8 * alpha;
    ctx.strokeStyle = `rgba(255, 240, 120, ${alpha * 0.9})`;
    ctx.lineWidth = 1.2 * alpha;
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of bolt.segs) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
    ctx.stroke();
    ctx.shadowColor = "rgba(80, 140, 255, 0.6)";
    ctx.shadowBlur = 14 * alpha;
    ctx.strokeStyle = `rgba(100, 160, 255, ${alpha * 0.5})`;
    ctx.lineWidth = 3 * alpha;
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of bolt.segs) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
    ctx.stroke();
    ctx.shadowBlur = 0;
    bolt.life--;
    if (bolt.life <= 0) bolts.splice(i, 1);
  }

  // ── Draw ripples ──────────────────────────────────────────────
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];
    rp.r += 3.5;
    rp.alpha -= 0.025;
    if (rp.alpha <= 0) { ripples.splice(i, 1); continue; }
    ctx.strokeStyle = `rgba(255, 228, 77, ${rp.alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2); ctx.stroke();
  }
}

draw();

// Click to fire a bolt from cursor to nearest node
canvas.addEventListener("click", e => {
  let closest = null, minD = Infinity;
  for (const n of nodes) {
    const dx = n.x - e.clientX, dy = n.y - e.clientY;
    const d = dx * dx + dy * dy;
    if (d < minD) { minD = d; closest = n; }
  }
  if (closest) {
    bolts.push({ segs: makeBolt(e.clientX, e.clientY, closest.x, closest.y, 4), life: 22, maxLife: 22 });
    addRipple(e.clientX, e.clientY);
    addRipple(closest.x, closest.y);
  }
});

// ============================================================
// SVG LINE OVERLAY
// ============================================================
const svg = document.querySelector(".flux-svg");
const svgW = window.innerWidth;
const svgH = window.innerHeight;
svg.setAttribute("viewBox", `0 0 ${svgW} ${svgH}`);
for (let i = 0; i < 20; i++) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", Math.random() * svgW);
  line.setAttribute("y1", Math.random() * svgH);
  line.setAttribute("x2", Math.random() * svgW);
  line.setAttribute("y2", Math.random() * svgH);
  line.setAttribute("stroke", "#7aa2ff");
  line.setAttribute("stroke-width", "0.4");
  line.setAttribute("opacity", "0.15");
  svg.appendChild(line);
}

// ============================================================
// SCROLL ANIMATION FOR HERO TEXT
// ============================================================
const heroText = document.querySelector(".hero-content");

window.addEventListener("scroll", () => {
  const progress = Math.min(window.scrollY / window.innerHeight, 1);
  heroText.style.opacity = 1 - progress * 0.6;
  heroText.style.transform = `translateY(calc(-50% - ${progress * 50}px))`;
  if (progress > 0.05) {
    const a1 = (0.9 - progress * 0.9).toFixed(2);
    const a2 = (0.7 - progress * 0.7).toFixed(2);
    heroText.style.textShadow = `0 0 12px rgba(255,228,77,${a1}), 0 0 30px rgba(255,200,0,${a2})`;
  } else {
    heroText.style.textShadow = "";
  }
});

// ============================================================
// FADE IN ON LOAD
// ============================================================
window.addEventListener("load", () => {
  heroText.style.opacity = 0;
  heroText.style.transform = "translateY(-40%)";
  setTimeout(() => {
    heroText.style.transition = "all 1s ease";
    heroText.style.opacity = 1;
    heroText.style.transform = "translateY(-50%)";
  }, 200);
});

// ============================================================
// SCROLL REVEAL FOR INFO SECTIONS — staggered child reveals
// ============================================================

// Mark each reveal-section's animatable children before any observer fires
document.querySelectorAll(".reveal-section").forEach(section => {
  // Each section starts fully visible at the section level (no whole-section fade)
  // so we remove the class-based opacity and let children animate instead
  section.classList.add("reveal-ready");

  const children = [
    ...section.querySelectorAll(".section-label"),
    ...section.querySelectorAll(".section-heading-row, .section-heading"),
    ...section.querySelectorAll(".section-left"),
    ...section.querySelectorAll(".section-right"),
    ...section.querySelectorAll(".benefit-card"),
    ...section.querySelectorAll(".how-video-col"),
    ...section.querySelectorAll(".steps-list"),
  ];

  // Deduplicate (section-heading may already be inside section-left)
  const seen = new Set();
  const unique = children.filter(el => {
    if (seen.has(el)) return false;
    // Skip if a closer ancestor is already in the list
    for (const other of seen) {
      if (other.contains(el)) return false;
    }
    seen.add(el);
    return true;
  });

  unique.forEach((el, i) => {
    el.classList.add("reveal-child");
    el.style.transitionDelay = (i * 90) + "ms";
  });
});

const revealObserver = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Reveal section wrapper (handles border/background if any)
      entry.target.classList.add("visible");
      // Stagger-reveal each marked child
      entry.target.querySelectorAll(".reveal-child").forEach(child => {
        child.classList.add("visible");
      });
      revealObserver.unobserve(entry.target);
    }
  }),
  { threshold: 0.08 }
);

document.querySelectorAll(".reveal-section").forEach(s => revealObserver.observe(s));


// ============================================================
// ELECTRIC DEMO ENGINE - pure JS port of optimization_engine.py
// ============================================================

const DEMO_DEFAULT_APPLIANCES = {
  "Refrigerator":    { watts: 200,  priority: 10, hours_per_use: 24,  unit_label: "day",     default_desired_uses: 30 },
  "Air Conditioner": { watts: 1500, priority: 8,  hours_per_use: 8,   unit_label: "night",   default_desired_uses: 8  },
  "Gaming PC":       { watts: 600,  priority: 4,  hours_per_use: 3,   unit_label: "session", default_desired_uses: 10 },
  "LED Bulb":        { watts: 15,   priority: 7,  hours_per_use: 5,   unit_label: "day",     default_desired_uses: 20 },
  "Router":          { watts: 12,   priority: 9,  hours_per_use: 24,  unit_label: "day",     default_desired_uses: 30 },
  "Washing Machine": { watts: 500,  priority: 3,  hours_per_use: 1.5, unit_label: "wash",    default_desired_uses: 6  },
};

const PIE_COLORS = [
  "#2451F3","#FFE44D","#7aa2ff","#ff9f43","#48dbfb",
  "#ff6b81","#1dd1a1","#f368e0","#54a0ff","#feca57",
];

function demoCostPerUse(app, rate) {
  return (parseFloat(app.watts) / 1000) * parseFloat(app.hours_per_use) * parseFloat(rate) * parseInt(app.quantity);
}

function demoOptimize(user) {
  const budget = parseFloat(user.budget);
  const rate   = parseFloat(user.rate);
  const apps   = user.appliances;

  if (!apps.length) return { status: "Failed", error: "No appliances added." };
  if (!(budget > 0)) return { status: "Failed", error: "Budget must be greater than zero." };

  const plan = apps.map(function(app, idx) {
    var cpu      = demoCostPerUse(app, rate);
    var desired  = Math.max(0, parseInt(app.desired_uses) || 0);
    var priority = Math.max(1, parseInt(app.priority) || 5);
    return {
      index: idx,
      name: app.name,
      priority: priority,
      unit_label: app.unit_label || "use",
      desired_uses: desired,
      allowed_uses: 0,
      cost_per_use_raw: cpu,
      cost_per_use: Math.round(cpu * 100) / 100,
      score: cpu > 0 ? priority / cpu : priority,
    };
  });

  plan.sort(function(a, b) {
    if (b.score !== a.score) return b.score - a.score;
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.cost_per_use_raw - b.cost_per_use_raw;
  });

  var remaining = budget;
  for (var i = 0; i < plan.length; i++) {
    var item = plan[i];
    if (item.cost_per_use_raw <= 0) continue;
    var allowed = Math.min(item.desired_uses, Math.floor((remaining + 1e-9) / item.cost_per_use_raw));
    item.allowed_uses = allowed;
    remaining -= allowed * item.cost_per_use_raw;
  }

  var totalPriority = plan.reduce(function(s, x) { return s + x.priority; }, 0) || 1;
  var totalCost = 0;
  for (var j = 0; j < plan.length; j++) {
    var it = plan[j];
    var c = it.allowed_uses * it.cost_per_use_raw;
    it.cost = Math.round(c * 100) / 100;
    totalCost += c;
    it.priority_share = Math.round((it.priority / totalPriority) * 1000) / 10;
    delete it.score;
    delete it.cost_per_use_raw;
  }

  plan.sort(function(a, b) { return a.index - b.index; });

  return {
    status: "Success",
    optimized_plan: plan,
    total_cost: Math.round(totalCost * 100) / 100,
    budget_remaining: Math.round(Math.max(0, budget - totalCost) * 100) / 100,
  };
}

function demoWhatIf(user, applianceName, extraUses) {
  var clone = JSON.parse(JSON.stringify(user));
  var target = null;
  for (var i = 0; i < clone.appliances.length; i++) {
    if (clone.appliances[i].name === applianceName) { target = clone.appliances[i]; break; }
  }
  if (!target) return { success: false, error: "Appliance not found." };
  target.desired_uses = (parseInt(target.desired_uses) || 0) + parseInt(extraUses);
  var result = demoOptimize(clone);
  return { success: result.status === "Success", result: result };
}

// -- State --
var demoAppliances = [];
var activePresets  = {};
var lastOptimized  = null;

function demoFmt(n) {
  return "J$" + parseFloat(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function demoGetEl(id) { return document.getElementById(id); }

// -- Build preset chips --
function buildPresetChips() {
  var wrap = demoGetEl("demo-preset-chips");
  if (!wrap) return;
  wrap.innerHTML = "";
  var names = Object.keys(DEMO_DEFAULT_APPLIANCES);
  for (var i = 0; i < names.length; i++) {
    (function(name) {
      var chip = document.createElement("button");
      chip.className = "demo-preset-chip";
      chip.textContent = name;
      chip.id = "chip-" + name.replace(/\s+/g, "-");
      chip.addEventListener("click", function() { togglePreset(name); });
      wrap.appendChild(chip);
    })(names[i]);
  }
}

function togglePreset(name) {
  var chip = document.getElementById("chip-" + name.replace(/\s+/g, "-"));
  if (activePresets[name]) {
    delete activePresets[name];
    if (chip) chip.classList.remove("active");
    demoAppliances = demoAppliances.filter(function(a) { return a._preset !== name; });
  } else {
    activePresets[name] = true;
    if (chip) chip.classList.add("active");
    var meta = DEMO_DEFAULT_APPLIANCES[name];
    demoAppliances.push({
      _preset: name,
      name: name,
      watts: meta.watts,
      hours_per_use: meta.hours_per_use,
      unit_label: meta.unit_label,
      desired_uses: meta.default_desired_uses,
      quantity: 1,
      priority: meta.priority,
    });
  }
  renderDemoApplianceList();
}

// -- Render appliance rows --
function renderDemoApplianceList() {
  var list = demoGetEl("demo-appliance-list");
  if (!list) return;
  list.innerHTML = "";
  if (!demoAppliances.length) return;

  var hdr = document.createElement("div");
  hdr.className = "demo-row-header";
  hdr.innerHTML = "<span>Appliance</span><span>Watts</span><span>Desired Uses</span><span>Hrs/Use</span><span>Priority</span><span></span>";
  list.appendChild(hdr);

  for (var i = 0; i < demoAppliances.length; i++) {
    (function(idx) {
      var app = demoAppliances[idx];
      var row = document.createElement("div");
      row.className = "demo-appliance-row";
      row.innerHTML =
        '<input type="text"   value="' + app.name          + '" placeholder="Name"    data-field="name"          data-i="' + idx + '" />' +
        '<input type="number" value="' + app.watts         + '" placeholder="Watts"   data-field="watts"         data-i="' + idx + '" min="1" />' +
        '<input type="number" value="' + app.desired_uses  + '" placeholder="Uses"    data-field="desired_uses"  data-i="' + idx + '" min="0" />' +
        '<input type="number" value="' + app.hours_per_use + '" placeholder="Hrs"     data-field="hours_per_use" data-i="' + idx + '" min="0.1" step="0.5" />' +
        '<input type="number" value="' + app.priority      + '" placeholder="1-10"    data-field="priority"      data-i="' + idx + '" min="1" max="10" />' +
        '<button class="demo-remove-btn" data-i="' + idx + '">x</button>';
      list.appendChild(row);

      var inputs = row.querySelectorAll("input[data-field]");
      for (var k = 0; k < inputs.length; k++) {
        inputs[k].addEventListener("input", function(e) {
          var fi = parseInt(e.target.getAttribute("data-i"));
          var field = e.target.getAttribute("data-field");
          demoAppliances[fi][field] = field === "name" ? e.target.value : (parseFloat(e.target.value) || 0);
        });
      }

      var removeBtn = row.querySelector(".demo-remove-btn");
      removeBtn.addEventListener("click", function(e) {
        var ri = parseInt(e.target.getAttribute("data-i"));
        var removed = demoAppliances[ri];
        if (removed._preset) {
          delete activePresets[removed._preset];
          var c = document.getElementById("chip-" + removed._preset.replace(/\s+/g, "-"));
          if (c) c.classList.remove("active");
        }
        demoAppliances.splice(ri, 1);
        renderDemoApplianceList();
      });
    })(i);
  }
}

// -- Run optimizer --
function runDemoOptimizer() {
  var errEl = demoGetEl("demo-error");
  if (errEl) errEl.textContent = "";

  var budgetEl = demoGetEl("demo-budget");
  var rateEl   = demoGetEl("demo-rate");
  var daysEl   = demoGetEl("demo-days");

  var budget = parseFloat(budgetEl ? budgetEl.value : 0);
  var rate   = parseFloat(rateEl   ? rateEl.value   : 45.46) || 45.46;
  var days   = parseInt(daysEl     ? daysEl.value   : 30)    || 30;

  if (!(budget > 0)) {
    if (errEl) errEl.textContent = "Please enter a valid monthly budget.";
    return;
  }
  if (!demoAppliances.length) {
    if (errEl) errEl.textContent = "Add at least one appliance.";
    return;
  }

  var user = {
    budget: budget,
    rate:   rate,
    days:   days,
    appliances: demoAppliances.map(function(a) {
      return {
        name:         String(a.name || ""),
        watts:        parseFloat(a.watts)         || 0,
        hours_per_use:parseFloat(a.hours_per_use) || 1,
        desired_uses: parseInt(a.desired_uses)    || 0,
        quantity:     parseInt(a.quantity)        || 1,
        priority:     parseInt(a.priority)        || 5,
        unit_label:   a.unit_label || "use",
      };
    })
  };

  var result = demoOptimize(user);
  if (result.status !== "Success") {
    if (errEl) errEl.textContent = result.error;
    return;
  }

  lastOptimized = { user: user, result: result };
  renderDemoResults(user, result);

  var resEl = demoGetEl("demo-results");
  if (resEl) resEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

// -- Render results --
function renderDemoResults(user, result) {
  var res = demoGetEl("demo-results");
  if (!res) return;
  res.style.display = "block";

  var pct = Math.round((result.total_cost / user.budget) * 100);
  var metaEl = demoGetEl("demo-results-meta");
  if (metaEl) {
    metaEl.innerHTML =
      "Total: <strong>" + demoFmt(result.total_cost) + "</strong> of <strong>" + demoFmt(user.budget) + "</strong> budget &nbsp;|&nbsp; " +
      "Remaining: <strong>" + demoFmt(result.budget_remaining) + "</strong> &nbsp;(" + pct + "% used)";
  }

  var tableEl = demoGetEl("demo-results-table");
  if (tableEl) {
    tableEl.innerHTML =
      "<thead><tr>" +
        "<th>Appliance</th><th>Allocated</th><th>Desired</th>" +
        "<th>Cost/Use</th><th>Total Cost</th><th>Usage</th>" +
      "</tr></thead>" +
      "<tbody id='demo-results-tbody'></tbody>";

    var tbody = demoGetEl("demo-results-tbody");
    for (var i = 0; i < result.optimized_plan.length; i++) {
      var item = result.optimized_plan[i];
      var itemPct  = item.desired_uses <= 0 ? 100 : Math.min(100, Math.round((item.allowed_uses / item.desired_uses) * 100));
      var over = itemPct >= 100;
      var tr = document.createElement("tr");
      tr.innerHTML =
        '<td class="demo-name-cell">' + item.name + '</td>' +
        '<td>' + item.allowed_uses + ' ' + item.unit_label + (item.allowed_uses !== 1 ? "s" : "") + '</td>' +
        '<td style="color:rgba(187,186,251,0.5)">' + item.desired_uses + ' ' + item.unit_label + (item.desired_uses !== 1 ? "s" : "") + '</td>' +
        '<td>' + demoFmt(item.cost_per_use) + '</td>' +
        '<td class="demo-cost-cell">' + demoFmt(item.cost) + '</td>' +
        '<td><div class="demo-usage-bar-wrap">' +
          '<div class="demo-usage-bar-bg"><div class="demo-usage-bar-fill ' + (over ? "over" : "") + '" style="width:' + itemPct + '%"></div></div>' +
          '<div class="demo-pct-label">' + itemPct + '%</div>' +
        '</div></td>';
      tbody.appendChild(tr);
    }
  }

  drawDemoPie(result.optimized_plan);

  var wiSel = demoGetEl("whatif-appliance");
  if (wiSel) {
    wiSel.innerHTML = "";
    for (var j = 0; j < result.optimized_plan.length; j++) {
      var opt = document.createElement("option");
      opt.value = result.optimized_plan[j].name;
      opt.textContent = result.optimized_plan[j].name;
      wiSel.appendChild(opt);
    }
  }

  var wiRes = demoGetEl("demo-whatif-result");
  if (wiRes) wiRes.innerHTML = "";
}

// -- Pie chart --
function drawDemoPie(plan) {
  var canvas = demoGetEl("demo-pie-chart");
  if (!canvas) return;
  var ctx2 = canvas.getContext("2d");
  var cx = 130, cy = 130, r = 110;
  ctx2.clearRect(0, 0, 260, 260);

  var total = 0;
  for (var i = 0; i < plan.length; i++) total += plan[i].cost;
  if (total <= 0) total = 1;

  var angle = -Math.PI / 2;
  for (var j = 0; j < plan.length; j++) {
    var slice = (plan[j].cost / total) * Math.PI * 2;
    ctx2.beginPath();
    ctx2.moveTo(cx, cy);
    ctx2.arc(cx, cy, r, angle, angle + slice);
    ctx2.closePath();
    ctx2.fillStyle = PIE_COLORS[j % PIE_COLORS.length];
    ctx2.fill();
    ctx2.strokeStyle = "#04062e";
    ctx2.lineWidth = 2;
    ctx2.stroke();
    angle += slice;
  }

  ctx2.beginPath();
  ctx2.arc(cx, cy, 52, 0, Math.PI * 2);
  ctx2.fillStyle = "#04062e";
  ctx2.fill();

  var legend = demoGetEl("demo-chart-legend");
  if (legend) {
    legend.innerHTML = "";
    for (var k = 0; k < plan.length; k++) {
      var p = Math.round((plan[k].cost / total) * 100);
      var div = document.createElement("div");
      div.className = "demo-legend-item";
      div.innerHTML =
        '<div class="demo-legend-dot" style="background:' + PIE_COLORS[k % PIE_COLORS.length] + '"></div>' +
        '<span class="demo-legend-name">' + plan[k].name + '</span>' +
        '<span class="demo-legend-pct">' + p + '%</span>';
      legend.appendChild(div);
    }
  }
}

// -- Wire up buttons after DOM ready --
document.addEventListener("DOMContentLoaded", function() {
  buildPresetChips();

  var addCustomBtn = demoGetEl("demo-add-custom");
  if (addCustomBtn) {
    addCustomBtn.addEventListener("click", function() {
      demoAppliances.push({
        name: "", watts: 100, desired_uses: 10,
        hours_per_use: 1, unit_label: "use", quantity: 1, priority: 5,
      });
      renderDemoApplianceList();
      var list = demoGetEl("demo-appliance-list");
      if (list && list.lastElementChild) {
        var firstInput = list.lastElementChild.querySelector("input");
        if (firstInput) firstInput.focus();
      }
    });
  }

  var runBtn = demoGetEl("demo-run-btn");
  if (runBtn) {
    runBtn.addEventListener("click", runDemoOptimizer);
  }

  var whatifBtn = demoGetEl("demo-whatif-btn");
  if (whatifBtn) {
    whatifBtn.addEventListener("click", function() {
      if (!lastOptimized) return;
      var appName = demoGetEl("whatif-appliance") ? demoGetEl("whatif-appliance").value : "";
      var extra   = parseInt(demoGetEl("whatif-extra") ? demoGetEl("whatif-extra").value : 0) || 0;
      var resultEl = demoGetEl("demo-whatif-result");
      if (!resultEl) return;

      if (extra <= 0) {
        resultEl.innerHTML = '<div class="demo-whatif-card"><em style="color:#ff7070">Enter extra uses greater than 0.</em></div>';
        return;
      }

      var wi = demoWhatIf(lastOptimized.user, appName, extra);
      if (!wi.success) {
        resultEl.innerHTML = '<div class="demo-whatif-card"><em style="color:#ff7070">' + ((wi.result && wi.result.error) || "Optimization failed.") + '</em></div>';
        return;
      }

      var r    = wi.result;
      var over = r.total_cost > lastOptimized.user.budget;
      var diff = Math.abs(r.total_cost - lastOptimized.result.total_cost);
      var ul   = lastOptimized.user.appliances.filter(function(a) { return a.name === appName; });
      var unitLabel = ul.length ? ul[0].unit_label : "use";

      resultEl.innerHTML =
        '<div class="demo-whatif-card ' + (over ? "over" : "") + '">' +
          '<div class="demo-whatif-stat"><span>Scenario: +' + extra + ' ' + unitLabel + '(s) of ' + appName + '</span></div>' +
          '<div class="demo-whatif-stat ' + (over ? "over" : "") + '"><span>New Total Cost</span><span>' + demoFmt(r.total_cost) + '</span></div>' +
          '<div class="demo-whatif-stat"><span>Budget Remaining</span><span>' + demoFmt(r.budget_remaining) + '</span></div>' +
          '<div class="demo-whatif-stat"><span>Cost Increase</span><span>+' + demoFmt(diff) + '</span></div>' +
          '<div style="margin-top:10px;font-size:12.5px;color:' + (over ? "#ff7070" : "#1dd1a1") + '">' +
            (over ? "Warning: This scenario exceeds your budget." : "This scenario stays within your budget.") +
          '</div>' +
        '</div>';
    });
  }
});