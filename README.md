# Sintia B. Makeup - Site preto e branco com admin

Projeto React/Vite pronto para Vercel.

## Rodar localmente

```bash
npm install
npm run dev
```

Site: `http://localhost:5173`
Painel: `http://localhost:5173/admin`
Senha do painel: `asd123`

## O que foi ajustado nesta versão

- Visual em preto e branco.
- Painel apenas na rota `/admin`.
- Senha simples mantida: `asd123`.
- Upload de imagens no painel.
- Confirmações por 3 segundos ao salvar, enviar imagem, restaurar ou remover.
- Correção do problema do portfólio acima de 3 imagens.
- Supabase preparado com nomes únicos para evitar conflito com outros projetos.

## Supabase

Rode o arquivo abaixo no SQL Editor do Supabase:

```txt
supabase/storage_setup.sql
```

Depois crie `.env.local` baseado em `.env.example`:

```env
VITE_SBM_SIKIOMI_BW_V1_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SBM_SIKIOMI_BW_V1_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLIC
VITE_SBM_SIKIOMI_BW_V1_SUPABASE_BUCKET=sbm-sikiomi-bw-v1-assets
VITE_SBM_SIKIOMI_BW_V1_CONFIG_TABLE=sbm_sikiomi_bw_v1_site_config
```

Nomes únicos usados:

- Tabela: `sbm_sikiomi_bw_v1_site_config`
- Bucket: `sbm-sikiomi-bw-v1-assets`
- Chaves env: `VITE_SBM_SIKIOMI_BW_V1_*`
- Registro de configuração: `sintia-b-makeup-public-site`

## Observação importante

Sem Supabase configurado, o site funciona localmente e salva no navegador, mas imagens grandes podem atingir limite de armazenamento. Com Supabase configurado, as imagens ficam no Storage e o conteúdo fica salvo na tabela única do projeto.
