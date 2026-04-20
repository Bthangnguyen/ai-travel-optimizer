$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open("C:\Users\ADM\OneDrive - VNU-HCMUS\Documents\New project\video-demo\Chapter 6 Prompt.docx")
$doc.Content.Text | Out-File -FilePath "C:\Users\ADM\OneDrive - VNU-HCMUS\Documents\New project\video-demo\chapter6_prompt.txt" -Encoding utf8
$doc.Close()
$word.Quit()
Write-Host "Done extracting docx"
