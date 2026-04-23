# 🔄 Conexão MPP → SharePoint List via Power Automate

## Visão Geral da Arquitetura

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────────────┐
│  MS Project      │     │  SharePoint Folder    │     │  SharePoint List             │
│  (.mpp file)     │────►│  "Arquivos_MPP"       │────►│  "Base-Projetos-Grandes-     │
│                  │save │  (ou OneDrive)        │ PA  │   Reparos"                   │
└─────────────────┘     └──────────────────────┘     └─────────────────────────────┘
                              │                              │
                              │  Power Automate              │
                              │  (trigger: file modified)    │
                              └──────────────────────────────┘
```

---

## 📋 Pré-requisitos

- [ ] Microsoft 365 com licença Power Automate
- [ ] Acesso ao SharePoint site onde está a lista "Base-Projetos-Grandes-Reparos"
- [ ] MS Project Desktop (qualquer versão)
- [ ] Permissões de edição na lista SharePoint

---

## ⚡ APPROACH A: Project Online Connector (Recomendado se disponível)

> Use esta abordagem se sua organização tem **Project Online** (Project for the Web / PWA).

### Passo 1: Verificar se você tem Project Online

1. Acesse: `https://[seu-tenant].sharepoint.com/sites/pwa`
2. Se o site existir, você tem Project Online
3. Se não, pule para **Approach B**

### Passo 2: Criar o Fluxo no Power Automate

1. Acesse: https://make.powerautomate.com
2. Clique em **"+ Criar"** → **"Fluxo de nuvem automatizado"**
3. Nome: `Sync Project Online → SharePoint List`

### Passo 3: Configurar o Trigger

- **Trigger**: `Project Online - When a project is published`
- **URL do Project Web App**: `https://[seu-tenant].sharepoint.com/sites/pwa`

### Passo 4: Obter dados do projeto

Adicione a ação:
- **"Project Online - List projects"**
- Ou **"Project Online - Get project details"** com o ID do trigger

### Passo 5: Atualizar SharePoint List

Adicione a ação **"SharePoint - Create item"** (ou "Update item"):

| Campo SharePoint | Valor do Project Online |
|-----------------|----------------------|
| Título | `@{triggerOutputs()?['body/Name']}` |
| Coordenador do Projeto | `@{triggerOutputs()?['body/ProjectOwner']}` |
| Dt. de Início | `@{triggerOutputs()?['body/ProjectStartDate']}` |
| Dt. de Término | `@{triggerOutputs()?['body/ProjectFinishDate']}` |
| Progresso (%) | `@{triggerOutputs()?['body/ProjectPercentComplete']}` |
| Custo Orçado | `@{triggerOutputs()?['body/ProjectCost']}` |
| Custo Realizado | `@{triggerOutputs()?['body/ProjectActualCost']}` |
| Status | (ver lógica no Passo 6) |

### Passo 6: Lógica de Status automático

Adicione uma ação **"Condição"** antes do Create/Update:

```
SE Progresso = 100 → Status = "Concluído"
SE Dt. de Término < hoje E Progresso < 100 → Status = "Atrasado"  
SE Progresso > 0 E Progresso < 100 → Status = "Em Andamento"
SE Progresso = 0 → Status = "Não Iniciado"
```

No Power Automate, use **"Switch"** ou **"Condition"** aninhados:

```
Condition: @equals(triggerOutputs()?['body/ProjectPercentComplete'], 100)
  Yes → Set variable Status = "Concluído"
  No → 
    Condition: @less(triggerOutputs()?['body/ProjectFinishDate'], utcNow())
      Yes → Set variable Status = "Atrasado"
      No →
        Condition: @greater(triggerOutputs()?['body/ProjectPercentComplete'], 0)
          Yes → Set variable Status = "Em Andamento"
          No → Set variable Status = "Não Iniciado"
```

---

## ⚡ APPROACH B: MPP → Excel → Power Automate (Mais Universal)

> Use esta abordagem se você tem apenas o **MS Project Desktop**.
> É o método mais comum e funciona em qualquer ambiente M365.

### PARTE 1: Configurar a Exportação do MS Project

#### Passo 1: Criar uma View de Exportação no MS Project

1. Abra seu arquivo `.mpp` no MS Project
2. Vá em **View** → **Tables** → **More Tables**
3. Clique **"New..."** e crie uma tabela chamada `"ExportDashboard"` com os campos:
   - Name (Nome)
   - Start (Início)
   - Finish (Término)
   - % Complete (% Concluída)
   - Cost (Custo)
   - Actual Cost (Custo Real)
   - Notes (Anotações)

#### Passo 2: Exportar para Excel

**Opção Manual (uma vez por atualização):**
1. No MS Project, vá em **File** → **Save As**
2. Escolha o formato: **Excel Workbook (*.xlsx)**
3. Salve na pasta SharePoint/OneDrive: 
   ```
   SharePoint > Documentos > Projetos_MPP > [nome-do-projeto].xlsx
   ```
4. No assistente de exportação, selecione a tabela `"ExportDashboard"`
5. Marque apenas **tarefas de resumo (Summary Tasks)** se quiser nível macro

**Opção com Macro VBA (automática ao salvar):**

Abra o VBA Editor (Alt+F11) no MS Project e adicione este módulo:

```vba
' =====================================================
' Macro: ExportToSharePoint
' Exports summary task data to an Excel file in a 
' SharePoint/OneDrive synced folder.
' =====================================================
Sub ExportToSharePoint()
    
    Dim xlApp As Object
    Dim xlWB As Object
    Dim xlWS As Object
    Dim t As Task
    Dim row As Long
    
    ' ===== CONFIGURE THESE =====
    ' Path to the SharePoint/OneDrive synced folder
    Dim exportPath As String
    exportPath = Environ("OneDrive") & "\Documentos\Projetos_MPP\"
    
    ' File name (use project name)
    Dim fileName As String
    fileName = "Projetos_GrandesReparos.xlsx"
    ' ===========================
    
    ' Create folder if it doesn't exist
    If Dir(exportPath, vbDirectory) = "" Then
        MkDir exportPath
    End If
    
    ' Create Excel instance
    Set xlApp = CreateObject("Excel.Application")
    xlApp.Visible = False
    Set xlWB = xlApp.Workbooks.Add
    Set xlWS = xlWB.Sheets(1)
    xlWS.Name = "Projetos"
    
    ' Headers
    xlWS.Cells(1, 1).Value = "Titulo"
    xlWS.Cells(1, 2).Value = "Coordenador"
    xlWS.Cells(1, 3).Value = "Status"
    xlWS.Cells(1, 4).Value = "DataInicio"
    xlWS.Cells(1, 5).Value = "DataTermino"
    xlWS.Cells(1, 6).Value = "Progresso"
    xlWS.Cells(1, 7).Value = "CustoOrcado"
    xlWS.Cells(1, 8).Value = "CustoRealizado"
    xlWS.Cells(1, 9).Value = "Comentarios"
    
    row = 2
    
    ' Loop through summary tasks (Level 1 = project level)
    For Each t In ActiveProject.Tasks
        If Not t Is Nothing Then
            ' Export only summary tasks or tasks at outline level 1
            If t.Summary Or t.OutlineLevel = 1 Then
                xlWS.Cells(row, 1).Value = t.Name
                
                ' Resource names as coordinator
                xlWS.Cells(row, 2).Value = t.ResourceNames
                
                ' Auto-determine status
                If t.PercentComplete = 100 Then
                    xlWS.Cells(row, 3).Value = "Concluído"
                ElseIf t.Finish < Date And t.PercentComplete < 100 Then
                    xlWS.Cells(row, 3).Value = "Atrasado"
                ElseIf t.PercentComplete > 0 Then
                    xlWS.Cells(row, 3).Value = "Em Andamento"
                Else
                    xlWS.Cells(row, 3).Value = "Não Iniciado"
                End If
                
                xlWS.Cells(row, 4).Value = Format(t.Start, "yyyy-mm-dd")
                xlWS.Cells(row, 5).Value = Format(t.Finish, "yyyy-mm-dd")
                xlWS.Cells(row, 6).Value = t.PercentComplete
                xlWS.Cells(row, 7).Value = t.Cost
                xlWS.Cells(row, 8).Value = t.ActualCost
                xlWS.Cells(row, 9).Value = t.Notes
                
                row = row + 1
            End If
        End If
    Next t
    
    ' Auto-fit columns
    xlWS.Columns("A:I").AutoFit
    
    ' Format as table
    Dim rng As Object
    Set rng = xlWS.Range("A1:I" & row - 1)
    xlWS.ListObjects.Add(1, rng, , 1).Name = "TabelaProjetos"
    
    ' Save
    xlWB.SaveAs exportPath & fileName, 51 ' 51 = xlsx
    xlWB.Close False
    xlApp.Quit
    
    Set xlWS = Nothing
    Set xlWB = Nothing
    Set xlApp = Nothing
    
    MsgBox "Exportação concluída!" & vbNewLine & _
           "Arquivo: " & exportPath & fileName & vbNewLine & _
           (row - 2) & " projetos exportados.", vbInformation
           
End Sub
```

> 💡 **Dica**: Associe a macro ao evento `Project_BeforeSave` para exportar automaticamente toda vez que salvar o MPP.

#### Passo 3: Verificar o arquivo Excel

Após executar a macro ou exportar manualmente, o arquivo Excel deve ficar na pasta sincronizada do OneDrive/SharePoint com esta estrutura:

| Titulo | Coordenador | Status | DataInicio | DataTermino | Progresso | CustoOrcado | CustoRealizado | Comentarios |
|--------|-------------|--------|------------|-------------|-----------|-------------|----------------|-------------|
| Reforma AF3 | Carlos Silva | Em Andamento | 2026-01-15 | 2026-06-30 | 42 | 2500000 | 980000 | Fase de... |

---

### PARTE 2: Criar o Fluxo Power Automate (Excel → SharePoint List)

#### Passo 1: Acessar Power Automate

1. Acesse: **https://make.powerautomate.com**
2. Clique em **"+ Criar"** → **"Fluxo de nuvem automatizado"**
3. Nome do fluxo: `Sync MPP Excel → SharePoint List`

#### Passo 2: Configurar o Trigger

1. Pesquise: **"SharePoint - When a file is modified"**
   - **Ou**: **"OneDrive for Business - When a file is modified"**
2. Configure:
   - **Site**: Seu site SharePoint
   - **Pasta**: `/Documentos/Projetos_MPP` (ou onde salvou o Excel)
   - **Incluir subpastas**: Não

> ⏱️ O trigger verifica a cada ~3 minutos por padrão

#### Passo 3: Ler as linhas do Excel

Adicione a ação:
1. **"Excel Online (Business) - List rows present in a table"**
2. Configure:
   - **Localização**: O site SharePoint ou OneDrive
   - **Biblioteca de Documentos**: Documentos
   - **Arquivo**: `/Projetos_MPP/Projetos_GrandesReparos.xlsx`
   - **Tabela**: `TabelaProjetos`

#### Passo 4: Limpar itens antigos da lista (opcional)

> Isto garante que a lista sempre reflita exatamente o arquivo MPP.

Adicione:
1. **"SharePoint - Get items"**
   - **Site**: Seu site
   - **Lista**: `Base-Projetos-Grandes-Reparos`
   
2. **"Apply to each"** sobre os itens retornados:
   - Dentro: **"SharePoint - Delete item"**
   - **Id**: `@{items('Apply_to_each')?['ID']}`

> ⚠️ **Alternativa sem deletar**: Em vez de limpar e recriar, você pode fazer um "upsert" (verificar se existe pelo título e atualizar, ou criar novo). Veja a seção "Upsert" abaixo.

#### Passo 5: Criar itens na lista SharePoint

Adicione outro **"Apply to each"** sobre as linhas do Excel:

1. Selecione: `value` (do "List rows present in a table")
2. Dentro, adicione: **"SharePoint - Create item"**

Configure o mapeamento:

| Campo da Lista | Expressão / Valor do Excel |
|---------------|---------------------------|
| **Título** | `@{items('Apply_to_each_2')?['Titulo']}` |
| **Coordenador do Projeto** | `@{items('Apply_to_each_2')?['Coordenador']}` |
| **Status** | `@{items('Apply_to_each_2')?['Status']}` |
| **Dt. de Início** | `@{items('Apply_to_each_2')?['DataInicio']}` |
| **Dt. de Término** | `@{items('Apply_to_each_2')?['DataTermino']}` |
| **Progresso (%)** | `@{int(items('Apply_to_each_2')?['Progresso'])}` |
| **Custo Orçado** | `@{float(items('Apply_to_each_2')?['CustoOrcado'])}` |
| **Custo Realizado** | `@{float(items('Apply_to_each_2')?['CustoRealizado'])}` |
| **Comentários** | `@{items('Apply_to_each_2')?['Comentarios']}` |

#### Passo 5 (Alternativa): Upsert - Atualizar ou Criar

Em vez de deletar tudo e recriar, faça um upsert:

```
Para cada linha do Excel:
  1. "SharePoint - Get items" com filtro:
     Filter Query: Title eq '@{items('Apply_to_each')?['Titulo']}'
  
  2. Condição: length(body('Get_items')?['value']) > 0
     
     SIM (existe) → "SharePoint - Update item"
        Id: @{first(body('Get_items')?['value'])?['ID']}
        (mapear todos os campos)
     
     NÃO (novo) → "SharePoint - Create item"
        (mapear todos os campos)
```

#### Passo 6: Adicionar notificação (opcional)

No final do fluxo, adicione:
- **"Send an email notification (V3)"** ou
- **"Post message in a chat or channel"** (Teams)

Conteúdo:
```
✅ Lista "Base-Projetos-Grandes-Reparos" atualizada com sucesso!
📊 Total de projetos: @{length(body('List_rows_present_in_a_table')?['value'])}
🕐 Última atualização: @{utcNow()}
```

#### Passo 7: Testar e ativar

1. Clique **"Testar"** no canto superior direito
2. Selecione **"Manualmente"**
3. Abra o arquivo Excel e faça uma alteração pequena (salvar novamente)
4. Verifique se a lista SharePoint foi atualizada
5. Se bem-sucedido, o fluxo ficará ativo automaticamente

---

### PARTE 3: Fluxo Completo (Diagrama)

```
┌────────────────────────────────────────────────────────────┐
│                    POWER AUTOMATE FLOW                      │
│                                                              │
│  ┌─────────────────────────────────────┐                    │
│  │ TRIGGER: File modified in           │                    │
│  │ SharePoint/OneDrive folder          │                    │
│  │ (Projetos_MPP/*.xlsx)               │                    │
│  └──────────────┬──────────────────────┘                    │
│                 │                                            │
│  ┌──────────────▼──────────────────────┐                    │
│  │ Excel Online: List rows from        │                    │
│  │ table "TabelaProjetos"              │                    │
│  └──────────────┬──────────────────────┘                    │
│                 │                                            │
│  ┌──────────────▼──────────────────────┐                    │
│  │ SharePoint: Get existing items      │                    │
│  │ from "Base-Projetos-Grandes-        │                    │
│  │ Reparos"                            │                    │
│  └──────────────┬──────────────────────┘                    │
│                 │                                            │
│  ┌──────────────▼──────────────────────┐                    │
│  │ FOR EACH Excel row:                 │                    │
│  │  ┌──────────────────────────────┐   │                    │
│  │  │ Check if exists in SP list   │   │                    │
│  │  │ (filter by Title)            │   │                    │
│  │  └──────────┬───────────────────┘   │                    │
│  │             │                       │                    │
│  │     ┌───────┴────────┐              │                    │
│  │     │                │              │                    │
│  │  ┌──▼────┐     ┌────▼───┐          │                    │
│  │  │EXISTS │     │  NEW   │          │                    │
│  │  │Update │     │ Create │          │                    │
│  │  │ Item  │     │  Item  │          │                    │
│  │  └───────┘     └────────┘          │                    │
│  └─────────────────────────────────────┘                    │
│                 │                                            │
│  ┌──────────────▼──────────────────────┐                    │
│  │ Send notification (email/Teams)     │                    │
│  └─────────────────────────────────────┘                    │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

---

## ⚡ APPROACH C: Power Automate Desktop (RPA)

> Use se quiser ler o arquivo MPP diretamente, sem exportar para Excel.

### Passo 1: Instalar Power Automate Desktop

1. Baixe: https://go.microsoft.com/fwlink/?linkid=2102613
2. Instale e faça login com sua conta M365

### Passo 2: Criar um fluxo Desktop

1. Abra Power Automate Desktop
2. Crie um novo fluxo: `"Read MPP and Update SharePoint"`

### Passo 3: Adicionar ações

```
1. Launch Excel
2. Open Excel file (o .mpp exportado como .xlsx, ou usar COM automation)
3. Read from Excel worksheet → Variable: DataTable
4. Close Excel
5. For each row in DataTable:
   a. HTTP Request (SharePoint REST API):
      POST https://[site]/_api/web/lists/getbytitle('Base-Projetos-Grandes-Reparos')/items
      Body: { "Title": row["Titulo"], ... }
6. Display message: "Sync concluído!"
```

### Passo 4: Agendar no Power Automate Cloud

1. No Power Automate Cloud, crie um fluxo com trigger **"Recurrence"** (ex: diário às 8h)
2. Adicione a ação **"Desktop flows - Run a flow built with Power Automate Desktop"**
3. Selecione o fluxo criado no passo 2

---

## 🔧 Resolução de Problemas

### Nomes internos dos campos SharePoint

Os campos da lista SharePoint têm nomes internos diferentes dos nomes exibidos. Para descobrir:

1. Acesse a lista no navegador
2. Clique na engrenagem (⚙️) → **"List settings"**
3. Em "Columns", clique no nome da coluna
4. Na URL, o parâmetro `Field=` mostra o nome interno

Exemplo:
```
.../_layouts/15/FldEdit.aspx?List=...&Field=Coordenador_x0020_do_x0020_Projeto
```

### O trigger não dispara

- Verifique se o arquivo está na pasta correta
- O trigger pode levar até 3 minutos para detectar alterações
- Certifique-se de que a pasta é uma **biblioteca de documentos** do SharePoint

### Erro de permissão

- O fluxo usa as permissões do usuário que o criou
- Certifique-se de ter permissão de **Edição** na lista SharePoint
- Para fluxos que rodam automaticamente, considere usar uma **Service Account**

---

## 📌 Resumo Rápido

| Etapa | O que fazer | Onde |
|-------|------------|------|
| 1 | Criar macro VBA ou exportar Excel manualmente | MS Project |
| 2 | Salvar o .xlsx na pasta sincronizada | SharePoint/OneDrive |
| 3 | Criar o fluxo Power Automate | make.powerautomate.com |
| 4 | Configurar trigger (file modified) | Power Automate |
| 5 | Ler as linhas do Excel | Power Automate |
| 6 | Criar/Atualizar itens na lista SP | Power Automate |
| 7 | Testar e ativar | Power Automate |

---

## ⏭️ Próximo Passo

Depois de configurar o fluxo Power Automate, a lista SharePoint será populada automaticamente. Em seguida, conectamos o dashboard React à lista SharePoint (editar `src/services/sp.ts`).
