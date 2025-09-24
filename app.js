"use strict";

// ---------- Data Catalog ----------
const Catalog = {
  anomalies: [
    {
      id: "anomaly_call_behavior",
      name: "IRSF_通话行为异常检测",
      type: "anomaly",
      desc: "发现高频、短呼、夜间突发等行为异常",
      features: ["通话次数","通话时长","短呼比例","通话时段分布","通话间隔集中度"],
      methods: ["统计基线","时序突变","多维距离"],
      default: { threshold: 0.8, confidence: 0.88, filter: true }
    },
    {
      id: "anomaly_number_concentration",
      name: "IRSF_号码集中度异常检测",
      type: "anomaly",
      desc: "发现集中拨打少数高费率号码的模式",
      features: ["唯一被叫数","目的地集中度","重复被叫比","Top K 占比","高风险前缀占比"],
      methods: ["统计偏离","局部离群因子","聚类检测"],
      default: { threshold: 0.85, confidence: 0.91, filter: true }
    },
    {
      id: "anomaly_fee",
      name: "IRSF_通话费用异常检测",
      type: "anomaly",
      desc: "发现费率异常、费用突增、高费率集中",
      features: ["平均费率","高费率比例","高费率目的地集中度","费用突增"],
      methods: ["统计偏离","距离型检测","组合规则"],
      default: { threshold: 0.8, confidence: 0.86, filter: false }
    }
  ],
  classifiers: [
    { id: "clf_irsf_xgb", name: "IRSF(XGBoost)", type: "classifier", supervised: true, default: { confidence: 0.93, weight: 0.3 } },
    { id: "clf_irsf_if", name: "IRSF(Isolation Forest)", type: "classifier", supervised: false, default: { confidence: 0.91, weight: 0.25 } },
    { id: "clf_wangiri_xgb", name: "Wangiri(XGBoost)", type: "classifier", supervised: true, default: { confidence: 0.90, weight: 0.15 } },
    { id: "clf_spoof_xgb", name: "Caller ID Spoofing(XGBoost)", type: "classifier", supervised: true, default: { confidence: 0.89, weight: 0.15 } },
    { id: "clf_spoof_resnet", name: "Caller ID Spoofing(ResNet)", type: "classifier", supervised: true, default: { confidence: 0.88, weight: 0.1 } },
    { id: "clf_smishing_dbscan", name: "Smishing(DBSCAN)", type: "classifier", supervised: false, default: { confidence: 0.84, weight: 0.1 } },
    { id: "clf_smishing_qwen", name: "Smishing(Qwen3-32B)", type: "classifier", supervised: true, default: { confidence: 0.92, weight: 0.2 } }
  ],
  rules: [
    { id: "rule_blacklist", name: "黑名单/高风险号段", type: "filter", default: { source: "第三方/系统分析", action: "block" } },
    { id: "rule_threshold_short", name: "短呼比例阈值", type: "rule", default: { metric: "短呼比例", ranges: [[0.0,0.2,0.1],[0.2,0.5,0.5],[0.5,1.0,0.9]] } },
    { id: "rule_high_tariff", name: "高费率比例阈值", type: "rule", default: { metric: "高费率比例", ranges: [[0,0.1,0.2],[0.1,0.3,0.6],[0.3,1.0,0.95]] } }
  ],
  operators: [
    { id: "op_filter", name: "数据过滤", type: "filter", default: { key: "置信度", cmp: ">=", value: 0.8 } },
    { id: "op_score", name: "综合评分", type: "score", default: { method: "weighted" } }
  ]
};

// ---------- DOM helpers ----------
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

function createEl(tag, attrs = {}, children = []){
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if (k === "dataset") { Object.assign(el.dataset, v); return; }
    if (k === "class") { el.className = v; return; }
    if (k === "text") { el.textContent = v; return; }
    el.setAttribute(k, v);
  });
  children.forEach(c=> el.appendChild(c));
  return el;
}

// ---------- Sidebar rendering ----------
function renderCatalog(){
  const anomalyList = $('#list-anomaly');
  const clfList = $('#list-classifier');
  const ruleList = $('#list-rules');
  const opList = $('#list-operators');
  [anomalyList, clfList, ruleList, opList].forEach(ul=> ul.innerHTML = "");

  Catalog.anomalies.forEach(item=> anomalyList.appendChild(renderListItem(item)));
  Catalog.classifiers.forEach(item=> clfList.appendChild(renderListItem(item)));
  Catalog.rules.forEach(item=> ruleList.appendChild(renderListItem(item)));
  Catalog.operators.forEach(item=> opList.appendChild(renderListItem(item)));
}

function renderListItem(item){
  const li = createEl('li', { draggable: true, class: 'draggable' });
  li.dataset.id = item.id;
  li.dataset.type = item.type;
  li.append(
    createEl('span', { text: item.name }),
    createEl('span', { class: 'badge', text: labelForType(item) })
  );
  li.addEventListener('dragstart', e => {
    e.dataTransfer.setData('application/x-node', JSON.stringify(item));
  });
  return li;
}

function labelForType(item){
  switch(item.type){
    case 'anomaly': return '异常检测';
    case 'classifier': return item.supervised ? '有监督' : '无监督';
    case 'rule': return '特征规则';
    case 'filter': return '过滤';
    case 'score': return '评分';
    default: return '算子';
  }
}

// ---------- Canvas state ----------
const CanvasState = {
  nodes: [], // {id, x, y, label, type, meta}
  edges: [], // {fromId, toId}
  selectedId: null
};

let nodeAutoId = 1;

function initCanvas(){
  const canvas = $('#canvas');
  canvas.addEventListener('dragover', e => e.preventDefault());
  canvas.addEventListener('drop', onDropToCanvas);
  canvas.addEventListener('click', (e)=>{
    if (e.target.closest('.node')) return; // click empty space
    selectNode(null);
  });
}

function onDropToCanvas(e){
  e.preventDefault();
  const raw = e.dataTransfer.getData('application/x-node');
  if(!raw) return;
  const item = JSON.parse(raw);
  const rect = $('#canvas').getBoundingClientRect();
  addNode({
    x: e.clientX - rect.left + $('#canvas').scrollLeft,
    y: e.clientY - rect.top + $('#canvas').scrollTop,
    item
  });
}

function addNode({x,y,item}){
  const id = `N${nodeAutoId++}`;
  const node = {
    id,
    x, y,
    label: item.name,
    type: item.type,
    catalogId: item.id,
    meta: JSON.parse(JSON.stringify(item.default || {}))
  };
  CanvasState.nodes.push(node);
  renderNode(node);
  selectNode(id);
}

function renderNode(node){
  const tpl = $('#tpl-node');
  const root = tpl.content.firstElementChild.cloneNode(true);
  root.dataset.nodeId = node.id;
  root.style.left = `${node.x}px`;
  root.style.top = `${node.y}px`;
  $('.node-title', root).textContent = node.label;
  $('.node-type', root).textContent = typeDisplay(node.type);
  $('.node-body', root).textContent = summaryForNode(node);

  enableDragMove(root, node);
  root.addEventListener('click', (e)=>{ e.stopPropagation(); selectNode(node.id); });

  $('#canvas').appendChild(root);
}

function typeDisplay(t){
  const map = { anomaly:'异常检测', classifier:'分类模型', rule:'特征规则', filter:'数据过滤', score:'综合评分' };
  return map[t] || t;
}

function summaryForNode(node){
  const m = node.meta || {};
  if(node.type === 'filter') return `阈值: ${m.key||'置信度'} ${m.cmp||'>='} ${m.value ?? 0.8}`;
  if(node.type === 'score') return `方法: ${m.method || 'weighted'}`;
  if(node.type === 'rule') return `${m.metric||'指标'} 按区间赋置信度`;
  return `置信度~${(m.confidence ?? 0.9)}`;
}

function enableDragMove(el, node){
  let startX, startY, originX, originY;
  el.addEventListener('mousedown', (e)=>{
    if(e.target.closest('.port')) return;
    startX = e.clientX; startY = e.clientY; originX = node.x; originY = node.y;
    const onMove = (ev)=>{
      const dx = ev.clientX - startX; const dy = ev.clientY - startY;
      node.x = originX + dx; node.y = originY + dy; el.style.left = `${node.x}px`; el.style.top = `${node.y}px`;
      redrawEdges();
    };
    const onUp = ()=>{ window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });

  // edge connection (out -> in) by click sequence
  const outPort = $('.port.out', el);
  const inPort = $('.port.in', el);
  outPort.addEventListener('click', (e)=>{ e.stopPropagation(); startConnect(node.id); });
  inPort.addEventListener('click', (e)=>{ e.stopPropagation(); finishConnect(node.id); });
}

let pendingFromId = null;
function startConnect(fromId){ pendingFromId = fromId; }
function finishConnect(toId){
  if(!pendingFromId || pendingFromId === toId) return;
  CanvasState.edges.push({ fromId: pendingFromId, toId });
  pendingFromId = null;
  redrawEdges();
}

function redrawEdges(){
  const canvas = $('#canvas');
  $$('.edge', canvas).forEach(e=> e.remove());
  CanvasState.edges.forEach(edge=>{
    const from = $(`.node[data-node-id="${edge.fromId}"]`);
    const to = $(`.node[data-node-id="${edge.toId}"]`);
    if(!from || !to) return;
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const c = canvas.getBoundingClientRect();
    const x1 = a.right - c.left - 24 + canvas.scrollLeft;
    const y1 = a.bottom - c.top - 16 + canvas.scrollTop;
    const x2 = b.left - c.left + 24 + canvas.scrollLeft;
    const y2 = b.top - c.top + 24 + canvas.scrollTop;
    drawEdge(canvas, x1, y1, x2, y2);
  });
}

function drawEdge(parent, x1, y1, x2, y2){
  const dx = x2 - x1; const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const edge = createEl('div', { class: 'edge' });
  edge.style.left = `${x1}px`;
  edge.style.top = `${y1}px`;
  edge.style.width = `${len}px`;
  edge.style.transform = `rotate(${angle}deg)`;
  parent.appendChild(edge);
}

function selectNode(id){
  CanvasState.selectedId = id;
  $$('.node').forEach(n=> n.classList.toggle('selected', n.dataset.nodeId === id));
  renderConfig(id);
}

// ---------- Configuration forms ----------
function renderConfig(id){
  const body = $('#config-body');
  body.classList.remove('empty');
  body.innerHTML = '';
  if(!id){
    body.classList.add('empty');
    body.textContent = '请选择节点以配置参数。';
    return;
  }
  const node = CanvasState.nodes.find(n=> n.id === id);
  if(!node) return;

  body.appendChild(createEl('div', { class: 'field-row' }, [ createEl('label', { text: '名称' }), createEl('input', { value: node.label, oninput: '' }) ]));
  const nameInput = body.querySelector('input');
  nameInput.addEventListener('input', ()=>{ node.label = nameInput.value; $(`.node[data-node-id="${id}"] .node-title`).textContent = node.label; });

  if(node.type === 'filter'){
    body.appendChild(renderSelectRow('字段', ['置信度','统计值','业务类型'], node.meta.key || '置信度', (v)=>{ node.meta.key = v; refreshSummary(node); }));
    body.appendChild(renderSelectRow('比较', ['>=','>','<=','<','==','!='], node.meta.cmp || '>=', (v)=>{ node.meta.cmp = v; refreshSummary(node); }));
    body.appendChild(renderInputRow('阈值', node.meta.value ?? 0.8, (v)=>{ node.meta.value = parseFloat(v)||0; refreshSummary(node); }));
  } else if(node.type === 'rule'){
    body.appendChild(renderInputRow('指标', node.meta.metric || '指标', (v)=>{ node.meta.metric=v; refreshSummary(node); }));
    const rangesWrap = createEl('div');
    (node.meta.ranges||[]).forEach((r,i)=>{
      const row = createEl('div', { class: 'weight-row' });
      const input = createEl('input', { value: `[${r[0]},${r[1]}] -> ${r[2]}` });
      row.appendChild(input);
      const btn = createEl('button', { text: '删除' });
      btn.addEventListener('click', ()=>{ node.meta.ranges.splice(i,1); renderConfig(id); refreshSummary(node); });
      row.appendChild(btn);
      rangesWrap.appendChild(row);
      input.addEventListener('change', ()=>{ try{ const m=input.value.match(/\[(.*),(.*)\]\s*->\s*(.*)/); node.meta.ranges[i]=[parseFloat(m[1]),parseFloat(m[2]),parseFloat(m[3])]; }catch(e){} });
    });
    body.appendChild(rangesWrap);
    const addBtn = createEl('button', { text: '新增区间' });
    addBtn.addEventListener('click', ()=>{ (node.meta.ranges = node.meta.ranges || []).push([0,1,0.5]); renderConfig(id); });
    body.appendChild(addBtn);
  } else if(node.type === 'score'){
    body.appendChild(renderSelectRow('方法', ['max','mean','weighted','bayes'], node.meta.method || 'weighted', (v)=>{ node.meta.method=v; refreshSummary(node); }));
    if((node.meta.method||'weighted')==='weighted'){
      const wrap = createEl('div');
      const weights = buildDefaultWeights();
      Object.entries(weights).forEach(([nid, w])=>{
        const row = createEl('div', { class: 'weight-row' }, [
          createEl('input', { value: `${getNodeLabel(nid)}`, disabled: true }),
          createEl('input', { value: w, type: 'number', step: '0.05', min: '0' })
        ]);
        const input = row.lastElementChild;
        input.addEventListener('input', ()=>{ node.meta.weights = node.meta.weights || {}; node.meta.weights[nid] = parseFloat(input.value)||0; });
        wrap.appendChild(row);
      });
      body.appendChild(wrap);
    }
  } else {
    // anomaly/classifier
    body.appendChild(renderInputRow('置信度', node.meta.confidence ?? 0.9, (v)=>{ node.meta.confidence=parseFloat(v)||0; refreshSummary(node); }));
  }
}

function renderSelectRow(label, options, value, onChange){
  const row = createEl('div', { class: 'field-row' });
  const sel = createEl('select');
  options.forEach(o=> sel.appendChild(createEl('option', { value: o, text: o })));
  sel.value = value;
  sel.addEventListener('change', ()=> onChange(sel.value));
  row.appendChild(createEl('label', { text: label }));
  row.appendChild(sel);
  return row;
}

function renderInputRow(label, value, onChange){
  const row = createEl('div', { class: 'field-row' });
  const input = createEl('input', { value: value });
  input.addEventListener('input', ()=> onChange(input.value));
  row.appendChild(createEl('label', { text: label }));
  row.appendChild(input);
  return row;
}

function refreshSummary(node){
  const n = $(`.node[data-node-id="${node.id}"] .node-body`);
  if(n) n.textContent = summaryForNode(node);
}

function getNodeLabel(id){
  return (CanvasState.nodes.find(n=> n.id===id)||{}).label || id;
}

function buildDefaultWeights(){
  const m = {};
  CanvasState.nodes.filter(n=> n.type!=='score').forEach(n=>{ m[n.id] = (n.meta && n.meta.weight) || 0.2; });
  return Object.assign(m, (CanvasState.nodes.find(n=> n.type==='score')||{}).meta?.weights || {});
}

// ---------- Scoring Preview ----------
$('#btn-preview').addEventListener('click', ()=>{
  const method = $('#score-method').value;
  const nodes = CanvasState.nodes;
  const kept = nodes.filter(n=> passFilter(n));
  const confidences = kept.filter(n=> ['anomaly','classifier','rule'].includes(n.type)).map(n=> n.meta.confidence ?? estimateConfidenceFromRule(n));
  let score = 0;
  if(method==='max') score = Math.max(0, ...confidences);
  else if(method==='mean') score = (confidences.reduce((a,b)=>a+b,0) / Math.max(1, confidences.length));
  else if(method==='weighted'){
    const weights = buildDefaultWeights();
    const sumW = kept.reduce((s,n)=> s + (n.type==='score'?0:(weights[n.id]||0)), 0) || 1;
    score = kept.reduce((s,n)=> s + (n.type==='score'?0: (n.meta.confidence ?? estimateConfidenceFromRule(n)) * (weights[n.id]||0)), 0) / sumW;
  } else if(method==='bayes'){
    // naive bayes fusion: assume independence, p = 1 - prod(1-ci)
    score = 1 - confidences.reduce((p,c)=> p*(1-c), 1);
  }
  const level = mapRisk(score, readIntervals());
  alert(`样本综合置信度: ${score.toFixed(3)}\n风险等级: ${level}`);
});

function passFilter(n){
  // global filter operator nodes
  const filters = CanvasState.nodes.filter(x=> x.type==='filter');
  for(const f of filters){
    const key = (f.meta.key||'置信度');
    const value = key==='置信度' ? (n.meta.confidence ?? 0) : 0.5; // demo only
    const cmp = f.meta.cmp||'>='; const th = Number(f.meta.value ?? 0.8);
    if(!compare(value, cmp, th)) return false;
  }
  return true;
}

function compare(a,op,b){
  switch(op){ case '>=': return a>=b; case '>': return a>b; case '<=': return a<=b; case '<': return a<b; case '==': return a==b; case '!=': return a!=b; default: return true; }
}

function estimateConfidenceFromRule(n){
  // simple midpoint of top interval for demo
  const ranges = n.meta.ranges || [[0,1,0.5]];
  return ranges[ranges.length-1][2] || 0.5;
}

function readIntervals(){
  const obj = {};
  $$('.intervals input').forEach(i=> obj[i.dataset.range] = i.value);
  return obj;
}

function mapRisk(score, intervals){
  const pairs = [
    ['高风险','high'],['中风险','mid'],['低风险','low'],['无风险','safe']
  ];
  for(const [label,key] of pairs){
    const s = intervals[key];
    const m = s.match(/\[\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\s*\)?/);
    if(!m) continue; const a=parseFloat(m[1]), b=parseFloat(m[2]);
    if((score>=a) && (score<=b + 1e-9)) return label;
  }
  return '未知';
}

// ---------- Toolbar actions ----------
$('#btn-clear').addEventListener('click', ()=>{
  CanvasState.nodes = []; CanvasState.edges = []; CanvasState.selectedId = null;
  $('#canvas').innerHTML = '';
});

$('#btn-auto-connect').addEventListener('click', ()=>{
  // simple left-to-right ordering
  CanvasState.edges = [];
  const ordered = [...CanvasState.nodes].sort((a,b)=> a.x - b.x);
  for(let i=0;i<ordered.length-1;i++) CanvasState.edges.push({ fromId: ordered[i].id, toId: ordered[i+1].id });
  redrawEdges();
});

// ---------- Export / Import ----------
$('#btn-export').addEventListener('click', ()=>{
  const data = JSON.stringify({ nodes: CanvasState.nodes, edges: CanvasState.edges }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'irsf_flow.json'; a.click(); URL.revokeObjectURL(a.href);
});

$('#btn-import').addEventListener('click', ()=> $('#hidden-file').click());
$('#hidden-file').addEventListener('change', (e)=>{
  const file = e.target.files[0]; if(!file) return;
  file.text().then(t=>{
    try{
      const obj = JSON.parse(t);
      CanvasState.nodes = obj.nodes || []; CanvasState.edges = obj.edges || [];
      $('#canvas').innerHTML = '';
      CanvasState.nodes.forEach(renderNode);
      redrawEdges();
    }catch(err){ alert('导入失败: ' + err.message); }
  });
});

// ---------- Search in catalogs ----------
$('#catalog-search').addEventListener('input', (e)=>{
  const q = e.target.value.trim();
  ['#list-anomaly','#list-classifier','#list-rules','#list-operators'].forEach(sel=>{
    $$(sel+' li').forEach(li=>{
      const show = !q || (li.textContent.toLowerCase().includes(q.toLowerCase()));
      li.style.display = show ? '' : 'none';
    });
  });
});

// ---------- Boot ----------
renderCatalog();
initCanvas();

