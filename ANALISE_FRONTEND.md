# ScriptDNA Frontend - Fluxos de Dados e Interface

## Stack

| Tecnologia | Uso |
|-----------|-----|
| Next.js 15 (App Router) | Framework + roteamento |
| TypeScript | Tipagem |
| Tailwind CSS + shadcn/ui | UI components |
| Zustand | Estado global (auth, tema) |
| TanStack React Query | Cache e fetching de dados |
| React Hook Form + Zod | Formulários e validação |
| Framer Motion | Animações |
| Lucide React | Ícones |

**API Base:** `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`)

---

## Estrutura de Navegação

### Menu Principal (Sidebar)
| Rota | Nome | Descrição |
|------|------|-----------|
| `/` | Dashboard | Métricas gerais e resumo |
| `/scripts` | Roteiros | Lista e gestão de roteiros |
| `/youtube` | YouTube | Integração com canal |
| `/analytics` | Analytics | Análise do canal |
| `/insights` | Insights | Aprendizados da IA |
| `/ideas` | Sugestões | Ideias de vídeo geradas |

### Ferramentas (Sidebar)
| Rota | Nome | Descrição |
|------|------|-----------|
| `/library` | Biblioteca | Vídeos importados |
| `/import` | Importar | Upload de vídeos/texto |
| `/generate` | Gerador | Geração avançada |
| `/styles` | Estilos | Perfis de estilo |

### Páginas de Detalhe
| Rota | Descrição |
|------|-----------|
| `/scripts/{id}` | Editor/viewer de roteiro |
| `/youtube/shorts/{id}` | Detalhe de Short do YouTube |
| `/videos/{id}` | Timeline de beats narrativos |
| `/styles/{id}` | Detalhe do perfil de estilo |

---

## Fluxos de Dados por Feature

### 1. Autenticação

#### Login (`/login`)
```
Inputs: email, password
  → POST /api/auth/login
  → Response: { access_token, refresh_token, token_type, expires_in }
  → Salva tokens no localStorage
  → Redireciona para /
```

#### Registro (`/register`)
```
Inputs: name (opcional), email, password (min 6 chars)
  → POST /api/auth/register
  → Mesmo fluxo do login
```

#### Gerenciamento de Sessão
- `AuthGuard` protege rotas — redireciona para `/login` se não autenticado
- `hydrate()` checa localStorage ao montar
- `fetchUser()` → `GET /api/auth/me` → retorna dados do usuário
- Auto-refresh do token em respostas 401

---

### 2. Dashboard (`/`)

#### Dados carregados:

| API Call | O que traz |
|----------|-----------|
| `GET /api/dashboard/metrics` | total_videos, total_scripts, total_shorts, insights_active, top_technique, avg_hook_duration |
| `GET /api/videos?sort=recent&limit=5` | Últimos vídeos importados |
| `GET /api/scripts?limit=6` | Últimos roteiros |
| `GET /api/youtube/shorts?limit=1` | Verifica se tem Shorts |
| `GET /api/youtube/channel` | Status da conexão YouTube |
| `GET /api/insights?active_only=true&limit=1` | Verifica se tem insights |
| `GET /api/suggestions?status=pending&limit=3` | Top 3 sugestões pendentes |

#### Exibe:
- Cards de resumo (totais)
- Status de conexão YouTube
- Roteiros recentes
- Sugestões pendentes
- Vídeos recentes

---

### 3. Geração de Roteiro

#### Formulário (`/scripts/new` ou `/generate`)

| Campo | Tipo | Obrigatório | Valores |
|-------|------|:-----------:|---------|
| `theme` | texto | Sim | Livre (3-500 chars) |
| `idea` | textarea | Não | Até 2000 chars |
| `duration` | slider | Sim | 15-600 segundos (default 45) |
| `niche` | texto | Sim | Livre |
| `style_profile_id` | dropdown | Não | Perfis existentes |
| `hook_type` | dropdown | Não | curiosity_gap, bold_claim, question, story, statistic, controversial, pattern_interrupt |
| `aggressiveness` | slider | Não | 1-10 |
| `cta` | texto | Não | Livre |

#### Fluxo:
```
Usuário preenche formulário
  → POST /api/generate/script (com todos os campos)
  → IA gera roteiro (síncrono)
  → Frontend exibe:
      ├── Linhas do roteiro com timestamps e função narrativa
      ├── Análise: hook_strength (0-1), curiosity_gaps, weak_points
      └── retention_note por linha (por que mantém atenção)
  → Usuário pode: Salvar | Melhorar com IA | Copiar | Gerar novo
  → Salvar: POST /api/scripts → cria Script + versão 1
```

#### Melhoria com IA:
```
Texto do roteiro + focus opcional
  → POST /api/generate/improve
  → Retorna: improved_lines, problems_found, analysis
```

#### Geração de Hooks:
```
theme + hook_type + count (5)
  → POST /api/generate/hooks
  → Retorna: { hooks: ["hook 1", "hook 2", ...] }
```

---

### 4. Gestão de Roteiros (`/scripts`)

#### Lista
```
GET /api/scripts?status={status}&niche={niche}&theme={theme}&limit={limit}
```
Filtros: status (draft, approved, published, analyzed, archived), nicho, tema.

#### Detalhe (`/scripts/{id}`)
```
GET /api/scripts/{id}              → Roteiro com versão atual
GET /api/scripts/{id}/versions     → Histórico de versões
GET /api/scripts/{id}/versions/{n} → Versão específica
GET /api/scripts/{id}/compare?v1=X&v2=Y → Diff entre versões
```

**Ações disponíveis:**
| Ação | Endpoint | Descrição |
|------|----------|-----------|
| Editar | `PATCH /api/scripts/{id}/versions` | Cria nova versão |
| Melhorar | `POST /api/generate/improve` | IA melhora o roteiro |
| Mudar status | `PATCH /api/scripts/{id}/status?status=X` | Workflow de status |
| Vincular vídeo | `POST /api/scripts/{id}/link-video` | Associa a Short do YouTube |
| Deletar | `DELETE /api/scripts/{id}` | Remove roteiro |

---

### 5. Integração YouTube (`/youtube`)

#### Conexão
```
1. Exibe status: GET /api/youtube/channel
2. Se não conectado: GET /api/auth/youtube/connect → retorna authorization_url
3. Usuário autoriza no Google
4. Callback salva tokens
```

#### Sincronização de Shorts
```
POST /api/youtube/sync → retorna task_id
  → Frontend faz polling a cada 2s em GET /api/tasks/{taskId}
  → Resultado: { shorts_synced, metrics_updated }
```

#### Lista de Shorts
```
GET /api/youtube/shorts?limit=12&offset={offset}
  → Grid com: thumbnail, título, duração, data
  → Badges: "Transcrito" (tem transcrição), "Vinculado" (tem roteiro)
```

#### Detalhe do Short (`/youtube/shorts/{id}`)

**Dados carregados:**
```
GET /api/youtube/shorts/{id}                → Dados do Short
GET /api/youtube/shorts/{id}/metrics        → Métricas atuais
GET /api/youtube/shorts/{id}/metrics/history → Histórico de métricas
```

**Métricas exibidas:**
- Views, likes, comments, shares, subscribers_gained
- Avg view duration, avg view percentage (retenção)
- Impressions, CTR, engagement_rate
- Scores da análise de performance (se disponível)

**Ações:**
| Ação | Endpoint | Descrição |
|------|----------|-----------|
| Buscar métricas | `POST /api/youtube/shorts/{id}/fetch-metrics` | Atualiza via YouTube API |
| Buscar transcrição | `POST /api/youtube/shorts/{id}/fetch-transcript` | Busca legenda/Whisper |
| Analisar performance | `POST /api/analysis/performance/{id}` | IA analisa (async) |
| Métricas manuais | `POST /api/youtube/metrics/manual` | Entrada manual |

#### Formulário de Métricas Manuais:
| Campo | Obrigatório |
|-------|:-----------:|
| views | Sim |
| likes | Não |
| comments | Não |
| shares | Não |
| subscribers_gained | Não |
| avg_view_duration_seconds | Não |
| avg_view_percentage | Não |
| impressions | Não |
| impressions_ctr | Não |

---

### 6. Analytics (`/analytics`)

#### Cards de resumo:
- Total de Shorts importados
- Total de roteiros
- Insights ativos
- Sugestões geradas

#### Duas ações de IA:

**Analisar Canal:**
```
POST /api/analysis/channel → task_id
  → Analisa todos os Shorts
  → Identifica padrões de sucesso
  → Gera sugestões de vídeo
  → Mostra progresso (current_step + progress)
```

**Identificar Padrões:**
```
POST /api/analysis/patterns → task_id
  → Consolida insights de todas as análises de performance
  → Valida/invalida padrões existentes
  → Descobre novos aprendizados
```

---

### 7. Insights (`/insights`)

```
GET /api/insights?category={cat}&sentiment={sent}&niche={niche}&active_only={bool}&limit={limit}
```

#### Filtros:
- **Categoria:** hook, retention, cta, narrative, topic, speaking_style, timing, audience, general
- **Sentimento:** positive, negative, neutral
- **Toggle:** apenas ativos

#### Card de Insight exibe:
- Título e descrição
- Badge de categoria (colorido)
- Badge de sentimento (verde/vermelho/cinza)
- Barra de confiança (%)
- Número de validações
- Evidências (short_id, métrica, valor)

#### Ações:
- Toggle ativar/desativar: `PATCH /api/insights/{id}?is_active={bool}`
- Gerar novos: `POST /api/insights/generate` → task assíncrona

---

### 8. Sugestões/Ideias (`/ideas`)

```
GET /api/suggestions?category={cat}&status={status}&limit={limit}
```

#### Filtros:
- **Categoria:** high_view_potential, high_retention_potential, continuation, variation, experiment, brand_reinforcement
- **Status:** pending, accepted, rejected, converted_to_script

#### Card de Sugestão exibe:
- Título
- Descrição (resumida)
- Justificativa (baseada em dados)
- Hook sugerido
- Duração estimada
- Badge de categoria
- Score de confiança

#### Ações:
| Ação | O que acontece |
|------|---------------|
| Aceitar | `PATCH /api/suggestions/{id}?status=accepted` |
| Rejeitar | `PATCH /api/suggestions/{id}?status=rejected` |
| Converter em roteiro | `POST /api/suggestions/{id}/convert` → cria Script + versão |
| Gerar novas | `POST /api/suggestions/generate` → task assíncrona |

---

### 9. Importação de Vídeos (`/import`)

#### Três métodos:

**A) Texto:**
```
Inputs: title, text (min 10 chars), creator_name, niche
  → POST /api/videos/text → { video_id, task_id, status }
```

**B) Arquivo (upload):**
```
Formatos: .txt, .mp4, .mp3, .wav (max 25MB)
Inputs: creator_name, niche
  → POST /api/videos/upload (FormData) → { video_id, task_id }
  → Progresso: transcribing → analyzing → embedding → done
```

**C) URL:**
```
Uma ou mais URLs (separadas por vírgula/linha)
Inputs: creator_name, niche
  → POST /api/videos/url (por URL) → { video_id, task_id }
```

**Polling de status:** `GET /api/tasks/{taskId}` a cada 2 segundos.

---

### 10. Perfis de Estilo (`/styles`)

#### Criar:
```
Selecionar vídeos processados (status='done') + nome
  → POST /api/styles/generate { video_ids[], name }
  → Retorna: StyleProfile (tom, ritmo, hooks comuns, regras do/avoid)
```

#### Detalhe (`/styles/{id}`):
- Tom, ritmo, média de tamanho de frase
- Regras "do" e "avoid"
- Padrões narrativos
- Hooks e CTAs comuns
- Vídeos vinculados (add/remove)

---

## Gerenciamento de Estado

### Auth Store (Zustand)
```
user: User | null
isAuthenticated: boolean
isLoading: boolean
hasHydrated: boolean
Actions: login(), register(), logout(), fetchUser(), refreshToken(), hydrate()
```

### App Store (Zustand)
```
theme: "light" | "dark"
sidebarOpen: boolean
Actions: toggleTheme(), setSidebarOpen()
Persistido no localStorage
```

---

## Hooks Principais (React Query)

| Hook | Endpoint | Uso |
|------|----------|-----|
| `useGenerateScript()` | POST /api/generate/script | Gera roteiro com IA |
| `useImproveScript()` | POST /api/generate/improve | Melhora roteiro |
| `useGenerateHooks()` | POST /api/generate/hooks | Gera hooks |
| `useScripts()` | GET /api/scripts | Lista roteiros |
| `useScript()` | GET /api/scripts/{id} | Detalhe roteiro |
| `useScriptVersions()` | GET /api/scripts/{id}/versions | Versões |
| `useYouTubeShorts()` | GET /api/youtube/shorts | Lista Shorts |
| `useYouTubeShort()` | GET /api/youtube/shorts/{id} | Detalhe Short |
| `useShortMetrics()` | GET /api/youtube/shorts/{id}/metrics | Métricas |
| `useAnalyzePerformance()` | POST /api/analysis/performance/{id} | Analisa Short |
| `useAnalyzeChannel()` | POST /api/analysis/channel | Analisa canal |
| `useIdentifyPatterns()` | POST /api/analysis/patterns | Identifica padrões |
| `useInsights()` | GET /api/insights | Lista insights |
| `useSuggestions()` | GET /api/suggestions | Lista sugestões |
| `useConvertSuggestion()` | POST /api/suggestions/{id}/convert | Converte em roteiro |
| `useTaskStatus()` | GET /api/tasks/{id} | Polling de tasks |

---

## Tratamento de Erros

```typescript
// Estrutura de erro da API
{ error: { code: string, message: string, details?: unknown } }

// Erros de validação (422)
detail[]: { field: value, msg: error_message }

// Auto-retry em 401 com token refresh
// Limpa tokens inválidos automaticamente
```

---

## Padrões de UI

- **Loading:** Spinner (Loader2)
- **Erro:** AlertCircle + mensagem
- **Vazio:** EmptyState (ícone + título + descrição + ação opcional)
- **Listas:** Toggle grid/list view
- **Paginação:** Prev/Next com indicador de página
- **Feedback:** Toast notifications para ações assíncronas
- **Idioma:** Português (pt-BR)
- **Tema:** Light/Dark mode via Tailwind
