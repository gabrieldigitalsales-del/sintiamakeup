# Sintia B. Makeup - Site estilo referência

Projeto React + Vite pronto para Vercel.

## Instalar

```bash
npm install
npm run dev
```

## Admin

Acesse:

```txt
/admin
```

Senha:

```txt
asd123
```

O botão do admin não aparece no site público.

## Upload de imagens com Supabase Storage

1. Crie um projeto no Supabase.
2. Abra o SQL Editor e rode o arquivo:

```txt
supabase/storage_setup.sql
```

3. Copie `.env.example` para `.env.local`.
4. Preencha:

```txt
VITE_SINTIA_SUPABASE_URL
VITE_SINTIA_SUPABASE_ANON_KEY
VITE_SINTIA_SUPABASE_BUCKET
```

5. Reinicie o projeto com `npm run dev`.

No painel, os campos de imagem aceitam tanto URL colada quanto upload direto de arquivo.

## Observação de segurança

Este painel usa senha simples no front-end, conforme solicitado. Para uso com dados sensíveis, o ideal é trocar por login real com Supabase Auth.
