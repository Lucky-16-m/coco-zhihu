(() => {
  if (document.getElementById('coco-root')) return;
  const root = document.createElement('div'); root.id = 'coco-root';
  root.innerHTML = `<div class="coco-panel"><div class="coco-head"><b>CoCo · 灵魂匹配</b><button class="coco-close">×</button></div><div class="coco-body"><div class="coco-muted">先填写资料，CoCo 会结合上下文生成不重复的追问。</div><div id="coco-register"><input id="coco-name" class="coco-input" placeholder="昵称"><input id="coco-age" class="coco-input" placeholder="年龄"><input id="coco-interest" class="coco-input" placeholder="基础兴趣"></div><p id="coco-question">点击开始探索</p><textarea id="coco-answer" class="coco-input" placeholder="写下你的真实想法"></textarea><div class="coco-status" id="coco-status"></div><button id="coco-submit" class="coco-btn">开始探索</button><div id="coco-results"></div></div></div>`;
  document.body.appendChild(root);
  const state = {profile: {}, history: [], used_questions: [], question: '填写资料后开始', started: false, finished: false};
  const $ = id => root.querySelector(id); const status = text => $('#coco-status').textContent = text;
  function renderQuestion() { $('#coco-question').textContent = state.question; $('#coco-answer').value = ''; $('#coco-submit').textContent = state.started ? '提交并继续' : '开始探索'; $('#coco-register').style.display = state.started ? 'none' : 'block'; }
  function showResults(items) { $('#coco-results').innerHTML = (items || []).slice(0, 5).map(item => `<div class="coco-item"><a target="_blank" href="${item.url}">${item.title}</a><div class="coco-muted">综合评分 ${item.score || 0} · ${item.votes} 赞 · ${item.comments} 评论</div></div>`).join('') || '<p class="coco-muted">暂未找到相关内容。</p>'; }
  async function request(type, payload) { return new Promise(resolve => chrome.runtime.sendMessage({type, ...payload}, resolve)); }
  $('#coco-submit').onclick = async () => {
    const answer = $('#coco-answer').value.trim();
    if (!state.started) { const name=$('#coco-name').value.trim(),age=$('#coco-age').value.trim(),interest=$('#coco-interest').value.trim(); if(!name||!age||!interest)return status('请先完成昵称、年龄和兴趣'); state.profile={name,age,interest}; state.started=true; state.question=`${interest} 对你来说最有吸引力的地方是什么？`; state.used_questions.push(state.question); renderQuestion(); status('CoCo 已启动'); return; }
    if (!answer) return status('请先输入回答');
    state.history.push({question: state.question, answer}); $('#coco-submit').disabled = true; status('正在生成下一题…');
    const context = {profile: state.profile, history: state.history, used_questions: state.used_questions};
    const [next, recommendations] = await Promise.all([request('coco-next', {payload: context}), request('coco-search', {query: [state.profile.interest,...state.history.map(item => item.answer)].join(' ')})]);
    if (recommendations?.ok) showResults(recommendations.items); let candidate=next?.ok&&next.result?.question?next.result.question:`关于${state.profile.interest}，你更愿意从个人经历、价值判断还是未来期待谈起？`; if(state.used_questions.includes(candidate))candidate=`换个维度：${state.profile.interest} 如何影响了你最近的一次选择？`; state.used_questions.push(candidate); state.question=candidate;
    if(state.history.length>=5){state.finished=true;state.question='探索完成 · 你的 CoCo 画像已生成';$('#coco-submit').textContent='已完成';$('#coco-submit').disabled=true;$('#coco-answer').style.display='none';$('#coco-status').textContent='已完成 5 个维度，可查看右侧知乎推荐';return;}
    $('#coco-submit').disabled = false; renderQuestion(); status('已根据你的回答更新');
  };
  $('.coco-close').onclick = () => root.remove(); renderQuestion();
})();
