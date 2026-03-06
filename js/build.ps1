#Requires -Version 5.1
<#
.SYNOPSIS
	Bundles HarvestMoon JS source files into IIFE-wrapped outputs.

.DESCRIPTION
	For each source file in raw/, produces a matching wrapped file in built/
	under the HM namespace. Also produces built/HarvestMoon.js which includes
	everything combined.

	Source files in raw/ are expected to have no module.exports block —
	strip those from the originals before using this script.

.EXAMPLE
	.\build.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Namespace = 'HM'
$RawDir        = Join-Path $PSScriptRoot 'raw'
$BuiltIIFEDir  = Join-Path $PSScriptRoot 'built\IIFE'
$BundleIIFE     = Join-Path $PSScriptRoot 'built\IIFE\HarvestMoon.js'
$BundleESM     = Join-Path $PSScriptRoot 'built\HarvestMoon.mjs'
$BundleCJS     = Join-Path $PSScriptRoot 'built\HarvestMoon.cjs'

$SourceFiles = @(
	'common.js'
	'containers.js'
	'BinaryIO.js'
)

function Write-Step ($msg) { Write-Host "  $msg" -ForegroundColor Cyan }
function Write-Success ($msg) { Write-Host "  $msg" -ForegroundColor Green }
function Write-Fail ($msg) { Write-Host "  $msg" -ForegroundColor Red; exit 1 }

function Add-Indent ($src) {
	$lines = $src -split "`n"
	$indented = $lines | ForEach-Object {
		if ($_.Trim().Length -gt 0) { "`t$_" } else { $_ }
	}
	return $indented -join "`n"
}

function Write-UTF8 ($path, $content) {
	$dir = Split-Path $path -Parent
	if ($dir -and -not (Test-Path $dir)) {
		New-Item -ItemType Directory -Path $dir | Out-Null
	}
	[System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))
}

function Get-Header ($note) {
	$date = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ss')
	return "// HarvestMoon - auto-generated ($note)`n// DO NOT EDIT`n"
}

function Wrap-IIFE ($body, $exports) {
	$lines = @()
	$lines += "const $Namespace = (() => {"
	$lines += "    'use strict'"
	$lines += $body
	if ($exports.Count -gt 0) {
		$lines += "    return {"
		foreach ($name in $exports) {
			$lines += "        $name,"
		}
		$lines += "    }"
	}
	$lines += "})();"
	return $lines -join "`n"
}

function Remove-ExportKeywords ($src) {
	$src = $src -replace '(?m)^\s*export\s+', ''
	$src = $src -replace '(?m)^\s*export\s*\{[^}]*\}\s*(from[^;]*)?;', ''
	return $src
}

function Get-Exports-Via-Node ($FilePath) {
	$escapedPath = $FilePath -replace '\\', '\\'
	$nodeCmd = "import { pathToFileURL } from 'url'; import { resolve } from 'path'; const fileUrl = pathToFileURL(resolve('" + $escapedPath + "')).href; const mod = await import(fileUrl); console.log(JSON.stringify(Object.keys(mod)));"
	
	$json = node -e $nodeCmd 2>$null
	if (-not $json) { return @() }
	
	try {
		return $json | ConvertFrom-Json -ErrorAction Stop
	} catch {
		return @()
	}
}

# --- Build ---

if (-not (Test-Path $RawDir)) { Write-Fail "raw/ not found" }

if (-not (Test-Path $BuiltIIFEDir)) { 
	New-Item -ItemType Directory -Path $BuiltIIFEDir | Out-Null 
}

$bundleDir = Split-Path $BundleESM -Parent
if (-not (Test-Path $bundleDir)) { 
	New-Item -ItemType Directory -Path $bundleDir | Out-Null 
}

if (-not (Test-Path (Join-Path $PSScriptRoot 'package.json'))) {
	Write-Fail "package.json missing. Create: { `"type`": `"module`" }"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
	Write-Fail "Node.js not found in PATH"
}

$combinedBodyNoExport = [System.Text.StringBuilder]::new()
$combinedBodyWithExport = [System.Text.StringBuilder]::new()
$combinedExports = [System.Collections.Generic.List[string]]::new()

foreach ($fileName in $SourceFiles) {
	$inPath = Join-Path $RawDir $fileName
	$outPathIIFE = Join-Path $BuiltIIFEDir $fileName

	if (-not (Test-Path $inPath)) { Write-Fail "missing: $inPath" }
	Write-Step $fileName

	$exports = Get-Exports-Via-Node -FilePath $inPath
	Write-Success "  $($exports.Count) exports: $($exports -join ', ')"

	$raw = Get-Content $inPath -Raw -Encoding UTF8
	
	# For IIFE and CommonJS: strip export keywords
	$clean = Remove-ExportKeywords $raw
	$indented = Add-Indent $clean.Trim()
	
	# For ESM: keep export keywords, just indent
	$indentedESM = Add-Indent $raw.Trim()

	# 1. IIFE-wrapped individual file
	$fileContentIIFE = (Get-Header $fileName) + "`n" + (Wrap-IIFE $indented $exports)
	Write-UTF8 $outPathIIFE $fileContentIIFE

	# 2. Accumulate for CommonJS bundle (no exports)
	[void]$combinedBodyNoExport.AppendLine("// --- $fileName ---")
	[void]$combinedBodyNoExport.AppendLine($indented)
	[void]$combinedBodyNoExport.AppendLine()

	# 3. Accumulate for ESM bundle (keep exports)
	[void]$combinedBodyWithExport.AppendLine("// --- $fileName ---")
	[void]$combinedBodyWithExport.AppendLine($indentedESM)
	[void]$combinedBodyWithExport.AppendLine()

	foreach ($name in $exports) { 
		[void]$combinedExports.Add($name) 
	}
}

# --- ESM Bundle (keeps export keywords) ---
$esmContent = (Get-Header 'ES Module') + "`n" + $combinedBodyWithExport.ToString()
Write-UTF8 $BundleESM $esmContent

# --- CommonJS Bundle (no exports, adds module.exports at end) ---
$exportNames = $combinedExports -join ', '
$cjsContent = (Get-Header 'CommonJS') + "`n" + $combinedBodyNoExport.ToString()
$cjsContent += "`n// --- CommonJS Exports ---`n"
$cjsContent += "module.exports = { $exportNames };`n"
Write-UTF8 $BundleCJS $cjsContent

# --- IIFE Bundle ---
$IIFEContent = (Get-Header 'IIFE') + "`n" + $combinedBodyNoExport.ToString()
$IIFEContent += "`n// --- IIFE Exports ---`n"
$exports = Get-Exports-Via-Node -FilePath $BundleESM
Write-UTF8 $BundleIIFE $(Wrap-IIFE $IIFEContent $exports)

Write-Host ""
Write-Success "IIFE files   -> $BuiltIIFEDir"
Write-Success "ES Module    -> $BundleESM"
Write-Success "CommonJS     -> $BundleCJS"
Write-Success "Build Complete"