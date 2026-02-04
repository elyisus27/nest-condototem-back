$IP_TABLET = "192.168.100.14" # <--- CAMBIA ESTO POR LA IP FIJA DE TU TABLET
$RANGO_PUERTOS = 30000..45000

Write-Host "Buscando puerto de ADB inalambrico en $IP_TABLET..." -ForegroundColor Cyan

foreach ($Puerto in $RANGO_PUERTOS) {
    # Escaneo rápido del puerto
    $socket = New-Object System.Net.Sockets.TcpClient
    $connect = $socket.BeginConnect($IP_TABLET, $Puerto, $null, $null)
    $wait = $connect.AsyncWaitHandle.WaitOne(10, $false) # Tiempo de espera de 10ms por puerto

    if ($wait) {
        $socket.EndConnect($connect)
        Write-Host "[!] Puerto encontrado: $Puerto. Intentando conectar..." -ForegroundColor Green
        
        # Intentamos la conexión formal con ADB
        $resultado = adb connect "$($IP_TABLET):$Puerto"
        
        if ($resultado -like "*connected*") {
            Write-Host "OK: Conectado con exito a la tablet." -ForegroundColor Green
            $socket.Close()
            break
        }
    }
    $socket.Close()
}