# Instala/verifica FFmpeg 9.x no Windows e testa recursos. Rode em PowerShell:
#   powershell -ExecutionPolicy Bypass -File .\install-ffmpeg.ps1
$ErrorActionPreference = 'Continue'

function Refresh-Path {
    $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
}
function Get-FfVersion { try { (& ffmpeg -version 2>$null | Select-Object -First 1) } catch { $null } }

Write-Host "== 1. Verificando instalacao existente ==" -ForegroundColor Cyan
Refresh-Path
$cur = Get-FfVersion
if ($cur) { Write-Host "Encontrado: $cur ($((Get-Command ffmpeg).Source))" } else { Write-Host "FFmpeg nao encontrado." }

Write-Host "`n== 2. Versoes disponiveis no winget ==" -ForegroundColor Cyan
winget show --id Gyan.FFmpeg -e --versions | Select-Object -First 8
$info = winget show --id Gyan.FFmpeg -e | Out-String
Write-Host ($info -split "`n" | Select-String 'Version|Versão' | Select-Object -First 1)

$needInstall = (-not $cur) -or ($cur -notmatch 'version\s+(n?9\.|.*-9\.)')
if ($cur -match 'version\s+\S*9\.') { $needInstall = $false }

if ($needInstall) {
    if ($cur) {
        Write-Host "`nFFmpeg existente nao e 9.x. Usando winget upgrade/install (sem duplicar)." -ForegroundColor Yellow
        winget list --id Gyan.FFmpeg -e | Out-Null
        if ($LASTEXITCODE -eq 0) { winget upgrade --id Gyan.FFmpeg -e --accept-package-agreements --accept-source-agreements }
        else { winget install --id Gyan.FFmpeg -e --accept-package-agreements --accept-source-agreements }
    } else {
        winget install --id Gyan.FFmpeg -e --accept-package-agreements --accept-source-agreements
    }
} else { Write-Host "Ja ha FFmpeg 9.x instalado; nada a instalar." }

Write-Host "`n== 3. PATH ==" -ForegroundColor Cyan
Refresh-Path
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    $bin = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Filter 'Gyan.FFmpeg*' -Directory -ErrorAction SilentlyContinue |
           ForEach-Object { Get-ChildItem $_.FullName -Recurse -Filter ffmpeg.exe | Select-Object -First 1 } |
           ForEach-Object { $_.DirectoryName } | Select-Object -First 1
    if ($bin) {
        $user = [Environment]::GetEnvironmentVariable('Path','User')
        if ($user -notlike "*$bin*") { [Environment]::SetEnvironmentVariable('Path', "$user;$bin", 'User') }
        Refresh-Path
        Write-Host "Adicionado ao PATH do usuario: $bin"
    }
}

Write-Host "`n== 4. Testes ==" -ForegroundColor Cyan
foreach ($t in 'ffmpeg','ffprobe','ffplay') {
    $c = Get-Command $t -ErrorAction SilentlyContinue
    if ($c) { Write-Host "[OK] $t -> $($c.Source)"; & $t -version 2>&1 | Select-Object -First 1 } else { Write-Host "[FALHA] $t nao encontrado" -ForegroundColor Red }
}
Write-Host "`n-- Configuracao de build --"
(& ffmpeg -version 2>&1 | Select-String 'configuration') -replace '\s+', "`n" | Select-String 'enable-(libx264|libx265|nvenc|cuda|ffnvcodec|libfdk|aac|gpl)'

Write-Host "`n== 5. Recursos ==" -ForegroundColor Cyan
$enc = & ffmpeg -hide_banner -encoders 2>&1 | Out-String
$flt = & ffmpeg -hide_banner -filters 2>&1 | Out-String
foreach ($e in 'libx264','libx265','aac','h264_nvenc','hevc_nvenc','av1_nvenc') {
    Write-Host ("{0,-12} {1}" -f $e, $(if ($enc -match "\b$e\b") {'disponivel'} else {'AUSENTE'}))
}
foreach ($f in 'scale','crop','overlay','drawtext','subtitles','scale_cuda') {
    Write-Host ("filtro {0,-11} {1}" -f $f, $(if ($flt -match "\b$f\b") {'disponivel'} else {'AUSENTE'}))
}

Write-Host "`n-- Teste real de NVENC (GPU NVIDIA) --"
$null = & ffmpeg -hide_banner -loglevel error -f lavfi -i testsrc=duration=1:size=1280x720:rate=30 -c:v h264_nvenc -f null - 2>&1
if ($LASTEXITCODE -eq 0) { Write-Host "[OK] h264_nvenc codificou com a GPU" -ForegroundColor Green }
else { Write-Host "[FALHA] NVENC indisponivel (driver NVIDIA ausente/desatualizado ou GPU sem NVENC)" -ForegroundColor Yellow }
if (Get-Command nvidia-smi -ErrorAction SilentlyContinue) { nvidia-smi --query-gpu=name,driver_version --format=csv,noheader }

Write-Host "`n-- Teste libx264/libx265/aac --"
foreach ($v in 'libx264','libx265') {
    $null = & ffmpeg -hide_banner -loglevel error -f lavfi -i testsrc=duration=1:size=640x360:rate=30 -f lavfi -i sine=duration=1 -c:v $v -c:a aac -f null - 2>&1
    Write-Host ("{0} + aac: {1}" -f $v, $(if ($LASTEXITCODE -eq 0) {'OK'} else {'FALHA'}))
}

Write-Host "`n== 6. Config global do Claude Code ==" -ForegroundColor Cyan
$dir = Join-Path $env:USERPROFILE '.claude'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$md = Join-Path $dir 'CLAUDE.md'
$marker = '<!-- ffmpeg-setup -->'
if (-not (Test-Path $md) -or -not (Select-String -Path $md -SimpleMatch $marker -Quiet)) {
$block = @"

$marker
## FFmpeg (edicao de video)
- FFmpeg 9.x, ffprobe e ffplay estao instalados globalmente e no PATH.
- Use ffprobe para inspecionar midia antes de processar.
- Prefira h264_nvenc / hevc_nvenc (GPU NVIDIA) quando disponivel; senao libx264 / libx265. Audio: aac.
- Nunca sobrescreva o arquivo original; grave a saida em novo arquivo (use -n ou nome distinto).
"@
    Add-Content -Path $md -Value $block -Encoding UTF8
    Write-Host "Adicionado a $md (conteudo existente preservado)."
} else { Write-Host "$md ja configurado." }
Write-Host "`nConcluido. Abra um novo terminal para o PATH valer em todas as sessoes."
