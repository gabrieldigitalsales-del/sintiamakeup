import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import './styles.css';

const ADMIN_PASSWORD = 'asd123';
const STORAGE_KEY = 'sbm_sikiomi_bw_v1_local_backup';
const SUPABASE_URL = import.meta.env.VITE_SBM_SIKIOMI_BW_V1_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SBM_SIKIOMI_BW_V1_SUPABASE_ANON_KEY || '';
const SUPABASE_BUCKET = import.meta.env.VITE_SBM_SIKIOMI_BW_V1_SUPABASE_BUCKET || 'sbm-sikiomi-bw-v1-assets';
const SUPABASE_CONFIG_TABLE = import.meta.env.VITE_SBM_SIKIOMI_BW_V1_CONFIG_TABLE || 'sbm_sikiomi_bw_v1_site_config';
const SUPABASE_CONFIG_ID = 'sintia-b-makeup-public-site';
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const initialData = {
  brand: 'Sintia B. Makeup',
  subtitle: 'beauty artist',
  logoUrl: '',
  whatsapp: '5599999999999',
  instagram: 'sintia.b.makeup',
  email: '',
  city: 'Atendimento com horário marcado',
  heroImage: '',
  aboutImage: '',
  aboutTitle: 'Olá, sou a Sintia',
  aboutText: 'Maquiadora profissional especializada em produções elegantes para eventos, ensaios e momentos especiais. Meu trabalho une técnica, delicadeza e escuta para realçar a beleza de cada cliente com naturalidade e sofisticação.',
  services: [
    { id: 'svc-social', title: 'Maquiagem Social', description: 'Produção elegante para festas, formaturas, convidadas, madrinhas e eventos especiais.', image: '', active: true },
    { id: 'svc-penteado', title: 'Maquiagem e Penteado', description: 'Atendimento completo para quem busca uma produção harmoniosa e bem finalizada.', image: '', active: true },
    { id: 'svc-auto', title: 'Automaquiagem', description: 'Aula prática para aprender técnicas aplicáveis à rotina, respeitando seu estilo e seus objetivos.', image: '', active: true },
    { id: 'svc-ensaio', title: 'Ensaio Fotográfico', description: 'Beleza pensada para câmera, luz, styling e conceito visual do ensaio.', image: '', active: true }
  ],
  portfolio: [],
  leads: []
};

function readData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? { ...initialData, ...saved } : initialData;
  } catch {
    return initialData;
  }
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeInstagram(value) {
  return String(value || '').replace('@', '').trim();
}

function safeFileName(fileName) {
  return String(fileName || 'imagem')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.\-_]/g, '-')
    .toLowerCase();
}


function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 1400;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('Não foi possível processar a imagem.'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem no navegador.'));
    reader.readAsDataURL(file);
  });
}

function isValidImageSrc(value) {
  const src = String(value || '').trim();
  return src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/') || src.startsWith('data:image/');
}

function ImageWithFallback({ src, alt, className, fallbackClassName = 'image-empty', fallbackText = 'Imagem não carregada' }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  if (!isValidImageSrc(src) || broken) {
    return <div className={fallbackClassName}>{fallbackText}</div>;
  }
  return <img className={className} src={src} alt={alt} onError={() => setBroken(true)} />;
}

async function uploadToSupabase(file, folder = 'site') {
  if (!supabase) {
    throw new Error('Configure as variáveis VITE_SBM_SIKIOMI_BW_V1_SUPABASE_URL e VITE_SBM_SIKIOMI_BW_V1_SUPABASE_ANON_KEY no .env.local para ativar upload.');
  }
  const extension = safeFileName(file.name).split('.').pop() || 'jpg';
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false
  });
  if (error) throw error;
  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function loadRemoteConfig() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(SUPABASE_CONFIG_TABLE)
    .select('content')
    .eq('id', SUPABASE_CONFIG_ID)
    .maybeSingle();
  if (error) throw error;
  return data?.content || null;
}

async function saveRemoteConfig(content) {
  if (!supabase) return null;
  const { error } = await supabase
    .from(SUPABASE_CONFIG_TABLE)
    .upsert({ id: SUPABASE_CONFIG_ID, content, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) throw error;
  return true;
}

function saveLocalBackup(content) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
    return true;
  } catch (error) {
    console.warn('Local backup skipped:', error);
    return false;
  }
}

function App() {
  const [data, setData] = useState(readData);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', date: '', interest: data.services[0]?.title || '', message: '' });
  const [notice, setNotice] = useState('');
  const [syncNotice, setSyncNotice] = useState('');
  const isAdmin = window.location.pathname.replace(/\/$/, '') === '/admin';

  useEffect(() => {
    let alive = true;
    async function bootRemote() {
      if (!supabase) return;
      try {
        const remote = await loadRemoteConfig();
        if (alive && remote) {
          const merged = { ...initialData, ...remote };
          setData(merged);
          saveLocalBackup(merged);
        }
      } catch (error) {
        if (alive) setSyncNotice('Não foi possível carregar dados do Supabase. Usando backup local.');
      }
    }
    bootRemote();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    saveLocalBackup(data);
  }, [data]);

  async function saveData(nextData) {
    if (supabase) {
      await saveRemoteConfig(nextData);
    }
    setData(nextData);
    saveLocalBackup(nextData);
  }

  const activeServices = data.services.filter((item) => item.active);

  function updateData(patch) {
    setData((current) => ({ ...current, ...patch }));
  }

  async function sendLead(e) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.phone.trim() || !form.interest.trim()) {
      setNotice('Preencha nome, WhatsApp e serviço de interesse.');
      return;
    }

    const lead = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'novo', ...form };
    const nextData = { ...data, leads: [lead, ...data.leads] };
    try {
      await saveData(nextData);
    } catch {
      updateData({ leads: [lead, ...data.leads] });
    }

    const message = [
      'Olá, Sintia! Quero solicitar um orçamento.',
      '',
      `Nome: ${form.firstName} ${form.lastName}`.trim(),
      form.email ? `Email: ${form.email}` : '',
      `WhatsApp: ${form.phone}`,
      form.date ? `Data do evento: ${form.date}` : '',
      `Interesse: ${form.interest}`,
      form.message ? `Mensagem: ${form.message}` : ''
    ].filter(Boolean).join('\n');

    window.location.href = `https://wa.me/${normalizePhone(data.whatsapp)}?text=${encodeURIComponent(message)}`;
  }

  return (
    <>
      <header className="topbar">
        <a href="#home" className="brandbox" aria-label="Início">
          {data.logoUrl ? <ImageWithFallback src={data.logoUrl} alt={data.brand} fallbackClassName="logo-fallback" fallbackText={data.brand} /> : <><strong>{data.brand}</strong><span>{data.subtitle}</span></>}
        </a>
        <nav className="mainnav" aria-label="Menu principal">
          <a href="#home">HOME</a>
          <a href="#servicos">SERVIÇOS</a>
          <a href="#sobre">SOBRE MIM</a>
          <a href="#orcamento">ORÇAMENTO</a>
          <a href="#contato">CONTATO</a>
          <a href="#portfolio">PORTFÓLIO</a>
        </nav>
        <div className="social-mini" aria-label="Contato rápido">
          <a href={`https://wa.me/${normalizePhone(data.whatsapp)}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><img src="/icons/whatsapp.png" alt="WhatsApp" /></a>
          <a href={`https://instagram.com/${normalizeInstagram(data.instagram)}`} target="_blank" rel="noreferrer" aria-label="Instagram"><img src="/icons/instagram.png" alt="Instagram" /></a>
        </div>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-image-frame">
            {data.heroImage ? <ImageWithFallback src={data.heroImage} alt="Trabalho de maquiagem" fallbackText="Imagem principal não carregada. Verifique a URL ou reenvie pelo painel." /> : <div className="image-empty">Adicione a imagem principal no painel</div>}
          </div>
        </section>

        <section id="sobre" className="intro-section">
          <div className="portrait-card">
            {data.aboutImage ? <ImageWithFallback src={data.aboutImage} alt={data.aboutTitle} fallbackClassName="image-empty slim" fallbackText="Foto não carregada. Verifique a URL ou reenvie pelo painel." /> : <div className="image-empty slim">Adicione uma foto da profissional</div>}
          </div>
          <div className="intro-copy">
            <h1>{data.aboutTitle}</h1>
            <p>{data.aboutText}</p>
            <a className="continue-link" href="#orcamento">CONTINUA...</a>
          </div>
        </section>

        <section id="servicos" className="services-section">
          <h2>SERVIÇOS</h2>
          <div className="services-grid">
            {activeServices.map((service) => (
              <article className="service-card" key={service.id}>
                <div className="service-photo">
                  {service.image ? <ImageWithFallback src={service.image} alt={service.title} fallbackText="Imagem do serviço não carregada" /> : <div className="image-empty">Imagem do serviço</div>}
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <a href="#orcamento">INFORMAÇÕES</a>
              </article>
            ))}
          </div>
        </section>

        <section id="portfolio" className="portfolio-section">
          <h2>PORTFÓLIO</h2>
          {data.portfolio.length ? (
            <div className="portfolio-grid">
              {data.portfolio.map((item) => (
                <figure key={item.id}>
                  <ImageWithFallback src={item.image} alt={item.caption || 'Portfólio de maquiagem'} fallbackText="Imagem do portfólio não carregada" />
                  {item.caption && <figcaption>{item.caption}</figcaption>}
                </figure>
              ))}
            </div>
          ) : (
            <div className="clean-empty">Nenhuma imagem publicada no portfólio ainda.</div>
          )}
        </section>

        <section id="orcamento" className="budget-section">
          <h2>Orçamento</h2>
          <form className="budget-form" onSubmit={sendLead}>
            <div className="two"><input placeholder="Nome" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /><input placeholder="Sobrenome" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input placeholder="Telefone / Whats" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <select value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })}>
              <option value="">Estou interessada em:</option>
              {activeServices.map((service) => <option key={service.id}>{service.title}</option>)}
            </select>
            <textarea placeholder="Deixe aqui sua mensagem" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            <button type="submit">ENVIAR</button>
            {notice && <p className="notice">{notice}</p>}
          </form>
        </section>
      </main>

      <footer id="contato" className="footer-contact">
        <div className="footer-logo">{data.logoUrl ? <ImageWithFallback src={data.logoUrl} alt={data.brand} fallbackClassName="logo-fallback" fallbackText={data.brand} /> : <><strong>{data.brand}</strong><span>{data.subtitle}</span></>}</div>
        <div>
          <h3>Contato</h3>
          {data.email && <a href={`mailto:${data.email}`}>{data.email}</a>}
          <a href={`https://wa.me/${normalizePhone(data.whatsapp)}`} target="_blank" rel="noreferrer">WhatsApp</a>
          <a href={`https://instagram.com/${normalizeInstagram(data.instagram)}`} target="_blank" rel="noreferrer">Instagram</a>
          <span>{data.city}</span>
        </div>
      </footer>

      {syncNotice && isAdmin && <div className="sync-warning">{syncNotice}</div>}
      {isAdmin && <AdminPanel data={data} updateData={updateData} saveData={saveData} />}
    </>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return <div className={`admin-toast ${toast.type || 'success'}`}>{toast.message}</div>;
}

function ImageField({ label, value, onChange, folder, uploading, onUpload, hint, onClear }) {
  return (
    <label className="image-field">
      <span>{label}</span>
      {value && <ImageWithFallback className="mini-preview" src={value} alt="Prévia" fallbackClassName="mini-preview-fallback" fallbackText="Prévia indisponível" />}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Cole uma URL ou envie um arquivo" />
      <div className="upload-row">
        <input type="file" accept="image/*" onChange={(e) => onUpload(e.target.files?.[0], onChange, folder, label)} />
        {uploading && <span>Enviando...</span>}
      </div>
      <div className="field-actions">
        {value && <button type="button" onClick={onClear}>Limpar imagem</button>}
      </div>
      {hint && <small>{hint}</small>}
    </label>
  );
}

function AdminPanel({ data, updateData, saveData }) {
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState('geral');
  const [draft, setDraft] = useState(data);
  const [uploading, setUploading] = useState('');
  const [toast, setToast] = useState(null);
  const unlocked = password === ADMIN_PASSWORD;
  const dirty = JSON.stringify(draft) !== JSON.stringify(data);

  useEffect(() => {
    if (!dirty) setDraft(data);
  }, [data]);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(null), 3000);
  }

  function setDraftPatch(patch) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  async function saveSite(kind = 'Alterações') {
    try {
      await saveData(draft);
      showToast(`${kind} salvas no site.`);
    } catch (error) {
      showToast(error.message || 'Não foi possível salvar no Supabase.', 'error');
    }
  }

  function restoreUnsaved() {
    setDraft(data);
    showToast('Alterações não salvas foram restauradas.', 'info');
  }

  function restoreDefaults() {
    const ok = window.confirm('Restaurar o conteúdo padrão do site? Isso substitui textos, serviços, imagens e leads salvos neste navegador.');
    if (!ok) return;
    setDraft(initialData);
    saveData(initialData).then(() => showToast('Site restaurado para o conteúdo padrão.', 'info')).catch((error) => showToast(error.message || 'Não foi possível restaurar no Supabase.', 'error'));
  }

  async function handleUpload(file, onChange, folder, label = 'Imagem') {
    if (!file) return;
    const key = `${folder}-${file.name}`;
    setUploading(key);
    try {
      if (supabase) {
        const url = await uploadToSupabase(file, folder);
        onChange(url);
        showToast(`${label} enviada. Clique em Salvar alterações para publicar no site.`);
      } else {
        const localPreview = await fileToDataUrl(file);
        onChange(localPreview);
        showToast(`${label} aplicada em prévia local. Clique em Salvar alterações para publicar neste navegador.`, 'info');
      }
    } catch (error) {
      try {
        const localPreview = await fileToDataUrl(file);
        onChange(localPreview);
        showToast(`Upload no Supabase falhou, mas apliquei uma prévia local. Clique em Salvar alterações.`, 'warning');
      } catch {
        showToast(error.message || 'Não foi possível enviar a imagem.', 'error');
      }
    } finally {
      setUploading('');
    }
  }

  function updateService(id, patch) {
    setDraftPatch({ services: draft.services.map((service) => service.id === id ? { ...service, ...patch } : service) });
  }

  function addService() {
    setDraftPatch({ services: [...draft.services, { id: crypto.randomUUID(), title: 'Novo serviço', description: '', image: '', active: true }] });
    showToast('Serviço criado. Edite e salve para publicar.', 'info');
  }

  function removeService(id) {
    setDraftPatch({ services: draft.services.filter((service) => service.id !== id) });
    showToast('Serviço removido da prévia. Clique em Salvar alterações para confirmar.', 'warning');
  }

  function addPortfolio() {
    setDraftPatch({ portfolio: [...draft.portfolio, { id: crypto.randomUUID(), image: '', caption: '' }] });
    showToast('Item de portfólio criado. Envie a imagem e salve.', 'info');
  }

  function updatePortfolio(id, patch) {
    setDraftPatch({ portfolio: draft.portfolio.map((item) => item.id === id ? { ...item, ...patch } : item) });
  }

  function removePortfolio(id) {
    setDraftPatch({ portfolio: draft.portfolio.filter((item) => item.id !== id) });
    showToast('Imagem removida da prévia. Clique em Salvar alterações para confirmar.', 'warning');
  }

  function updateLead(id, patch) {
    setDraftPatch({ leads: draft.leads.map((lead) => lead.id === id ? { ...lead, ...patch } : lead) });
  }

  const tabLabels = {
    geral: 'Geral',
    sobre: 'Sobre',
    servicos: 'Serviços',
    portfolio: 'Portfólio',
    leads: 'Clientes'
  };

  return (
    <div className="admin-page">
      <Toast toast={toast} />
      {!unlocked ? (
        <section className="admin-login">
          <h1>Painel administrativo</h1>
          <p>Digite a senha para editar o site.</p>
          <input type="password" autoFocus placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
        </section>
      ) : (
        <section className="admin-shell">
          <aside className="admin-menu">
            <strong>Painel</strong>
            {Object.entries(tabLabels).map(([key, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}
            <button className="danger-menu" onClick={restoreDefaults}>Restaurar site padrão</button>
          </aside>
          <div className="admin-content">
            <div className="admin-toolbar">
              <div>
                <span>Editando</span>
                <strong>{tabLabels[tab]}</strong>
                <small>{dirty ? 'Existem alterações ainda não salvas.' : 'Tudo salvo no site.'}</small>
              </div>
              <div className="toolbar-actions">
                <button className="ghost" disabled={!dirty} onClick={restoreUnsaved}>Restaurar alterações</button>
                <button className="primary" disabled={!dirty} onClick={() => saveSite(tab === 'portfolio' ? 'Portfólio' : tab === 'servicos' ? 'Serviços' : tab === 'sobre' ? 'Textos e imagem' : 'Alterações')}>Salvar alterações</button>
              </div>
            </div>

            <div className="admin-status">
              <strong>Status do site</strong>
              <span>{supabase ? `Supabase ativo: conteúdo em ${SUPABASE_CONFIG_TABLE} e imagens em ${SUPABASE_BUCKET}` : 'Modo local: configure o Supabase para salvar várias imagens sem limite do navegador.'}</span>
            </div>

            {tab === 'geral' && <div className="admin-grid">
              <label>Nome da marca<input value={draft.brand} onChange={(e) => setDraftPatch({ brand: e.target.value })} /></label>
              <label>Subtítulo<input value={draft.subtitle} onChange={(e) => setDraftPatch({ subtitle: e.target.value })} /></label>
              <ImageField label="Logo" value={draft.logoUrl} onChange={(value) => setDraftPatch({ logoUrl: value })} onClear={() => setDraftPatch({ logoUrl: '' })} folder="logo" uploading={uploading.startsWith('logo-')} onUpload={handleUpload} />
              <label>WhatsApp<input value={draft.whatsapp} onChange={(e) => setDraftPatch({ whatsapp: e.target.value })} /></label>
              <label>Instagram<input value={draft.instagram} onChange={(e) => setDraftPatch({ instagram: e.target.value })} /></label>
              <label>Email<input value={draft.email} onChange={(e) => setDraftPatch({ email: e.target.value })} /></label>
              <label className="wide">Local / observação<input value={draft.city} onChange={(e) => setDraftPatch({ city: e.target.value })} /></label>
              <ImageField label="Imagem principal" value={draft.heroImage} onChange={(value) => setDraftPatch({ heroImage: value })} onClear={() => setDraftPatch({ heroImage: '' })} folder="hero" uploading={uploading.startsWith('hero-')} onUpload={handleUpload} />
            </div>}

            {tab === 'sobre' && <div className="admin-grid">
              <label>Título<input value={draft.aboutTitle} onChange={(e) => setDraftPatch({ aboutTitle: e.target.value })} /></label>
              <ImageField label="Imagem da profissional" value={draft.aboutImage} onChange={(value) => setDraftPatch({ aboutImage: value })} onClear={() => setDraftPatch({ aboutImage: '' })} folder="sobre" uploading={uploading.startsWith('sobre-')} onUpload={handleUpload} />
              <label className="wide">Texto<textarea value={draft.aboutText} onChange={(e) => setDraftPatch({ aboutText: e.target.value })} /></label>
            </div>}

            {tab === 'servicos' && <div className="cards-editor"><button className="admin-add" onClick={addService}>Adicionar serviço</button>{draft.services.map((service) => <article key={service.id} className="edit-card"><label>Nome<input value={service.title} onChange={(e) => updateService(service.id, { title: e.target.value })} /></label><ImageField label="Imagem" value={service.image} onChange={(value) => updateService(service.id, { image: value })} onClear={() => updateService(service.id, { image: '' })} folder="servicos" uploading={uploading.startsWith('servicos-')} onUpload={handleUpload} /><label>Descrição<textarea value={service.description} onChange={(e) => updateService(service.id, { description: e.target.value })} /></label><label className="inline"><input type="checkbox" checked={service.active} onChange={(e) => updateService(service.id, { active: e.target.checked })} />Ativo no site</label><button onClick={() => removeService(service.id)}>Remover serviço</button></article>)}</div>}

            {tab === 'portfolio' && <div className="cards-editor"><button className="admin-add" onClick={addPortfolio}>Adicionar imagem</button>{draft.portfolio.map((item) => <article key={item.id} className="edit-card"><ImageField label="Imagem" value={item.image} onChange={(value) => updatePortfolio(item.id, { image: value })} onClear={() => updatePortfolio(item.id, { image: '' })} folder="portfolio" uploading={uploading.startsWith('portfolio-')} onUpload={handleUpload} /><label>Legenda<input value={item.caption} onChange={(e) => updatePortfolio(item.id, { caption: e.target.value })} /></label><button onClick={() => removePortfolio(item.id)}>Remover imagem</button></article>)}</div>}

            {tab === 'leads' && <div className="leads-list">{draft.leads.length ? draft.leads.map((lead) => <article className="lead-card" key={lead.id}><div><strong>{lead.firstName} {lead.lastName}</strong><span>{lead.phone}</span><span>{lead.interest}</span>{lead.date && <span>{lead.date}</span>}{lead.message && <p>{lead.message}</p>}</div><select value={lead.status} onChange={(e) => updateLead(lead.id, { status: e.target.value })}><option>novo</option><option>em conversa</option><option>confirmado</option><option>finalizado</option></select></article>) : <p>Nenhum lead registrado ainda.</p>}</div>}
          </div>
        </section>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
