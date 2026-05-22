$git = "C:\Program Files\Git\cmd\git.exe"
$dir = "C:\Users\2NV\Desktop\Prueba de IPM"
$log = "$dir\sync-log.txt"
$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

try {
  Set-Location $dir

  & $git add -A
  $status = & $git status --porcelain
  if (-not $status) {
    Add-Content -Path $log -Value "$date - No hay cambios que subir"
    exit 0
  }

  & $git commit -m "Auto-sync $date"
  & $git push origin main 2>&1 | Out-Null

  Add-Content -Path $log -Value "$date - Sincronizado correctamente"
} catch {
  Add-Content -Path $log -Value "$date - ERROR: $_"
}
