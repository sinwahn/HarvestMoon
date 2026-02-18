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

# config

$Namespace = 'HM'
$RawDir	= Join-Path $PSScriptRoot 'raw'
$BuiltDir = Join-Path $PSScriptRoot 'built'

# Dependency order matters for the combined bundle.
$Sources = @(
	[ordered]@{
		File = 'common.js'
		Exports = @('raise', 'raise_typeerror', 'assert', 'istype', 'expecttype', 'expectinstanceof')
	}
	[ordered]@{
		File = 'containers.js'
		Exports = @('Container', 'Vector', 'Map', 'Set', 'Stack', 'Queue')
	}
	[ordered]@{
		File = 'BinaryIO.js'
		Exports = @('BinaryContainer', 'BinaryReader', 'BinaryWriter', 'BinaryReaderTyped', 'BinaryWriterTyped', 'DebugBinaryReader', 'DebugBinaryWriter', 'clearBinaryHexData')
	}
)

# helpers

function Write-Step ([string]$msg) { Write-Host "  $msg" -ForegroundColor Cyan  }
function Write-Success ([string]$msg) { Write-Host "  $msg" -ForegroundColor Green }
function Write-Fail ([string]$msg) { Write-Host "  $msg" -ForegroundColor Red; exit 1 }

function Add-Indent ([string]$src) {
	$lines = $src -split "`n"
	$lines = $lines | ForEach-Object {
		if ($_.Trim().Length -gt 0) { "`t$_" } else { $_ }
	}
	return $lines -join "`n"
}

function Write-UTF8 ([string]$path, [string]$content) {
	[System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))
}

function Get-Header ([string]$note) {
	$date = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ss')
	return "// HarvestMoon - auto-generated bundle ($note)`n// DO NOT EDIT - edit source files in raw/ and re-run build.ps1`n"
}

function Wrap-IIFE ([string]$body, [string[]]$exports) {
	$exportLines = ($exports | ForEach-Object { "`t`t$_," }) -join "`n"
	return @"

const $Namespace = (() => {
`t'use strict'
$body
`t// --- exports ---
`treturn {
$exportLines
`t}
})();
"@
}

# build

if (-not (Test-Path $RawDir)) { Write-Fail "raw/ not found: $RawDir" }
if (-not (Test-Path $BuiltDir)) { New-Item -ItemType Directory -Path $BuiltDir | Out-Null }

$combinedBody = [System.Text.StringBuilder]::new()
$combinedExports = [System.Collections.Generic.List[string]]::new()
$divider = '-' * 72

foreach ($source in $Sources) {
	$inPath = Join-Path $RawDir $source.File
	$outPath = Join-Path $BuiltDir $source.File

	if (-not (Test-Path $inPath)) { Write-Fail "missing: $inPath" }

	Write-Step $source.File

	$raw = Get-Content $inPath -Raw -Encoding UTF8
	$indented = Add-Indent $raw.Trim()

	# per-file output
	$fileContent = (Get-Header $source.File) + (Wrap-IIFE $indented $source.Exports)
	Write-UTF8 $outPath $fileContent

	$sizeKB = [math]::Round((Get-Item $outPath).Length / 1KB, 1)
	Write-Success "  -> $( $source.File )  ($sizeKB KB)"

	# accumulate for combined bundle
	[void]$combinedBody.AppendLine("`t// $divider")
	[void]$combinedBody.AppendLine("`t// $( $source.File )")
	[void]$combinedBody.AppendLine("`t// $divider")
	[void]$combinedBody.AppendLine($indented)
	[void]$combinedBody.AppendLine()

	foreach ($name in $source.Exports) {
		$combinedExports.Add($name)
	}
}

# combined output
$bundlePath	= Join-Path $BuiltDir 'HarvestMoon.js'
$bundleContent = (Get-Header 'all') + (Wrap-IIFE $combinedBody.ToString() $combinedExports)
Write-UTF8 $bundlePath $bundleContent

$sizeKB = [math]::Round((Get-Item $bundlePath).Length / 1KB, 1)
Write-Host ""
Write-Success "-> HarvestMoon.js  ($sizeKB KB)"
