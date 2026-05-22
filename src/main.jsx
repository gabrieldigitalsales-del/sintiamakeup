import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import './styles.css';

const ADMIN_PASSWORD = 'asd123';
const STORAGE_KEY = 'sintia_sikiomi_clean_admin_v4_uploads';
const SUPABASE_URL = import.meta.env.VITE_SINTIA_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SINTIA_SUPABASE_ANON_KEY || '';
const SUPABASE_BUCKET = import.meta.env.VITE_SINTIA_SUPABASE_BUCKET || 'sintia-b-makeup-site-images';
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

async function uploadToSupabase(file, folder = 'site') {
  if (!supabase) {
    throw new Error('Configure as variáveis VITE_SINTIA_SUPABASE_URL e VITE_SINTIA_SUPABASE_ANON_KEY no .env.local para ativar upload.');
  }
  const extension = safeFileName(file.name).split('.').pop() || 'jpg';
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false
  });
  if (error) throw error;
  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function App() {
  const [data, setData] = useState(readData);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', date: '', interest: data.services[0]?.title || '', message: '' });
  const [notice, setNotice] = useState('');
  const isAdmin = window.location.pathname.replace(/\/$/, '') === '/admin';

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const activeServices = data.services.filter((item) => item.active);

  function updateData(patch) {
    setData((current) => ({ ...current, ...patch }));
  }

  function sendLead(e) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.phone.trim() || !form.interest.trim()) {
      setNotice('Preencha nome, WhatsApp e serviço de interesse.');
      return;
    }

    const lead = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'novo', ...form };
    updateData({ leads: [lead, ...data.leads] });

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
          {data.logoUrl ? <img src={data.logoUrl} alt={data.brand} /> : <><strong>{data.brand}</strong><span>{data.subtitle}</span></>}
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
          <a href={`https://wa.me/${normalizePhone(data.whatsapp)}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><img src="/icons/whatsapp.svg" alt="WhatsApp" /></a>
          <a href={`https://instagram.com/${normalizeInstagram(data.instagram)}`} target="_blank" rel="noreferrer" aria-label="Instagram"><img src="/icons/instagram.svg" alt="Instagram" /></a>
        </div>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-image-frame">
            {data.heroImage ? <img src={data.heroImage} alt="Trabalho de maquiagem" /> : <div className="image-empty">Adicione a imagem principal no painel</div>}
          </div>
        </section>

        <section id="sobre" className="intro-section">
          <div className="portrait-card">
            {data.aboutImage ? <img src={data.aboutImage} alt={data.aboutTitle} /> : <div className="image-empty slim">Adicione uma foto da profissional</div>}
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
                  {service.image ? <img src={service.image} alt={service.title} /> : <div className="image-empty">Imagem do serviço</div>}
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
                  <img src={item.image} alt={item.caption || 'Portfólio de maquiagem'} />
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
        <div className="footer-logo">{data.logoUrl ? <img src={data.logoUrl} alt={data.brand} /> : <><strong>{data.brand}</strong><span>{data.subtitle}</span></>}</div>
        <div>
          <h3>Contato</h3>
          {data.email && <a href={`mailto:${data.email}`}>{data.email}</a>}
          <a href={`https://wa.me/${normalizePhone(data.whatsapp)}`} target="_blank" rel="noreferrer">WhatsApp</a>
          <a href={`https://instagram.com/${normalizeInstagram(data.instagram)}`} target="_blank" rel="noreferrer">Instagram</a>
          <span>{data.city}</span>
        </div>
      </footer>

      {isAdmin && <AdminPanel data={data} updateData={updateData} />}
    </>
  );
}

function ImageField({ label, value, onChange, folder, uploading, onUpload, hint }) {
  return (
    <label className="image-field">
      {label}
      {value && <img className="mini-preview" src={value} alt="Prévia" />}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Cole uma URL ou envie um arquivo" />
      <div className="upload-row">
        <input type="file" accept="image/*" onChange={(e) => onUpload(e.target.files?.[0], onChange, folder)} />
        {uploading && <span>Enviando...</span>}
      </div>
      {hint && <small>{hint}</small>}
    </label>
  );
}

function AdminPanel({ data, updateData }) {
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState('geral');
  const [uploading, setUploading] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const unlocked = password === ADMIN_PASSWORD;

  async function handleUpload(file, onChange, folder) {
    if (!file) return;
    setUploadMessage('');
    const key = `${folder}-${file.name}`;
    setUploading(key);
    try {
      const url = await uploadToSupabase(file, folder);
      onChange(url);
      setUploadMessage('Imagem enviada com sucesso.');
    } catch (error) {
      setUploadMessage(error.message || 'Não foi possível enviar a imagem.');
    } finally {
      setUploading('');
    }
  }

  function updateService(id, patch) {
    updateData({ services: data.services.map((service) => service.id === id ? { ...service, ...patch } : service) });
  }

  function addService() {
    updateData({ services: [...data.services, { id: crypto.randomUUID(), title: 'Novo serviço', description: '', image: '', active: true }] });
  }

  function removeService(id) {
    updateData({ services: data.services.filter((service) => service.id !== id) });
  }

  function addPortfolio() {
    updateData({ portfolio: [...data.portfolio, { id: crypto.randomUUID(), image: '', caption: '' }] });
  }

  function updatePortfolio(id, patch) {
    updateData({ portfolio: data.portfolio.map((item) => item.id === id ? { ...item, ...patch } : item) });
  }

  function removePortfolio(id) {
    updateData({ portfolio: data.portfolio.filter((item) => item.id !== id) });
  }

  function updateLead(id, patch) {
    updateData({ leads: data.leads.map((lead) => lead.id === id ? { ...lead, ...patch } : lead) });
  }

  return (
    <div className="admin-page">
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
            {['geral', 'sobre', 'servicos', 'portfolio', 'leads'].map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}
          </aside>
          <div className="admin-content">
            <div className="admin-status">
              <strong>Upload de imagens</strong>
              <span>{supabase ? `Ativo no bucket ${SUPABASE_BUCKET}` : 'Configure o Supabase no .env.local para ativar upload.'}</span>
              {uploadMessage && <em>{uploadMessage}</em>}
            </div>

            {tab === 'geral' && <div className="admin-grid">
              <label>Nome da marca<input value={data.brand} onChange={(e) => updateData({ brand: e.target.value })} /></label>
              <label>Subtítulo<input value={data.subtitle} onChange={(e) => updateData({ subtitle: e.target.value })} /></label>
              <ImageField label="Logo" value={data.logoUrl} onChange={(value) => updateData({ logoUrl: value })} folder="logo" uploading={uploading.startsWith('logo-')} onUpload={handleUpload} />
              <label>WhatsApp<input value={data.whatsapp} onChange={(e) => updateData({ whatsapp: e.target.value })} /></label>
              <label>Instagram<input value={data.instagram} onChange={(e) => updateData({ instagram: e.target.value })} /></label>
              <label>Email<input value={data.email} onChange={(e) => updateData({ email: e.target.value })} /></label>
              <label className="wide">Local / observação<input value={data.city} onChange={(e) => updateData({ city: e.target.value })} /></label>
              <ImageField label="Imagem principal" value={data.heroImage} onChange={(value) => updateData({ heroImage: value })} folder="hero" uploading={uploading.startsWith('hero-')} onUpload={handleUpload} />
            </div>}

            {tab === 'sobre' && <div className="admin-grid">
              <label>Título<input value={data.aboutTitle} onChange={(e) => updateData({ aboutTitle: e.target.value })} /></label>
              <ImageField label="Imagem da profissional" value={data.aboutImage} onChange={(value) => updateData({ aboutImage: value })} folder="sobre" uploading={uploading.startsWith('sobre-')} onUpload={handleUpload} />
              <label className="wide">Texto<textarea value={data.aboutText} onChange={(e) => updateData({ aboutText: e.target.value })} /></label>
            </div>}

            {tab === 'servicos' && <div className="cards-editor"><button className="admin-add" onClick={addService}>Adicionar serviço</button>{data.services.map((service) => <article key={service.id} className="edit-card"><label>Nome<input value={service.title} onChange={(e) => updateService(service.id, { title: e.target.value })} /></label><ImageField label="Imagem" value={service.image} onChange={(value) => updateService(service.id, { image: value })} folder="servicos" uploading={uploading.startsWith('servicos-')} onUpload={handleUpload} /><label>Descrição<textarea value={service.description} onChange={(e) => updateService(service.id, { description: e.target.value })} /></label><label className="inline"><input type="checkbox" checked={service.active} onChange={(e) => updateService(service.id, { active: e.target.checked })} />Ativo</label><button onClick={() => removeService(service.id)}>Remover</button></article>)}</div>}

            {tab === 'portfolio' && <div className="cards-editor"><button className="admin-add" onClick={addPortfolio}>Adicionar imagem</button>{data.portfolio.map((item) => <article key={item.id} className="edit-card"><ImageField label="Imagem" value={item.image} onChange={(value) => updatePortfolio(item.id, { image: value })} folder="portfolio" uploading={uploading.startsWith('portfolio-')} onUpload={handleUpload} /><label>Legenda<input value={item.caption} onChange={(e) => updatePortfolio(item.id, { caption: e.target.value })} /></label><button onClick={() => removePortfolio(item.id)}>Remover</button></article>)}</div>}

            {tab === 'leads' && <div className="leads-list">{data.leads.length ? data.leads.map((lead) => <article className="lead-card" key={lead.id}><div><strong>{lead.firstName} {lead.lastName}</strong><span>{lead.phone}</span><span>{lead.interest}</span>{lead.date && <span>{lead.date}</span>}{lead.message && <p>{lead.message}</p>}</div><select value={lead.status} onChange={(e) => updateLead(lead.id, { status: e.target.value })}><option>novo</option><option>em conversa</option><option>confirmado</option><option>finalizado</option></select></article>) : <p>Nenhum lead registrado ainda.</p>}</div>}
          </div>
        </section>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
