<#
  Ejecuta Lighthouse CI localmente en Windows conectándose a Chrome por
  remote debugging. Esto evita que Lighthouse/ChromeLauncher cree y destruya
  su propio perfil temporal, que en Windows suele fallar con EPERM/taskkill.
#>

$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$build = Join-Path $root 'build\client'
$localConfig = Join-Path $root '.lighthouserc.local.cjs'
$chromeProfile = Join-Path $root '.tmp\lhci-chrome-profile'
$port = 9222

if (-not (Test-Path -LiteralPath $build)) {
  Write-Host 'No existe build/client. Para ejecutar Lighthouse local necesitas generar el build primero.' -ForegroundColor Yellow
  Write-Host 'Comando manual: npm run build' -ForegroundColor Yellow
  Write-Host 'Nota: el agente no ejecuta build local por regla del proyecto; tú puedes hacerlo si quieres auditar localmente.' -ForegroundColor Yellow
  exit 1
}

$chromeCandidates = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "$env:ProgramFiles(x86)\Google\Chrome\Application\chrome.exe",
  "$env:LocalAppData\Google\Chrome\Application\chrome.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe"
)

$chromePath = $chromeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

if (-not $chromePath) {
  Write-Host 'No encontré Chrome ni Edge en rutas conocidas.' -ForegroundColor Red
  Write-Host 'Instala Chrome/Edge o ajusta scripts/run-lhci-local.ps1 con la ruta correcta.' -ForegroundColor Red
  exit 1
}

New-Item -ItemType Directory -Force -Path $chromeProfile | Out-Null

function Test-DebugPort {
  try {
    Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:$port/json/version" -TimeoutSec 1 | Out-Null
    return $true
  } catch {
    return $false
  }
}

$startedChrome = $false
$chromeProcess = $null

if (-not (Test-DebugPort)) {
  Write-Host "Lanzando navegador para Lighthouse: $chromePath" -ForegroundColor Cyan
  $chromeArgs = @(
    "--remote-debugging-port=$port",
    "--user-data-dir=$chromeProfile",
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    'about:blank'
  )

  $chromeProcess = Start-Process -FilePath $chromePath -ArgumentList $chromeArgs -PassThru -WindowStyle Hidden
  $startedChrome = $true

  $ready = $false
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-DebugPort) {
      $ready = $true
      break
    }
  }

  if (-not $ready) {
    Write-Host "Chrome/Edge no abrió el puerto $port para remote debugging." -ForegroundColor Red
    exit 1
  }
} else {
  Write-Host "Usando navegador existente en remote debugging port $port." -ForegroundColor Cyan
}

Write-Host 'Ejecutando Lighthouse CI local contra Chrome remoto...' -ForegroundColor Cyan
npx @lhci/cli@0.15.1 autorun --config=$localConfig
$exitCode = $LASTEXITCODE

if ($startedChrome -and $chromeProcess -and -not $chromeProcess.HasExited) {
  try {
    Stop-Process -Id $chromeProcess.Id -Force -ErrorAction SilentlyContinue
  } catch {
    Write-Host 'No se pudo cerrar el navegador temporal; puedes cerrarlo manualmente si quedó abierto.' -ForegroundColor Yellow
  }
}

if ($exitCode -ne 0) {
  Write-Host ''
  Write-Host 'Lighthouse terminó con error.' -ForegroundColor Yellow
  Write-Host 'Si el error sigue siendo EPERM/taskkill, ejecuta CI en GitHub Actions: Linux evita la mayoría de locks de Windows.' -ForegroundColor Yellow
}

exit $exitCode
