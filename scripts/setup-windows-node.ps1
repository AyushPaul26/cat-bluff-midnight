$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
New-Item -ItemType Directory -Force -Path '.tools/downloads' | Out-Null
$archive = '.tools/downloads/node-v22.22.0-win-x64.zip'
Invoke-WebRequest 'https://nodejs.org/dist/v22.22.0/node-v22.22.0-win-x64.zip' -OutFile $archive
Invoke-WebRequest 'https://nodejs.org/dist/v22.22.0/SHASUMS256.txt' -OutFile '.tools/downloads/SHASUMS256.txt'
$expected = ((Get-Content '.tools/downloads/SHASUMS256.txt' | Where-Object { $_ -match ' node-v22.22.0-win-x64.zip$' }) -split '\s+')[0]
$actual = (Get-FileHash $archive -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actual -ne $expected) { throw 'Official Node archive checksum mismatch' }
Expand-Archive -LiteralPath $archive -DestinationPath '.tools' -Force
& './.tools/node-v22.22.0-win-x64/node.exe' --version
