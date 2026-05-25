$node = "C:\nodejs\node-v22.9.0-win-x64\node.exe"
$script = Join-Path $PSScriptRoot "server.js"
Start-Process -FilePath $node -ArgumentList "`"$script`"" -WindowStyle Normal
Write-Host "Servidor iniciado en http://localhost:3000"
Start-Sleep -Seconds 1
Start-Process "http://localhost:3000"
