@echo off
echo Recreating DOTTIE.YZ frontend redesign...
echo.

echo Updating CSS variables and colors...
powershell -Command "(Get-Content 'src\css\style.css') -replace '--d-blue: #2563eb', '--d-accent: #B8956A' | Set-Content 'src\css\style.css'"
powershell -Command "(Get-Content 'src\css\style.css') -replace '--d-blue-light: #3b82f6', '--d-accent-light: #D4B896' | Set-Content 'src\css\style.css'"
powershell -Command "(Get-Content 'src\css\style.css') -replace '--d-blue-dark: #1d4ed8', '--d-accent-dark: #7A5C3E' | Set-Content 'src\css\style.css'"
powershell -Command "(Get-Content 'src\css\style.css') -replace 'rgba\(37, 99, 235', 'rgba(184, 149, 106' | Set-Content 'src\css\style.css'"

echo.
echo Updating HTML files with logo2.jpeg...
for %%f in (*.html) do (
    powershell -Command "(Get-Content '%%f') -replace 'logo\.jpeg', 'logo2.jpeg' | Set-Content '%%f'"
)

echo.
echo Updating HTML files with d-accent classes...
for %%f in (*.html) do (
    powershell -Command "(Get-Content '%%f') -replace 'text-d-blue', 'text-d-accent' | Set-Content '%%f'"
    powershell -Command "(Get-Content '%%f') -replace 'bg-d-blue', 'bg-d-accent' | Set-Content '%%f'"
    powershell -Command "(Get-Content '%%f') -replace 'border-d-blue', 'border-d-accent' | Set-Content '%%f'"
    powershell -Command "(Get-Content '%%f') -replace 'hover:bg-d-blue', 'hover:bg-d-accent' | Set-Content '%%f'"
)

echo.
echo Adding mobileMenuOpen to shop.js...
powershell -Command "$c = Get-Content 'src\js\shop.js'; $c = $c -replace 'scrolled: false,', 'scrolled: false,`n    mobileMenuOpen: false,'; Set-Content 'src\js\shop.js' $c"

echo.
echo Done! Now commit and push to correct repo.
pause
