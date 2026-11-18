# Digi · Prudential Control Center

Plataforma de controle da operação Prudential: dashboard, pauta e demandas (kanban, lista e calendário), reuniões, controle contratual, Instagram, réguas e One-Pager semanal.

É um site estático (HTML + JavaScript, sem build). Roda direto no GitHub Pages.

## Estrutura

| Arquivo | O que é |
|---|---|
| `index.html` | Entrada do site; redireciona para a página principal |
| `Prudential Control Center.dc.html` | Página principal (menu lateral, busca, alertas) |
| `PCC Dashboard.dc.html` | Dashboard |
| `PCC Demandas.dc.html` | Pauta e demandas |
| `PCC Reunioes.dc.html` | Reuniões |
| `PCC Contrato.dc.html` | Controle contratual |
| `PCC Instagram.dc.html` | Calendário e fluxo do Instagram |
| `PCC Reguas.dc.html` | Réguas / campanhas |
| `PCC OnePager.dc.html` | One-Pager semanal |
| `store.js` | Base de dados (localStorage) e regras de negócio |
| `support.js` | Runtime que renderiza as páginas `.dc.html` (carrega React 18 do unpkg) |

## Rodar localmente

As páginas carregam umas às outras via `fetch`, então **não funcionam abrindo o arquivo direto** (`file://`). Use um servidor local:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Dados

Os dados ficam no `localStorage` do navegador de quem usa (chave `digi-prudential-v1`).
Cada pessoa / navegador / endereço tem a sua própria base. Para levar dados de um lugar para outro, use **Dados e backup → Exportar backup (.json)** e depois **Importar backup** no novo endereço.
