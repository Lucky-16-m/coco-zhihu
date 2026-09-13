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
    if (recommendations?.ok) showResults(recommendations.items); let candidate=next?.ok&&next.result?.question?next.result.question:''; if(!candidate||state.used_questions.some(item=>similar(item,candidate)))candidate=fallbackQuestion(answer); state.used_questions.push(candidate); state.question=candidate;
    if(state.history.length>=5){state.finished=true;state.question='探索完成 · 你的 CoCo 画像已生成';$('#coco-submit').textContent='已完成';$('#coco-submit').disabled=true;$('#coco-answer').style.display='none';$('#coco-status').textContent='已完成 5 个维度，可查看右侧知乎推荐';return;}
    $('#coco-submit').disabled = false; renderQuestion(); status('已根据你的回答更新');
  };
  function similar(a,b){const words=[...new Set((a+b).match(/[\u4e00-\u9fa5A-Za-z0-9]{2,}/g)||[])];return words.length>0&&words.filter(word=>a.includes(word)&&b.includes(word)).length/words.length>.55}
  function fallbackQuestion(answer){const text=answer+' '+state.profile.interest;const used=state.used_questions.join(' ');const candidates=[];if(/音乐|歌|旋律|歌词/.test(text))candidates.push('你提到音乐：哪一次听歌经历让你改变了对某个人或某件事的看法？','如果要把你的音乐偏好推荐给一个陌生人，你会怎样解释它背后的你？');if(/电影|书|阅读|故事/.test(text))candidates.push('你提到内容：最近哪个作品让你产生了不同于大众的判断？','如果和同好深入聊一个作品，你最想追问对方哪一点？');if(/朋友|社交|孤独|聊天/.test(text))candidates.push('在人际关系里，你通常先观察什么信号，才决定继续靠近？','你理想中的深度交流，最不能缺少哪一种回应？');candidates.push(`关于${state.profile.interest}，它在你生活中最具体的一次影响是什么？`,`如果把${state.profile.interest}变成一次共同体验，你希望和别人完成什么？`,`你在${state.profile.interest}上的看法，是什么经历让它发生过变化？`);return candidates.find(q=>!used.includes(q))||`换一个角度：${state.profile.interest}与你未来想成为的人有什么关系？`}
  $('.coco-close').onclick = () => root.remove(); renderQuestion();
})();
