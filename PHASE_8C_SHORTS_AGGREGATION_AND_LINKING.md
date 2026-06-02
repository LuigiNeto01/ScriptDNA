# Phase 8C - Aggregacoes de Shorts e vinculo direto Short <-> Roteiro

## Entregas

- Backend `/api/youtube/shorts` com agregacoes de metricas mais recentes, status de analise e dados do roteiro vinculado.
- Filtros server-side para transcricao, analise e vinculo com roteiro.
- Ordenacao server-side por `recent`, `views`, `retention` e `engagement`.
- Endpoint `POST /api/youtube/shorts/{short_id}/link-script` para vincular roteiro ao Short.
- Endpoint `DELETE /api/youtube/shorts/{short_id}/link-script` para remover o vinculo.
- Sincronizacao bidirecional entre `YouTubeShort.script_id` e `Script.youtube_video_id`.
- Busca textual em `/api/scripts?q=` para apoiar selecao de roteiros no frontend.
- Frontend atualizado para consumir agregacoes diretamente na listagem e no detalhe do Short.
- Nova experiencia visual para vincular e trocar roteiro no detalhe do Short.

## Arquivos principais

- `BackEnd/app/api/routers/youtube.py`
- `BackEnd/app/api/routers/scripts.py`
- `BackEnd/app/services/short_script_link_service.py`
- `BackEnd/tests/test_youtube_phase8c.py`
- `FrontEnd/scriptdna/src/hooks/use-youtube.ts`
- `FrontEnd/scriptdna/src/hooks/use-scripts.ts`
- `FrontEnd/scriptdna/src/types/api.ts`
- `FrontEnd/scriptdna/src/features/youtube/components/ShortCard.tsx`
- `FrontEnd/scriptdna/src/features/youtube-short/components/ShortScriptLinkCard.tsx`
- `FrontEnd/scriptdna/src/features/youtube-short/components/LinkScriptDialog.tsx`
- `FrontEnd/scriptdna/src/app/youtube/page.tsx`
- `FrontEnd/scriptdna/src/app/youtube/shorts/[id]/page.tsx`
- `FrontEnd/scriptdna/tests/components/Phase8C.test.tsx`

## Regras de vinculo

- Um roteiro passa a apontar para o `youtube_video_id` do Short vinculado.
- Se o roteiro estava ligado a outro Short, o vinculo antigo e removido.
- Se o Short estava ligado a outro roteiro, o roteiro anterior perde o `youtube_video_id` correspondente.
- Quando um roteiro `approved` e vinculado a um Short, ele evolui para `published`.
- Ao remover o vinculo, `script_id` do Short e `youtube_video_id` do roteiro sao limpos quando representam a mesma ligacao.

## Validacao esperada

- Listagem de Shorts mostra views, retencao, estado de analise e status do roteiro sem consultas extras por card.
- Filtros de Shorts passam a refletir dados reais do backend.
- Detalhe do Short permite vincular, trocar e remover roteiro.
- Busca de roteiro no dialog aceita titulo, tema ou nicho.
