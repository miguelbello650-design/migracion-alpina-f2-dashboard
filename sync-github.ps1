$git = "C:\Program Files\Git\cmd\git.exe"
$dir = "C:\Users\2NV\Desktop\Prueba de IPM"
$log = "$dir\sync-log.txt"
$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

try {
  Set-Location $dir

  & $git add -A 2>> $log
  $status = & $git status --porcelain
  if (-not $status) {
    Add-Content -Path $log -Value "$date - No hay cambios que subir"
    exit 0
  }

  & $git commit -m "Auto-sync $date" 2>> $log
  & $git push origin main 2>> $log

  if ($LASTEXITCODE -eq 0) {
    Add-Content -Path $log -Value "$date - Sincronizado correctamente"
  } else {
    Add-Content -Path $log -Value "$date - Error codigo: $LASTEXITCODE"
  }
} catch {
  Add-Content -Path $log -Value "$date - EXCEPTION: $_"
  Add-Content -Path $log -Value "$date - Detalle: $($_.Exception.Message)"
}
