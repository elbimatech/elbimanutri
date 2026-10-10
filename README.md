# 🥗 Elbima Nutri — Plataforma de Gestão para Nutricionistas

Sistema moderno e completo para gestão de pacientes, consultas nutricionais, acompanhamento antropométrico e retenção de pacientes, com autenticação integrada via **Neon Auth** e banco de dados serverless **Neon PostgreSQL**.

---

## 🚀 Tecnologias

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Banco de Dados & Autenticação**: [Neon Serverless PostgreSQL](https://neon.tech/) & [Neon Auth](https://neon.tech/docs/guides/neon-auth)
- **Deploy**: [Vercel](https://vercel.com/) / [GitHub](https://github.com/)

---

## 🔒 Segurança & Variáveis de Ambiente

Para manter suas credenciais seguras, **arquivos `.env` e `.env.local` NUNCA são versionados no Git** (configurados no `.gitignore`).

### Variáveis necessárias:

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Preencha as variáveis em `.env.local`:

```env
# Neon Auth
VITE_NEON_AUTH_URL=https://<seu-endpoint>.neonauth.<regiao>.aws.neon.tech/neondb/auth
NEON_AUTH_URL=https://<seu-endpoint>.neonauth.<regiao>.aws.neon.tech/neondb/auth

# Neon Database Connection
VITE_DATABASE_URL=postgresql://<usuario>:<senha>@<seu-host>.neon.tech/neondb?sslmode=require
DATABASE_URL=postgresql://<usuario>:<senha>@<seu-host>.neon.tech/neondb?sslmode=require
```

---

## 💻 Como Rodar Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/elbimatech/elbimanutri.git
   cd elbimanutri
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador:**
   [http://localhost:5173](http://localhost:5173)

---

## 🌐 Deploy na Vercel

1. Acesse o [Vercel Dashboard](https://vercel.com/dashboard) e clique em **Add New Project**.
2. Importe o repositório `elbimatech/elbimanutri`.
3. Na seção **Environment Variables**, adicione as seguintes variáveis:
   - `VITE_NEON_AUTH_URL`
   - `NEON_AUTH_URL`
   - `VITE_DATABASE_URL`
   - `DATABASE_URL`
4. Clique em **Deploy**.
