const { SUPABASE_URL, SUPABASE_KEY } = window.APP_CONFIG || {};
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (id) => document.getElementById(id);
let currentUser = null;
let action = 'login';

// ---- 認証 ----
$('auth-form').querySelectorAll('button').forEach((b) =>
  b.addEventListener('click', () => (action = b.dataset.action))
);

$('auth-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('email').value.trim();
  const password = $('password').value;
  $('auth-msg').textContent = '';

  if (action === 'signup') {
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: location.origin + location.pathname },
    });
    if (error) return ($('auth-msg').textContent = error.message);
    if (!data.session) $('auth-msg').textContent = '確認メールを送りました。メール内のリンクを開いてからログインしてください。';
  } else {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) $('auth-msg').textContent = error.message;
  }
});

$('logout').addEventListener('click', () => sb.auth.signOut());

sb.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user ?? null;
  $('auth-view').hidden = !!currentUser;
  $('app-view').hidden = !currentUser;
  if (currentUser) {
    $('me').textContent = currentUser.email;
    loadTimeline();
  }
});

// ---- 投稿 ----
$('content').addEventListener('input', () => {
  $('count').textContent = `${$('content').value.length} / 280`;
});

$('post-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = $('content').value.trim();
  if (!content) return;
  const btn = e.submitter;
  btn.disabled = true;
  const { error } = await sb.from('posts').insert({ content });
  btn.disabled = false;
  if (error) return ($('post-msg').textContent = error.message);
  $('post-msg').textContent = '';
  $('content').value = '';
  $('count').textContent = '0 / 280';
  loadTimeline();
});

async function loadTimeline() {
  const { data, error } = await sb
    .from('posts')
    .select('id, user_id, user_email, content, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return ($('post-msg').textContent = error.message);

  const ul = $('timeline');
  ul.replaceChildren();
  for (const p of data) {
    const li = document.createElement('li');
    const meta = document.createElement('div');
    meta.className = 'meta';
    const who = document.createElement('span');
    who.textContent = `${p.user_email.split('@')[0]} · ${new Date(p.created_at).toLocaleString('ja-JP')}`;
    meta.append(who);
    if (p.user_id === currentUser?.id) {
      const edit = document.createElement('button');
      edit.className = 'del';
      edit.textContent = '編集';
      edit.onclick = async () => {
        const next = prompt('編集', p.content);
        if (next === null || !next.trim() || next.length > 280) return;
        const { error } = await sb.from('posts').update({ content: next.trim() }).eq('id', p.id);
        if (error) $('post-msg').textContent = error.message;
        loadTimeline();
      };
      meta.append(edit);
      const del = document.createElement('button');
      del.className = 'del';
      del.textContent = '削除';
      del.onclick = async () => {
        if (!confirm('削除しますか？')) return;
        await sb.from('posts').delete().eq('id', p.id);
        loadTimeline();
      };
      meta.append(del);
    }
    const body = document.createElement('div');
    body.className = 'body';
    body.textContent = p.content;
    li.append(meta, body);
    ul.append(li);
  }
}
