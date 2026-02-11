Attribute VB_Name = "ExportToSharePoint"
' =====================================================
' Macro: ExportToSharePoint
' Descrição: Exporta tarefas de resumo do MS Project para Excel
' para sincronização com SharePoint List via Power Automate.
' =====================================================
Sub ExportToSharePoint()
    
    Dim xlApp As Object
    Dim xlWB As Object
    Dim xlWS As Object
    Dim t As Task
    Dim row As Long
    
    ' ===== CONFIGURAÇÃO =====
    ' Caminho da pasta sincronizada (Ajuste se necessário)
    ' Usa a variável de ambiente OneDrive para encontrar a pasta correta
    Dim exportPath As String
    exportPath = Environ("OneDrive") & "\Documentos\Projetos_Grandes_Reparos"
    
    ' Nome do arquivo (que o Power Automate vai ler)
    Dim fileName As String
    fileName = "Dados_Projetos.xlsx"
    ' ========================
    
    ' Cria a pasta se não existir
    If Dir(exportPath, vbDirectory) = "" Then
        On Error Resume Next
        MkDir exportPath
        On Error GoTo 0
    End If
    
    ' Verifica se a pasta existe antes de continuar
    If Dir(exportPath, vbDirectory) = "" Then
        MsgBox "Erro: Não foi possível encontrar ou criar a pasta: " & exportPath, vbCritical
        Exit Sub
    End If
    
    ' Inicia Excel
    Set xlApp = CreateObject("Excel.Application")
    xlApp.Visible = False ' Executa em background
    Set xlWB = xlApp.Workbooks.Add
    Set xlWS = xlWB.Sheets(1)
    xlWS.Name = "Projetos"
    
    ' Cabeçalhos (Devem bater com o Power Automate)
    Dim headers As Variant
    headers = Array("Titulo", "Coordenador", "Status", "DataInicio", "DataTermino", "Progresso", "CustoOrcado", "CustoRealizado", "Comentarios")
    
    Dim i As Integer
    For i = 0 To UBound(headers)
        xlWS.Cells(1, i + 1).Value = headers(i)
        xlWS.Cells(1, i + 1).Font.Bold = True
    Next i
    
    row = 2
    
    ' Loop pelas tarefas
    For Each t In ActiveProject.Tasks
        If Not t Is Nothing Then
            ' Exporta apenas Tarefas de Resumo (Nível 1 ou marcadas como Summary)
            ' Ajuste "OutlineLevel = 1" se seus projetos forem subtarefas de um projeto mestre
            If t.OutlineLevel = 1 Then
                
                ' 1. Titulo
                xlWS.Cells(row, 1).Value = t.Name
                
                ' 2. Coordenador (Nomes dos recursos ou campo customizado)
                xlWS.Cells(row, 2).Value = t.ResourceNames
                
                ' 3. Status (Lógica Automática)
                Dim status As String
                If t.PercentComplete = 100 Then
                    status = "Concluído"
                ElseIf t.Finish < Date And t.PercentComplete < 100 Then
                    status = "Atrasado"
                ElseIf t.PercentComplete > 0 Then
                    status = "Em Andamento"
                Else
                    status = "Não Iniciado"
                End If
                xlWS.Cells(row, 3).Value = status
                
                ' 4. Datas
                xlWS.Cells(row, 4).Value = t.Start
                xlWS.Cells(row, 5).Value = t.Finish
                
                ' 5. Progresso
                xlWS.Cells(row, 6).Value = t.PercentComplete
                
                ' 6. Custos
                xlWS.Cells(row, 7).Value = t.Cost
                xlWS.Cells(row, 8).Value = t.ActualCost
                
                ' 7. Comentários (Notas da tarefa)
                xlWS.Cells(row, 9).Value = t.Notes
                
                row = row + 1
            End If
        End If
    Next t
    
    ' Formatar como Tabela (Essencial para o Power Automate)
    If row > 2 Then
        Dim rng As Object
        Set rng = xlWS.Range("A1:I" & row - 1)
        xlWS.ListObjects.Add(1, rng, , 1).Name = "TabelaProjetos"
        xlWS.Columns.AutoFit
        
        ' Salvar
        Application.DisplayAlerts = False ' Sobrescrever sem perguntar
        xlWB.SaveAs exportPath & "\" & fileName, 51 ' 51 = xlOpenXMLWorkbook (xlsx)
        Application.DisplayAlerts = True
        
        MsgBox "Exportação Concluída com Sucesso!" & vbNewLine & _
               "Local: " & exportPath & "\" & fileName, vbInformation
    Else
        MsgBox "Nenhum projeto de nível 1 encontrado para exportar.", vbExclamation
    End If
    
    ' Limpeza
    xlWB.Close False
    xlApp.Quit
    Set xlWS = Nothing
    Set xlWB = Nothing
    Set xlApp = Nothing

End Sub
