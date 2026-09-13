(() => {
  if (document.getElementById('coco-root')) return;
  const root = document.createElement('div'); root.id = 'coco-root';
  root.innerHTML = `<div class="coco-panel"><div class="coco-head"><b>CoCo · 灵魂匹配</b><button class="coco-close">×</button></div><div class="coco-body"><div class="coco-muted">在知乎页面中，回答几个问题，获得你的兴趣标签与内容推荐。</div><p id="coco-question">点击开始探索</p><textarea id="coco-answer" class="coco-input" placeholder="写下你的真实想法"></textarea><div class="coco-status" id="coco-status"></div><button id="coco-submit" class="coco-btn">开始探索</button><div id="coco-results"></div></div></div>`;
  document.body.appendChild(root);
  const state = {profile: {}, history: [], question: '你的注册资料会帮助 CoCo 设计第一道问题', started: false};
  const $ = id => root.querySelector(id); const status = text => $('#coco-status').textContent = text;
  function renderQuestion() { $('#coco-question').textContent = state.question; $('#coco-answer').value = ''; $('#coco-submit').textContent = state.started ? '提交并继续' : '开始探索'; }
  function showResults(items) { $('#coco-results').innerHTML = (items || []).slice(0, 5).map(item => `<div class="coco-item"><a target="_blank" href="${item.url}">${item.title}</a><div class="coco-muted">综合评分 ${item.score || 0} · ${item.votes} 赞 · ${item.comments} 评论</div></div>`).join('') || '<p class="coco-muted">暂未找到相关内容。</p>'; }
  async function request(type, payload) { return new Promise(resolve => chrome.runtime.sendMessage({type, ...payload}, resolve)); }
  $('#coco-submit').onclick = async () => {
    const answer = $('#coco-answer').value.trim();
    if (!state.started) { state.started = true; state.question = '你最希望在知乎上持续看到哪类内容？'; renderQuestion(); status('已启动，先回答这个问题'); return; }
    if (!answer) return status('请先输入回答');
    state.history.push({question: state.question, answer}); $('#coco-submit').disabled = true; status('正在生成下一题…');
    const context = {profile: state.profile, history: state.history};
    const [next, recommendations] = await Promise.all([request('coco-next', {payload: context}), request('coco-search', {query: state.history.map(item => item.answer).join(' ')})]);
    if (recommendations?.ok) showResults(recommendations.items); if (next?.ok && next.result?.question) state.question = next.result.question; else state.question = '换一个角度：这个兴趣与你的哪段经历有关？';
    $('#coco-submit').disabled = false; renderQuestion(); status('已根据你的回答更新');
  };
  $('.coco-close').onclick = () => root.remove(); renderQuestion();
})();
