$dir = "C:\Users\2NV\Desktop\Prueba de IPM"
$log = "$dir\sync-log.txt"
$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Add-Content -Path $log -Value "$date - Auto-sync deshabilitado. Los cambios se revisan y publican manualmente en main."
