(() => {
  if (document.getElementById('coco-root')) return;
  const root = document.createElement('div'); root.id = 'coco-root';
  root.innerHTML = `<div class="coco-panel"><div class="coco-head"><b>CoCo · 灵魂匹配</b><button class="coco-close">×</button></div><div class="coco-body"><div class="coco-muted">先填写资料，CoCo 会结合上下文生成不重复的追问。</div><div id="coco-register"><input id="coco-name" class="coco-input" placeholder="昵称"><input id="coco-age" class="coco-input" placeholder="年龄"><input id="coco-interest" class="coco-input" placeholder="基础兴趣"></div><p id="coco-question">点击开始探索</p><textarea id="coco-answer" class="coco-input" placeholder="写下你的真实想法"></textarea><div class="coco-status" id="coco-status"></div><button id="coco-submit" class="coco-btn">开始探索</button><div id="coco-results"></div></div></div>`;
  document.body.appendChild(root);
  const state = {profile: {}, history: [], used_questions: [], used_dimensions: [], question: '填写资料后开始', started: false, finished: false};
  const $ = id => root.querySelector(id); const status = text => $('#coco-status').textContent = text;
  function renderQuestion() { $('#coco-question').textContent = state.question; $('#coco-answer').value = ''; $('#coco-submit').textContent = state.started ? '提交并继续' : '开始探索'; $('#coco-register').style.display = state.started ? 'none' : 'block'; }
  function showResults(items) { $('#coco-results').innerHTML = (items || []).slice(0, 5).map(item => `<div class="coco-item"><a target="_blank" href="${item.url}">${item.title}</a><div class="coco-muted">综合评分 ${item.score || 0} · ${item.votes} 赞 · ${item.comments} 评论</div></div>`).join('') || '<p class="coco-muted">暂未找到相关内容。</p>'; }
  async function request(type, payload) { return new Promise(resolve => chrome.runtime.sendMessage({type, ...payload}, resolve)); }
  $('#coco-submit').onclick = async () => {
    const answer = $('#coco-answer').value.trim();
    if (!state.started) { const name=$('#coco-name').value.trim(),age=$('#coco-age').value.trim(),interest=$('#coco-interest').value.trim(); if(!name||!age||!interest)return status('请先完成昵称、年龄和兴趣'); state.profile={name,age,interest}; state.started=true; state.question=`${interest} 对你来说最有吸引力的地方是什么？`; state.used_questions.push(state.question); renderQuestion(); status('CoCo 已启动'); return; }
    if (!answer) return status('请先输入回答');
    state.history.push({question: state.question, answer}); $('#coco-submit').disabled = true; status('正在生成下一题…');
    const context = {profile: state.profile, history: state.history, used_questions: state.used_questions, used_dimensions: state.used_dimensions};
    const [next, recommendations] = await Promise.all([request('coco-next', {payload: context}), request('coco-search', {query: [state.profile.interest,...state.history.map(item => item.answer)].join(' ')})]);
    if (recommendations?.ok) showResults(recommendations.items); let candidate=next?.ok&&next.result?.question?next.result.question:''; let dimension=next?.ok&&next.result?.dimension?next.result.dimension:''; if(!candidate||state.used_questions.some(item=>similar(item,candidate))||state.used_dimensions.includes(dimension)) { const fallback=fallbackQuestion(answer); candidate=fallback.question; dimension=fallback.dimension; } state.used_questions.push(candidate);state.used_dimensions.push(dimension);state.question=candidate;
    if(state.history.length>=5){state.finished=true;state.question='探索完成 · 你的 CoCo 画像已生成';$('#coco-submit').textContent='已完成';$('#coco-submit').disabled=true;$('#coco-answer').style.display='none';$('#coco-status').textContent='已完成 5 个维度，可查看右侧知乎推荐';return;}
    $('#coco-submit').disabled = false; renderQuestion(); status('已根据你的回答更新');
  };
  function similar(a,b){const words=[...new Set((a+b).match(/[\u4e00-\u9fa5A-Za-z0-9]{2,}/g)||[])];return words.length>0&&words.filter(word=>a.includes(word)&&b.includes(word)).length/words.length>.55}
  function fallbackQuestion(answer){const text=answer+' '+state.profile.interest;const used=state.used_questions.join(' ');const candidates=[{dimension:'兴趣来源',question:`${state.profile.interest} 是从什么时候开始进入你的生活的？发生过什么转折？`},{dimension:'具体经历',question:`关于${state.profile.interest}，哪一次亲身经历最能代表你和它的关系？`},{dimension:'价值判断',question:`在${state.profile.interest}相关话题中，有什么观点是你坚持但很多人未必理解的？`},{dimension:'社交方式',question:`如果和一个同好交流${state.profile.interest}，你希望对方先分享什么，而不是先问你什么？`},{dimension:'情绪需求',question:`当你接触${state.profile.interest}时，你通常想获得陪伴、启发、放松，还是被理解？为什么？`}];return candidates.find(x=>!used.includes(x.question)&&!state.used_dimensions.includes(x.dimension))||{dimension:'未来期待',question:`未来一年，你希望${state.profile.interest}在你的生活里发生什么变化？`}}
  $('.coco-close').onclick = () => root.remove(); renderQuestion();
})();
