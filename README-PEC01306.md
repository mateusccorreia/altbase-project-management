# Altbase - Dashboard de Gestão de Projetos

Dashboard de acompanhamento de projetos de Grandes Reparos, conectado à lista SharePoint "Base-Projetos-Grandes-Reparos".

## 🏗️ Arquitetura

```
MPP Files (MS Project)
    ↓ Power Automate
SharePoint List ("Base-Projetos-Grandes-Reparos")
    ↓ REST API / PnPjs
React Dashboard (este app)
```

## 📋 Campos da Lista SharePoint

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Título | Texto | Nome do projeto |
| Coordenador do Projeto | Texto | Responsável |
| Status | Escolha | Não Iniciado, Em Andamento, Concluído, Atrasado, Pausado |
| Dt. de Início | Data | Data de início do projeto |
| Dt. de Término | Data | Data de término prevista |
| Progresso (%) | Número | Percentual de conclusão (0-100) |
| Custo Orçado | Moeda | Valor orçado para o projeto |
| Custo Realizado | Moeda | Valor efetivamente gasto |
| Comentários | Texto (múltiplas linhas) | Observações e atualizações |

## 🔄 Power Automate - Fluxo MPP → SharePoint

### Configuração do Fluxo

1. **Trigger**: Quando um arquivo é criado/modificado na pasta de projetos MPP
2. **Ação**: Converter MPP → extrair dados das tarefas de resumo
3. **Ação**: Criar/atualizar item na lista "Base-Projetos-Grandes-Reparos"

> **Nota**: O MS Project (MPP) não tem conector nativo no Power Automate. 
> A abordagem recomendada é:
> - Salvar o arquivo MPP em uma pasta do SharePoint/OneDrive
> - Usar um script Office (Excel/Project Online) ou API customizada para extrair os dados
> - Atualizar a lista via ação "Create Item" ou "Update Item" do SharePoint

## 🚀 Como Rodar

```bash
npm install
npm run dev
```

## 🔌 Conectar ao SharePoint

1. Edite `src/services/sp.ts` e configure:
   - `SHAREPOINT_SITE_URL` com a URL do seu site
   - `LIST_NAME` já está configurada como "Base-Projetos-Grandes-Reparos"

2. Verifique os nomes internos dos campos em `src/types/index.ts` (constante `SP_FIELD_MAP`)

3. Em `src/App.tsx`, substitua `mockProjects` pela chamada `fetchProjectsFromSP()`

## 🛠️ Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Lucide Icons
- PnPjs (SharePoint integration)
