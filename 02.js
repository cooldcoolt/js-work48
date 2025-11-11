

    let userEmail = '';
    let profile = { firstName: 'John', lastName: 'Doe' };
    let posts = [];
    let lastDatetime = null;
    let pollInterval = null;
    const baseHost = 'http://146.185.154.90:8000/blog';

    const loader = document.getElementById('loader');
    const emailInput = document.getElementById('email');
    const startBtn = document.getElementById('startBtn');
    const statusEl = document.getElementById('status');
    const mainEl = document.getElementById('main');
    const displayNameEl = document.getElementById('displayName');
    const displayEmailEl = document.getElementById('displayEmail');
    const postsListEl = document.getElementById('postsList');
    const newMsgEl = document.getElementById('newMsg');
    const sendBtn = document.getElementById('sendBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    // const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));

    const userUrl = () => `${baseHost}/${encodeURIComponent(userEmail)}`;

    const showLoader = (time = 1000) => {
      loader.style.display = 'flex';
      return new Promise(res => setTimeout(() => {
        loader.style.display = 'none';
        res();
      }, time));
    };

    const escapeHtml = (unsafe = '') =>
      String(unsafe)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    const fetchProfile = async () => {
      const res = await fetch(`${userUrl()}/profile`);
      if (!res.ok) throw new Error('Ошибка профиля');
      return await res.json();
    };

    const postProfile = async (firstName, lastName) => {
      const res = await fetch(`${userUrl()}/profile`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ firstName, lastName })
      });
      if (!res.ok) throw new Error('Ошибка обновления профиля');
      return await res.json();
    };

    const fetchPosts = async (datetime = null) => {
      let url = `${userUrl()}/posts`;
      if (datetime) url += `?datetime=${encodeURIComponent(datetime)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Ошибка загрузки постов');
      const data = await res.json();
      return data.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
    };

    const postMessage = async (message) => {
      const res = await fetch(`${userUrl()}/posts`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ message })
      });
      if (!res.ok) throw new Error('Ошибка отправки сообщения');
      return await res.json();
    };

    const renderProfile = () => {
      const name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
      displayNameEl.textContent = name || 'John Doe';
      displayEmailEl.textContent = userEmail;
    };

    const renderPosts = (newPosts) => {
      const combined = [...newPosts, ...posts];
      const seen = new Set();
      posts = [];


      console.log(newPosts);
      for (const p of combined) {
        const key = (p.id !== undefined && p.id !== null) ? p.id : (p.datetime + '|' + p.message);
        if (!seen.has(key)) {
          seen.add(key);
          posts.push(p);
        }
      }
      posts.sort((a,b)=>new Date(b.datetime)-new Date(a.datetime));
      if (posts.length > 100) posts = posts.slice(0,100);
      lastDatetime = posts[0]?.datetime || null;


            postsListEl.innerHTML = '';
      posts.forEach(p => {
        const d = new Date(p.datetime);
        const card = document.createElement('div');
        card.className = 'post-card';
        card.innerHTML = `
          <div class="post-meta d-flex justify-content-between mb-2">
            <span>${p.authorName || p.email || 'User'}</span>
            <span>${d.toLocaleString()}</span>
          </div>
          <div>${escapeHtml(p.message)}</div>`;
        postsListEl.appendChild(card);
      });
    };

    const startApp = async () => {
      userEmail = emailInput.value.trim();
      if (!userEmail) return alert('Введите email!');
      statusEl.textContent = 'Подключение...';
      await showLoader(1500);

      try {
        profile = await fetchProfile();
        renderProfile();
        mainEl.style.display = 'block';
        statusEl.textContent = 'Профиль загружен';
        const initialPosts = await fetchPosts();
        renderPosts(initialPosts);
        startPolling();
      } catch (err) {
        alert(err.message || 'Ошибка подключения');
        statusEl.textContent = 'Ошибка';
      }
    };

    const startPolling = () => {
      clearInterval(pollInterval);
      pollInterval = setInterval(async () => {

        console.log("InervalAlive");
        try {
          const newPosts = await fetchPosts(lastDatetime);
          if (newPosts && newPosts.length) 
            renderPosts(newPosts);
        } catch (err) {
          console.warn('Polling error', err);
        }
      }, 3000);
    };


startPolling();

    const sendMessage = async () => {
      const msg = newMsgEl.value.trim();
      if (!msg) return alert('Введите сообщение!');
      sendBtn.disabled = true;
      await showLoader(1000);
      try {
        await postMessage(msg);
        newMsgEl.value = '';
        const latest = await fetchPosts();
        renderPosts(latest);
      } catch (err) {
        alert(err.message);
      } finally {
        sendBtn.disabled = false;
      }
    };

    const saveProfile = async () => {
      const fn = document.getElementById('firstName').value.trim();
      const ln = document.getElementById('lastName').value.trim();
      if (!fn || !ln) return alert('Имя и фамилия обязательны');
      await showLoader(1000);
      try {
        const updated = await postProfile(fn, ln);
        profile.firstName = updated.firstName || fn;
        profile.lastName = updated.lastName || ln;
        renderProfile();
        profileModal.hide();
      } catch (err) {
        alert(err.message);
      }
    };

    // startBtn.addEventListener('click', startApp);
    // refreshBtn.addEventListener('click', async () => {
    //   await showLoader(1000);
    //   try {
    //     const data = await fetchPosts();
    //     renderPosts(data);
    //   } catch (err) {
    //     alert(err.message);
    //   }
    // });
    // sendBtn.addEventListener('click', sendMessage);
    // newMsgEl.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') sendMessage(); });
    // editProfileBtn.addEventListener('click', () => {
    //   document.getElementById('firstName').value = profile?.firstName || '';
    //   document.getElementById('lastName').value = profile?.lastName || '';
    //   profileModal.show();
    // });
    // saveProfileBtn.addEventListener('click', saveProfile);
    // emailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') startApp(); });
